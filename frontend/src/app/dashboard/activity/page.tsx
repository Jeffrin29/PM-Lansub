'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { activityApi } from '../../../lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await activityApi.getAll(filter !== 'all' ? `&module=${filter}` : '');
      setActivities(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getModuleColor = (mod: string) => {
    switch (mod) {
      case 'task': return 'bg-blue-500/20 text-blue-400';
      case 'project': return 'bg-purple-500/20 text-purple-400';
      case 'attendance': return 'bg-green-500/20 text-green-400';
      case 'leave': return 'bg-orange-500/20 text-orange-400';
      case 'discussion': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Activity Feed</h1>
          <p className="text-sm text-gray-400 mt-1">Track real-time actions across all modules.</p>
        </div>

        <div className="flex gap-2 bg-[#111827] border border-gray-800 p-1 rounded-xl overflow-x-auto">
          {['all', 'task', 'project', 'attendance', 'leave', 'discussion'].map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                filter === m ? 'bg-white text-black font-medium' : 'text-gray-400 hover:text-white'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 bg-[#111827] border border-gray-800 rounded-2xl">
            <p className="text-gray-500">No activities found.</p>
          </div>
        ) : (
          activities.map((item) => (
            <div
              key={item._id}
              className="group bg-[#111827] border border-gray-800 hover:border-gray-700/50 p-6 rounded-2xl shadow-sm transition-all flex gap-4 items-start"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center border border-gray-700 overflow-hidden">
                {item.userId?.avatar ? (
                  <img src={item.userId.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    {item.userId?.name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{item.userId?.name || 'Unknown User'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-tight ${getModuleColor(item.entityType)}`}>
                    {item.entityType}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{item.description}</p>
                <p className="text-gray-500 text-[11px] mt-2 font-medium">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}