'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { activityApi } from '../../../lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchActivities(); }, [filter]);

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

  /* Light-friendly module tag colors — stronger text for white bg */
  const getModuleColor = (mod: string) => {
    switch (mod) {
      case 'task':       return 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-transparent';
      case 'project':    return 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-transparent';
      case 'attendance': return 'bg-emerald-50 dark:bg-green-500/20 text-emerald-700 dark:text-green-400 border border-emerald-100 dark:border-transparent';
      case 'leave':      return 'bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-transparent';
      case 'discussion': return 'bg-pink-50 dark:bg-pink-500/20 text-pink-700 dark:text-pink-400 border border-pink-100 dark:border-transparent';
      default:           return 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-transparent';
    }
  };

  const FILTERS = ['all', 'task', 'project', 'attendance', 'leave', 'discussion'];

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-zinc-800/50 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Activity Feed</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track real-time actions across all modules.</p>
        </div>

        {/* Filter tab bar */}
        <div className="flex gap-1 bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-1 rounded-xl overflow-x-auto scrollbar-hide flex-shrink-0">
          {FILTERS.map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all whitespace-nowrap capitalize ${
                filter === m
                  ? 'bg-white dark:bg-white text-gray-900 dark:text-black shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-400 dark:text-gray-500 font-medium">No activities found.</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Try switching to a different filter.</p>
          </div>
        ) : (
          activities.map((item) => (
            <div
              key={item._id}
              className="group bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex gap-4 items-start"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-gray-700 overflow-hidden">
                {item.userId?.avatar ? (
                  <img src={item.userId.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                    {item.userId?.name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.userId?.name || 'Unknown User'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-tight ${getModuleColor(item.entityType)}`}>
                    {item.entityType}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.description}</p>
                <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-2 font-medium">
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