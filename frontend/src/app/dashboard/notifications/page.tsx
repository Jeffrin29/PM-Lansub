'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../../lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('unread');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
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
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markRead('all-read');
      fetchNotifications();
    } catch (err) { console.error(err); }
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
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-zinc-800/50 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Stay updated with system alerts and team activity.</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Segmented tab control */}
          <div className="flex gap-1 bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-1 rounded-xl">
            {['unread', 'all'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-1.5 text-sm rounded-lg font-medium transition-all capitalize ${
                  tab === t
                    ? 'bg-white dark:bg-white text-gray-900 dark:text-black shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            Mark all read
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
            <div className="text-4xl mb-4">🔔</div>
            <p className="text-gray-400 dark:text-gray-500 font-medium">No notifications yet.</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`group bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm transition-all flex gap-4 items-start hover:shadow-md ${
                n.readStatus
                  ? 'opacity-60 dark:opacity-50'
                  : 'hover:border-gray-300 dark:hover:border-gray-700/50'
              }`}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center text-lg border border-gray-200 dark:border-gray-700">
                {getTypeIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className={`text-sm font-semibold truncate ${
                      n.readStatus ? 'text-gray-400 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {n.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                  {!n.readStatus && (
                    <button
                      onClick={() => markRead(n._id)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition flex-shrink-0"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2.5">
                  <span className="text-gray-400 dark:text-gray-500 text-[11px] font-medium">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                  {n.link?.url && (
                    <a
                      href={n.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 underline underline-offset-4"
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
