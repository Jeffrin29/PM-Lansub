"use client";

import { useState, useEffect, useCallback } from "react";
import { discussionsApi } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Discussion {
  _id: string;
  topic: string;
  description: string;
  author?: { name: string; email: string };
  projectId?: { projectTitle: string };
  replyCount: number;
  lastActivityAt: string;
  isPinned: boolean;
  isClosed: boolean;
  createdAt: string;
  tags: string[];
  meetingLink?: string;
}

interface Comment {
  _id: string;
  content: string;
  author?: { name: string; email: string };
  createdAt: string;
}

interface DiscussionDetail extends Discussion {
  comments: Comment[];
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

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── New Discussion Modal ───────────────────────────────────────────────────────
function NewDiscussionModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: { topic: string; description: string; tags: string; meetingLink?: string }) => Promise<void>;
}) {
  const [form,   setForm]   = useState({ topic: "", description: "", tags: "", meetingLink: "" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic.trim()) { setError("Topic is required"); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold">New Discussion</h2>
          <button id="close-discussion-modal" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-500 transition">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic *</label>
            <input
              type="text"
              placeholder="What would you like to discuss?"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              rows={4}
              placeholder="Provide more context…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="design, frontend, api"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meeting Link (optional)</label>
            <input
              type="url"
              placeholder="Google Meet / Zoom Link"
              value={form.meetingLink}
              onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition">Cancel</button>
            <button id="create-discussion-btn" type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-60">
              {saving ? "Creating…" : "Create Discussion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Thread View ───────────────────────────────────────────────────────────────
function ThreadView({
  discussion,
  onClose,
  onComment,
}: {
  discussion: DiscussionDetail;
  onClose: () => void;
  onComment: (id: string, content: string) => Promise<void>;
}) {
  const [content,       setContent]       = useState("");
  const [sending,       setSending]       = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(discussion.comments || []);

  async function handleSend() {
    if (!content.trim()) return;
    setSending(true);
    try {
      await onComment(discussion._id, content);
      setLocalComments((prev) => [
        ...prev,
        { _id: Date.now().toString(), content, author: { name: "You", email: "" }, createdAt: new Date().toISOString() },
      ]);
      setContent("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{discussion.topic}</h2>
            {discussion.projectId && (
              <p className="text-xs text-gray-400 mt-0.5">{discussion.projectId.projectTitle}</p>
            )}
          </div>
          <button id="close-thread-btn" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-500 transition">✕</button>
        </div>
        {discussion.description && (
          <div className="px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-zinc-800">
            {discussion.description}
            {discussion.meetingLink && (
              <div className="mt-3">
                <a 
                  href={discussion.meetingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
                >
                  📹 Join Meeting
                </a>
              </div>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {localComments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No replies yet. Be the first!</p>
          ) : (
            localComments.map((c) => (
              <div key={c._id} className="flex gap-3">
                <Avatar name={c.author?.name || "?"} />
                <div className="flex-1 bg-gray-50 dark:bg-zinc-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.author?.name || "Unknown"}</span>
                    <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex gap-3">
          <input
            type="text"
            placeholder="Write a reply…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            id="send-reply-btn"
            onClick={handleSend}
            disabled={sending || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DiscussionsPage() {
  const [discussions,  setDiscussions]  = useState<Discussion[]>([]);
  const [showModal,    setShowModal]    = useState(false);
  const [activeThread, setActiveThread] = useState<DiscussionDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await discussionsApi.getAll();
      setDiscussions(res?.data?.data || res?.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load discussions");
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleCreate(data: { topic: string; description: string; tags: string; meetingLink?: string }) {
    const tags = data.tags.split(",").map((t) => t.trim()).filter(Boolean);
    await discussionsApi.create({ ...data, tags, meetingLink: data.meetingLink || "" });
    await fetchAll();
  }

  async function openThread(id: string) {
    try {
      const res = await discussionsApi.getById(id);
      setActiveThread(res?.data);
    } catch (err: any) {
      // Show error in thread area rather than silently failing
      setError(`Failed to open discussion: ${err.message}`);
    }
  }

  async function handleComment(discussionId: string, content: string) {
    await discussionsApi.addComment(discussionId, content);
  }

  return (
    <div className="space-y-8 pb-8">
      {showModal && <NewDiscussionModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
      {activeThread && (
        <ThreadView
          discussion={activeThread}
          onClose={() => setActiveThread(null)}
          onComment={handleComment}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Discussions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Team conversations and decisions</p>
        </div>
        <button
          id="new-discussion-btn"
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md transition"
        >
          ＋ New Discussion
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl">
          ⚠️ {error}
          <button onClick={fetchAll} className="ml-3 underline text-xs">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
              <th className="px-6 py-4 font-semibold">Topic</th>
              <th className="px-6 py-4 font-semibold">Project</th>
              <th className="px-6 py-4 font-semibold">Meeting Link</th>
              <th className="px-6 py-4 font-semibold">Author</th>
              <th className="px-6 py-4 font-semibold text-center">Replies</th>
              <th className="px-6 py-4 font-semibold">Last Activity</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading…
                  </div>
                </td>
              </tr>
            ) : discussions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-400">
                  <span className="text-3xl block mb-2">💬</span>
                  No discussions yet. Start a new one!
                </td>
              </tr>
            ) : discussions.map((d) => (
              <tr
                key={d._id}
                className="border-t border-gray-50 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {d.isPinned && <span title="Pinned" className="text-amber-500 text-xs">📌</span>}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{d.topic}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {d.tags?.map((tag) => (
                          <span key={tag} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      {d.meetingLink && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter flex items-center gap-1 border border-green-500/20">
                            📹 Live Meeting Call
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {d.projectId?.projectTitle || <span className="text-gray-300 dark:text-gray-600">—</span>}
                </td>
                <td className="px-6 py-4 text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  {d.meetingLink ? (
                    <a href={d.meetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Join Meeting
                    </a>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">No link</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Avatar name={d.author?.name || "?"} />
                    <span className="text-gray-700 dark:text-gray-300">{d.author?.name || "Unknown"}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
                    {d.replyCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                  {timeAgo(d.lastActivityAt || d.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <button
                    id={`open-thread-${d._id}`}
                    onClick={() => openThread(d._id)}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                  >
                    Open Thread →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
