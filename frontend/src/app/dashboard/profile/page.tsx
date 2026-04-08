'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { userApi, activityApi, attendanceApi, leaveApi } from '../../../lib/api';
import { format } from 'date-fns';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Forms
  const [profileForm, setProfileForm] = useState<any>({});
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, aRes, sRes, lRes] = await Promise.all([
        userApi.getMe(),
        activityApi.getAll(), // Activity for this user specifically would be better but getAll returns latest
        attendanceApi.getStats(),
        leaveApi.getHistory()
      ]);
      
      setUser(uRes.data);
      setProfileForm(uRes.data);
      setActivities(aRes.data || []);
      setAttendanceStats(sRes.data);
      setLeaves(lRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await userApi.updateProfile(profileForm);
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setMsg({ type: 'error', text: 'Passwords do not match.' });
    }
    try {
      setUpdating(true);
      await userApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setMsg({ type: 'success', text: 'Password changed successfully!' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Col: Profile Card & Quick Stats */}
        <div className="lg:w-1/3 mt-1.5 space-y-6">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 text-center relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 left-0 w-full h-32 bg-[#1f2937]/30 -z-10 transition-transform duration-700"></div>
            
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-2xl bg-zinc-800 border border-gray-700 mx-auto flex items-center justify-center text-3xl font-bold text-gray-500 shadow-xl overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-[#111827] rounded-full"></div>
            </div>

            <h2 className="text-xl font-semibold text-white mt-6">{user?.name}</h2>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mt-1">{user?.role?.displayName || user?.role}</p>
            <p className="text-gray-500 text-sm mt-4 font-medium">{user?.department || 'Operations'} · {user?.workLocation || 'Hybrid'}</p>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-[#1f2937]/50 p-4 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1">Emp ID</p>
                <p className="text-gray-200 font-mono text-xs">{user?.employeeId || 'LAN-001'}</p>
              </div>
              <div className="bg-[#1f2937]/50 p-4 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1">Joined</p>
                <p className="text-gray-200 font-mono text-xs">{user?.joiningDate ? format(new Date(user.joiningDate), 'MMM yyyy') : 'Jan 2024'}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider border-b border-gray-800 pb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400 font-medium uppercase">Attendance</span>
                  <span className="text-green-500 font-semibold">{attendanceStats?.attendancePercentage || 0}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${attendanceStats?.attendancePercentage || 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400 font-medium uppercase">Leave used</span>
                  <span className="text-blue-500 font-semibold">{leaves.filter(l => l.status === 'Approved').length} / 12d</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${(leaves.filter(l => l.status === 'Approved').length / 12) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Forms & Tabs */}
        <div className="flex-1 space-y-8">
          
          {/* Messages */}
          {msg.text && (
            <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
              msg.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {msg.type === 'success' ? '✅' : '⚠️'} {msg.text}
            </div>
          )}

          {/* Personal Information */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-white">Personal Information</h3>
                <p className="text-sm text-gray-400 mt-1">Manage your public profile and contact details</p>
              </div>
              <button 
                onClick={handleUpdateProfile}
                disabled={updating}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Full Name</label>
                <input 
                  value={profileForm.name || ''} 
                  onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Phone Number</label>
                <input 
                  value={profileForm.phone || ''} 
                  onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Birthday</label>
                <input 
                  type="date"
                  value={profileForm.birthday ? format(new Date(profileForm.birthday), 'yyyy-MM-dd') : ''} 
                  onChange={e => setProfileForm({...profileForm, birthday: e.target.value})}
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Gender</label>
                <select 
                  value={profileForm.gender || ''}
                  onChange={e => setProfileForm({...profileForm, gender: e.target.value})}
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-600"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-medium text-gray-400">Current Address</label>
                <textarea 
                  rows={3}
                  value={profileForm.address || ''} 
                  onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-600 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Security / Password */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold tracking-tight text-white mb-2">Security & Password</h3>
            <p className="text-sm text-gray-400 mb-8">Update your password to keep your account secure</p>
            <form onSubmit={handleChangePw} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  type="password"
                  placeholder="Current Password"
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})}
                  className="bg-[#1f2937] border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-600"
                />
                <input 
                  type="password"
                  placeholder="New Password"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({...pwForm, newPassword: e.target.value})}
                  className="bg-[#1f2937] border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-600"
                />
                <input 
                  type="password"
                  placeholder="Confirm New"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})}
                  className="bg-[#1f2937] border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-600"
                />
              </div>
              <button 
                type="submit"
                disabled={updating}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                Change Credentials
              </button>
            </form>
          </div>

          {/* Activity Mini Log */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold tracking-tight text-white mb-2">My Recent Actions</h3>
            <p className="text-sm text-gray-400 mb-8">A briefly summary of your latest system activities</p>
            <div className="space-y-3">
              {activities.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#1f2937]/30 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-300">{a.description}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">{format(new Date(a.createdAt), 'HH:mm d MMM')}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
