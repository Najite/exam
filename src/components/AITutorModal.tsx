'use client';

import React, { useState } from 'react';
import { X, Bot, Send, Loader2, Sparkles, User, Lightbulb } from 'lucide-react';
import { Question } from '@/types';

interface AITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  userAnswer?: string | string[];
}

interface Message {
  role: 'tutor' | 'user';
  text: string;
}

export function AITutorModal({ isOpen, onClose, question, userAnswer }: AITutorModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'tutor',
      text: `Hey! I'm Pastor Jordan, your Youth Ministry AI mentor. Let's look at this passage together: **"${question.topic}"**.\n\n${question.explanation}\n\nWhat questions do you have about this Scripture, or how to apply this to real life as a teenager?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userQuestion: userMsg,
          userAnswer,
        }),
      });

      const data = await res.json();
      if (data.success && data.answer) {
        setMessages((prev) => [...prev, { role: 'tutor', text: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'tutor', text: `⚠️ AI Tutor Error: ${data.error || 'Failed to generate response.'}` },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'tutor', text: `⚠️ Connection Error: ${err.message || 'Failed to reach AI Tutor service.'}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col h-[75vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Pastor Jordan (Youth Ministry AI)</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                  {question.topic}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Authentic Bible mentorship & real-life teen application</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Context Banner */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 text-xs text-slate-300">
          <div className="font-semibold text-slate-400 mb-1">Question Reference:</div>
          <p className="line-clamp-2 text-slate-200">{question.text}</p>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'tutor' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-bl-xs'
                }`}
              >
                {m.text}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                <span>AI Tutor is formulating an intuitive explanation...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-6 py-2 bg-slate-900 border-t border-slate-800/80 flex gap-2 overflow-x-auto text-[11px]">
          <button
            type="button"
            onClick={() => handleQuickPrompt("How does this apply to peer pressure and standing out at school?")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shrink-0 transition"
          >
            Peer pressure & school life
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("What does this passage reveal about my true identity in Christ?")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shrink-0 transition"
          >
            My identity in Christ
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("How can I explain this biblical truth to my friends who doubt or disagree?")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shrink-0 transition"
          >
            Sharing with friends / Apologetics
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt("What key anchor scripture or memory verse should I memorize for this?")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shrink-0 transition"
          >
            Key anchor verse
          </button>
        </div>

        {/* Input Field */}
        <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Tutor a question about this problem..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

