/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  MessageSquare, 
  User, 
  CreditCard, 
  Megaphone, 
  Key, 
  HelpCircle,
  Send,
  History,
  Trash2,
  ChevronRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { classificationService, MessageType, ClassificationResult } from './services/classificationService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MessageRecord {
  id: string;
  text: string;
  result: ClassificationResult;
  timestamp: number;
}

export default function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MessageRecord[]>([]);
  const [currentResult, setCurrentResult] = useState<ClassificationResult | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('msg_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('msg_history', JSON.stringify(history));
  }, [history]);

  const handleClassify = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      const result = await classificationService.classifyMessage(input);
      setCurrentResult(result);
      
      const newRecord: MessageRecord = {
        id: crypto.randomUUID(),
        text: input,
        result,
        timestamp: Date.now(),
      };
      
      setHistory(prev => [newRecord, ...prev]);
      setInput('');
    } catch (error) {
      console.error("Classification failed", error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Clear all history?')) {
      setHistory([]);
      setCurrentResult(null);
    }
  };

  const getIcon = (type: MessageType) => {
    switch (type) {
      case MessageType.SPAM: return <ShieldAlert className="text-red-500" />;
      case MessageType.PERSONAL: return <User className="text-blue-500" />;
      case MessageType.TRANSACTIONAL: return <CreditCard className="text-emerald-500" />;
      case MessageType.MARKETING: return <Megaphone className="text-orange-500" />;
      case MessageType.OTP: return <Key className="text-purple-500" />;
      default: return <HelpCircle className="text-zinc-400" />;
    }
  };

  const getColorClass = (type: MessageType) => {
    switch (type) {
      case MessageType.SPAM: return "bg-red-50 text-red-700 border-red-100";
      case MessageType.PERSONAL: return "bg-blue-50 text-blue-700 border-blue-100";
      case MessageType.TRANSACTIONAL: return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case MessageType.MARKETING: return "bg-orange-50 text-orange-700 border-orange-100";
      case MessageType.OTP: return "bg-purple-50 text-purple-700 border-purple-100";
      default: return "bg-zinc-50 text-zinc-700 border-zinc-100";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 py-0 sm:py-8">
      <div className="mobile-container">
        {/* Header */}
        <header className="p-6 border-bottom border-zinc-100 bg-white sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <MessageSquare className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-tight">MsgClassifier</h1>
              <p className="text-xs text-zinc-500">AI Message Analysis</p>
            </div>
          </div>
          {history.length > 0 && (
            <button 
              onClick={clearHistory}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-red-500"
            >
              <Trash2 size={20} />
            </button>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
          
          {/* Input Section */}
          <section className="space-y-4">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste a message here to classify..."
                className="input-field h-32"
                disabled={loading}
              />
              <button
                onClick={handleClassify}
                disabled={!input.trim() || loading}
                className="absolute bottom-4 right-4 btn-primary flex items-center gap-2 py-2 px-4"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <span>Classify</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Current Result */}
          <AnimatePresence>
            {currentResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "p-6 rounded-2xl border-2 space-y-4",
                  getColorClass(currentResult.type)
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {getIcon(currentResult.type)}
                    </div>
                    <span className="font-bold text-xl tracking-tight">{currentResult.type}</span>
                  </div>
                  <div className="text-xs font-mono opacity-70">
                    {(currentResult.confidence * 100).toFixed(0)}% Match
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-relaxed">
                    {currentResult.reason}
                  </p>
                  <div className="h-px bg-current opacity-10 w-full" />
                  <p className="text-xs opacity-80 italic">
                    Summary: {currentResult.summary}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <History size={16} />
              <h2 className="text-xs font-semibold uppercase tracking-widest">Recent History</h2>
            </div>

            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="text-zinc-200" />
                  </div>
                  <p className="text-zinc-400 text-sm">No messages classified yet.</p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-4 flex items-center gap-4 group cursor-pointer hover:border-zinc-300 transition-all"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      getColorClass(item.result.type)
                    )}>
                      {getIcon(item.result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm truncate">{item.result.type}</h3>
                        <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {item.text}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </main>

        {/* Bottom Nav / Status */}
        <footer className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-zinc-100 flex items-center justify-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">AI Engine Active • Gemini 3 Flash</span>
        </footer>
      </div>
    </div>
  );
}
