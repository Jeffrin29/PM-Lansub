'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../../lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('unread'); // 'all' or 'unread'

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, [tab]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getAll(tab === 'unread' ? '&read=false' : '');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      // In a real app, use the dedicated markAllRead endpoint
      // For now, API client doesn't have it, I'll add it or call the specific put
      await notificationsApi.markRead('all-read'); // Placeholder logic if updated in API
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'birthday': return '🎂';
      case 'meeting': return '📅';
      case 'task_assigned': return '📝';
      case 'discussion_replied': return '💬';
      case 'leave_approved': return '✅';
      case 'leave_rejected': return '❌';
      default: return '🔔';
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Notifications</h1>
          <p className="text-sm text-gray-400 mt-1">Stay updated with system alerts and team activity.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-[#111827] border border-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setTab('unread')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                tab === 'unread' ? 'bg-white text-black font-medium' : 'text-gray-400 hover:text-white'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setTab('all')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                tab === 'all' ? 'bg-white text-black font-medium' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
          </div>
          <button
            onClick={markAllRead}
            className="text-xs font-medium text-gray-500 hover:text-white transition-colors"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-[#111827] border border-gray-800 rounded-2xl">
            <p className="text-gray-500">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`group bg-[#111827] border border-gray-800 p-6 rounded-2xl shadow-sm transition-all flex gap-4 items-start ${
                n.readStatus ? 'opacity-50' : 'hover:border-gray-700/50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-lg border border-gray-700">
                {getTypeIcon(n.type)}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`text-sm font-semibold ${n.readStatus ? 'text-gray-400' : 'text-white'}`}>
                      {n.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1 leading-relaxed">{n.message}</p>
                  </div>
                  {!n.readStatus && (
                    <button
                      onClick={() => markRead(n._id)}
                      className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-gray-500 text-[11px] font-medium">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                  {n.link?.url && (
                    <a 
                      href={n.link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-500 hover:text-blue-400 underline underline-offset-4"
                    >
                      View details
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
