'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Clock,
  Sparkles,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  X,
  Plus,
  ArrowRight,
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

const QuickActionCard = ({
  icon: Icon,
  title,
  description,
  onClick
}: {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="relative group p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-blue-500/40 transition-all duration-300 text-left overflow-hidden h-full"
  >
    {/* Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

    <div className="relative z-10">
      <div className="p-3 w-fit rounded-xl bg-zinc-800/80 group-hover:bg-blue-600/10 group-hover:text-blue-400 transition-all mb-4 border border-zinc-700/50 group-hover:border-blue-500/20">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-zinc-100 mb-1.5 uppercase tracking-wider group-hover:text-blue-300 transition-colors">
        {title}
      </h3>
      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
        {description}
      </p>
    </div>

    {/* Animated glow */}
    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" />
  </motion.button>
);

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Project Assistant. How can I help you manage your projects today? You can ask me to generate tasks, summarize project status, or identify potential risks.",
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

  const quickActions = [
    {
      icon: Plus,
      title: "Generate Tasks",
      description: "Automatically create subtasks and milestones based on project scope."
    },
    {
      icon: BarChart3,
      title: "Project Summary",
      description: "Get a high-level executive summary of recent progress and roadblocks."
    },
    {
      icon: AlertTriangle,
      title: "Risk Insights",
      description: "Identify potential delays and resource bottlenecks before they happen."
    },
    {
      icon: Lightbulb,
      title: "Smart Suggestions",
      description: "AI-driven tips to optimize your workflow and team efficiency."
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full max-w-6xl mx-auto text-zinc-300 font-sans p-2">

      {/* Header Section */}
      <header className="flex items-center justify-between mb-8 px-2">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-900/20">
              <Sparkles className="w-5 h-5 text-white fill-white/20" />
            </span>
            AI Assistant
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Generate tasks, insights, and smart suggestions</p>
        </div>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 transition-all text-sm font-medium text-zinc-400 hover:text-white"
        >
          <Clock className="w-4 h-4" />
          History
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-0 relative mb-8">
        {/* Chat Container */}
        <div className="flex-1 flex flex-col bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  "flex w-full",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className={clsx(
                  "flex gap-4 max-w-[85%]",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    msg.role === 'user' ? "bg-blue-600/20 text-blue-400" : "bg-purple-600/20 text-purple-400"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={clsx(
                    "rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm",
                    msg.role === 'user'
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-zinc-800/90 border border-zinc-700/50 text-zinc-100 rounded-tl-none ring-1 ring-white/5"
                  )}>
                    {msg.content}
                    <div className={clsx(
                      "text-[10px] mt-2 opacity-50 font-bold",
                      msg.role === 'user' ? "text-blue-100" : "text-zinc-500"
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-zinc-800/90 border border-zinc-700/50 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm">
                    <div className="flex gap-1.5 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 bg-blue-500 rounded-full"
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
          <div className="p-6 border-t border-zinc-800/50 bg-zinc-900/60 backdrop-blur-sm">
            <div className="relative flex items-end gap-3 bg-zinc-950 border border-zinc-800 p-2 pl-5 rounded-2xl focus-within:border-blue-500/40 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all group">
              <textarea
                placeholder="Ask AI about your project..."
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-zinc-600 py-3 resize-none text-[15px] outline-none min-h-[44px]"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className={clsx(
                  "p-3 rounded-xl transition-all mb-0.5",
                  inputValue.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 scale-100"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed scale-95"
                )}
              >
                <div className="relative">
                  <Send className="w-5 h-5 relative z-10" />
                  <motion.div
                    animate={inputValue.trim() ? { scale: [1, 1.2, 1], opacity: [0, 0.5, 0] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-white rounded-full blur-md"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* History Drawer Overlay Layer */}
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
                className="fixed top-0 right-0 h-full w-[400px] bg-zinc-900 border-l border-zinc-800 z-[70] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col"
              >
                <div className="p-8 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900">
                  <div>
                    <h2 className="text-xl font-bold text-white">Chat History</h2>
                    <p className="text-xs text-zinc-500 mt-1 uppercase tracking-tight font-medium">Cloud synchronized</p>
                  </div>
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-2.5 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-zinc-900">
                  {dummyHistory.map((chat) => (
                    <button
                      key={chat.id}
                      className="w-full text-left p-5 rounded-2xl bg-zinc-900 border border-zinc-800/50 hover:border-blue-500/30 hover:bg-zinc-800/50 transition-all group relative overflow-hidden"
                    >
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-zinc-100 group-hover:text-blue-400 transition-colors text-sm">{chat.title}</span>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">{chat.date}</span>
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-1 leading-relaxed">{chat.lastMessage}</p>
                      </div>
                    </button>
                  ))}

                  <button className="w-full py-6 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">
                    View full archive <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 border-t border-zinc-800/50 bg-zinc-950/30">
                  <button className="w-full py-4 rounded-xl bg-blue-600/5 border border-blue-500/20 text-blue-400 text-[13px] font-bold hover:bg-blue-600/10 transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
                    <Plus className="w-4 h-4" /> Start New Conversation
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
        {quickActions.map((action, idx) => (
          <QuickActionCard
            key={idx}
            icon={action.icon}
            title={action.title}
            description={action.description}
            onClick={() => {
              setInputValue(action.title);
            }}
          />
        ))}
      </div>
    </div>
  );
}

