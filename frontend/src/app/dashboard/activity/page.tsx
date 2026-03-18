"use client";

import { useState, useEffect, useCallback } from "react";
import api from "../../../lib/api";

interface Activity {
  _id: string;
  action: string;
  entityType: string;
  metadata: Record<string, string>;
  createdAt: string;
  userId?: { name: string; email: string };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const actionConfig: Record<string, { icon: string; color: string; label: (m: Record<string, string>) => string }> = {
  "task:created":       { icon: "✅", color: "bg-blue-500",    label: (m) => `Created task "${m.title || ""}"` },
  "task:updated":       { icon: "📝", color: "bg-violet-500",  label: (m) => `Updated task "${m.title || ""}"` },
  "task:moved":         { icon: "🔄", color: "bg-amber-500",   label: (m) => `Moved task to ${m.status || ""}` },
  "task:completed":     { icon: "🎉", color: "bg-emerald-500", label: () => "Completed a task" },
  "task:assigned":      { icon: "👤", color: "bg-teal-500",    label: (m) => `Assigned task to ${m.assignee || ""}` },
  "project:created":    { icon: "🚀", color: "bg-indigo-500",  label: (m) => `Created project "${m.title || ""}"` },
  "project:updated":    { icon: "⚙️", color: "bg-gray-500",   label: () => "Updated a project" },
  "comment:added":      { icon: "💬", color: "bg-pink-500",    label: () => "Added a comment" },
  "file:uploaded":      { icon: "📎", color: "bg-orange-500",  label: (m) => `Uploaded ${m.filename || "a file"}` },
  "timesheet:submitted":{ icon: "⏱", color: "bg-blue-600",    label: () => "Submitted a timesheet" },
  "discussion:created": { icon: "🗣️", color: "bg-rose-500",   label: (m) => `Started discussion "${m.topic || ""}"` },
};

function ActivityItem({ item }: { item: Activity }) {
  const cfg = actionConfig[item.action] || { icon: "🔔", color: "bg-gray-400", label: () => item.action };
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-full ${cfg.color} flex items-center justify-center text-white text-sm flex-shrink-0 shadow-md`}>
          {cfg.icon}
        </div>
        <div className="w-px flex-1 bg-gray-100 dark:bg-zinc-800 mt-2 mb-0" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm group-hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {item.userId?.name || "System"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {cfg.label(item.metadata)}
              </p>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
              {timeAgo(item.createdAt)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full text-white ${cfg.color}`}>
              {item.entityType}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const DEMO_ACTIVITIES: Activity[] = [
  { _id: "1", action: "task:created", entityType: "task", metadata: { title: "Deploy API" }, createdAt: new Date(Date.now() - 5 * 60000).toISOString(), userId: { name: "John Doe", email: "" } },
  { _id: "2", action: "file:uploaded", entityType: "file", metadata: { filename: "design.figma" }, createdAt: new Date(Date.now() - 22 * 60000).toISOString(), userId: { name: "Maria Smith", email: "" } },
  { _id: "3", action: "task:moved", entityType: "task", metadata: { status: "In Progress" }, createdAt: new Date(Date.now() - 60 * 60000).toISOString(), userId: { name: "Alex Lee", email: "" } },
  { _id: "4", action: "comment:added", entityType: "comment", metadata: {}, createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), userId: { name: "Dana R.", email: "" } },
  { _id: "5", action: "task:completed", entityType: "task", metadata: { title: "API Testing" }, createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), userId: { name: "Emma W.", email: "" } },
  { _id: "6", action: "project:created", entityType: "project", metadata: { title: "CRM System" }, createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), userId: { name: "John Doe", email: "" } },
  { _id: "7", action: "timesheet:submitted", entityType: "timesheet", metadata: {}, createdAt: new Date(Date.now() - 27 * 3600000).toISOString(), userId: { name: "Maria Smith", email: "" } },
  { _id: "8", action: "discussion:created", entityType: "discussion", metadata: { topic: "Sprint Planning" }, createdAt: new Date(Date.now() - 48 * 3600000).toISOString(), userId: { name: "Alex Lee", email: "" } },
];

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>("/activity?limit=30");
      setActivities(res?.data?.data || []);
    } catch (_) {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const display = activities.length ? activities : DEMO_ACTIVITIES;
  const entityTypes = ["all", ...Array.from(new Set(display.map((a) => a.entityType)))];
  const filtered = filter === "all" ? display : display.filter((a) => a.entityType === filter);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Feed</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track every action across your workspace
          </p>
        </div>
        <button
          id="refresh-activity-btn"
          onClick={fetchData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {entityTypes.map((type) => (
          <button
            id={`filter-activity-${type}`}
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === type
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-blue-300"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="max-w-2xl">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-4xl">📋</span>
            <p className="mt-3 text-sm">No activities yet</p>
          </div>
        ) : (
          filtered.map((item) => <ActivityItem key={item._id} item={item} />)
        )}
      </div>
    </div>
  );
}