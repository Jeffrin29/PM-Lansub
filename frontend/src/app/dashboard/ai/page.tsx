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

    // Simulate AI response
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
    <div className="flex flex-col min-h-screen w-full max-w-5xl mx-auto text-zinc-300 font-sans p-4 md:p-8">

      {/* Header Section */}
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            AI Assistant
          </h1>
          <p className="text-zinc-500 mt-1.5 text-sm font-medium">Generate tasks, insights, and smart suggestions</p>
        </div>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 transition-all text-sm font-medium text-zinc-400 hover:text-white"
        >
          <Clock className="w-4 h-4" />
          History
        </button>
      </header>

      {/* Centered Chat Container */}
      <div className="flex flex-col h-[70vh] md:h-[75vh] w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-[2.5rem] overflow-hidden shadow-2xl relative">

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                "flex w-full mb-6",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={clsx(
                "flex gap-4 max-w-[80%] md:max-w-[70%]",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                <div className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  msg.role === 'user' ? "bg-blue-600/10 text-blue-400" : "bg-zinc-800 text-zinc-400"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={clsx(
                  "rounded-3xl px-6 py-4 text-sm md:text-base leading-relaxed shadow-sm",
                  msg.role === 'user'
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-zinc-800/80 border border-zinc-700/30 text-zinc-100 rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start mb-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-zinc-800/80 border border-zinc-700/30 rounded-3xl rounded-tl-none px-6 py-4">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 bg-zinc-500 rounded-full"
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
        <div className="p-6 md:p-8 bg-zinc-900/80 border-t border-zinc-800/50">
          <div className="max-w-4xl mx-auto relative flex items-center gap-3 bg-zinc-950/50 border border-zinc-800 px-4 py-2 rounded-[2rem] focus-within:border-zinc-600 transition-all group shadow-inner">
            <input
              type="text"
              placeholder="Ask AI about your project..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-zinc-600 px-3 py-3 text-[15px] outline-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className={clsx(
                "p-3 rounded-2xl transition-all",
                inputValue.trim()
                  ? "bg-zinc-100 text-zinc-900 hover:bg-white scale-100 shadow-lg"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed scale-95"
              )}
            >
              <Send className="w-5 h-5" />
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
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-zinc-900 border-l border-zinc-800 z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-8 flex items-center justify-between border-b border-zinc-800/50">
                <div>
                  <h2 className="text-xl font-bold text-white">Chat History</h2>
                  <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Previous Conversations</p>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {dummyHistory.map((chat) => (
                  <button
                    key={chat.id}
                    className="w-full text-left p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-zinc-100 group-hover:text-white transition-colors text-sm">{chat.title}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">{chat.date}</span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1 leading-relaxed group-hover:text-zinc-400">{chat.lastMessage}</p>
                  </button>
                ))}
              </div>
              <div className="p-6 border-t border-zinc-800/50">
                <button className="w-full py-4 rounded-2xl bg-zinc-100 text-zinc-900 font-bold hover:bg-white transition-all flex items-center justify-center gap-2 text-sm">
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

