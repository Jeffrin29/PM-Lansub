'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Clock,
  Sparkles,
  X,
  Plus,
  User,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  date: string;
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Project Assistant. How can I help you manage your projects today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've analyzed your request about "${newUserMessage.content}". Based on current project data, I recommend focusing on the Q2 milestones and reallocating 2 developers to the critical path.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1800);
  };

  const dummyHistory: ChatHistory[] = [
    { id: '1', title: 'Q1 Sprint Planning', lastMessage: 'Should we prioritize the legacy migration?', date: '12 mins ago' },
    { id: '2', title: 'Risk Analysis Report', lastMessage: 'Summary of critical roadblocks...', date: '3 hours ago' },
    { id: '3', title: 'Task Generation', lastMessage: 'Generated 15 tasks for frontend refactor.', date: 'Yesterday' },
    { id: '4', title: 'Resource Allocation', lastMessage: 'Team capacity looks good for next week.', date: 'Oct 12' },
  ];

  return (
    /* Light: soft slate bg, dark gray text | Dark: unchanged */
    <div className="flex flex-col min-h-screen w-full max-w-5xl mx-auto text-gray-700 dark:text-zinc-300 font-sans p-4 md:p-8">

      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            AI Assistant
          </h1>
          <p className="text-gray-500 dark:text-zinc-500 mt-1.5 text-sm font-medium">
            Generate tasks, insights, and smart suggestions
          </p>
        </div>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white shadow-sm"
        >
          <Clock className="w-4 h-4" />
          History
        </button>
      </header>

      {/* Chat Container — white card in light, dark translucent in dark */}
      <div className="flex flex-col h-[70vh] md:h-[75vh] w-full bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800/80 rounded-[2.5rem] overflow-hidden shadow-md dark:shadow-2xl relative">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 scrollbar-hide">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                "flex w-full",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={clsx(
                "flex gap-3 max-w-[85%] md:max-w-[72%]",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                {/* Avatar */}
                <div className={clsx(
                  "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  msg.role === 'user'
                    ? "bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400"
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={clsx(
                  "rounded-3xl px-5 py-3.5 text-sm md:text-[15px] leading-relaxed",
                  msg.role === 'user'
                    ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                    : "bg-gray-100 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/30 text-gray-800 dark:text-zinc-100 rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-100 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/30 rounded-3xl rounded-tl-none px-5 py-4">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 bg-gray-400 dark:bg-zinc-500 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gray-50 dark:bg-zinc-900/80 border-t border-gray-200 dark:border-zinc-800/50">
          <div className="max-w-4xl mx-auto relative flex items-center gap-3 bg-white dark:bg-zinc-950/50 border border-gray-300 dark:border-zinc-800 px-4 py-2 rounded-[2rem] focus-within:border-blue-400 dark:focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-blue-400/20 dark:focus-within:ring-0 transition-all shadow-sm">
            <input
              type="text"
              placeholder="Ask AI about your project..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 px-3 py-3 text-[15px] outline-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className={clsx(
                "p-3 rounded-2xl transition-all",
                inputValue.trim()
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              /* Light: white drawer | Dark: zinc-900 unchanged */
              className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 z-[70] shadow-2xl flex flex-col"
            >
              {/* Drawer header */}
              <div className="p-7 flex items-center justify-between border-b border-gray-200 dark:border-zinc-800/50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chat History</h2>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Previous Conversations</p>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* History items */}
              <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
                {dummyHistory.map((chat) => (
                  <button
                    key={chat.id}
                    className="w-full text-left p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800/50 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-semibold text-gray-800 dark:text-zinc-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors text-sm">
                        {chat.title}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase flex-shrink-0 ml-2">
                        {chat.date}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 line-clamp-1 leading-relaxed group-hover:text-gray-600 dark:group-hover:text-zinc-400">
                      {chat.lastMessage}
                    </p>
                  </button>
                ))}
              </div>

              {/* New conversation button */}
              <div className="p-5 border-t border-gray-200 dark:border-zinc-800/50">
                <button className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20">
                  <Plus className="w-4 h-4" /> Start New Conversation
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
