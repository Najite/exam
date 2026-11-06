'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, Copy, Check } from 'lucide-react';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
}

export function ScratchpadModal({ isOpen, onClose, examId }: ScratchpadModalProps) {
  const storageKey = `cbt_scratchpad_${examId}`;
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setContent(saved);
  }, [storageKey]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    localStorage.setItem(storageKey, val);
  };

  const handleClear = () => {
    if (confirm('Clear scratchpad rough sheet?')) {
      setContent('');
      localStorage.removeItem(storageKey);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col h-[70vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Candidate Rough Sheet & Scratchpad</h2>
              <p className="text-xs text-slate-400">Notes are private and auto-saved locally</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition"
              title="Copy notes"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition"
              title="Clear notes"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="p-4 flex-1 flex flex-col bg-slate-950">
          <textarea
            value={content}
            onChange={handleChange}
            placeholder="Type your scratch notes, equations, code sketches, or rough workings here..."
            className="w-full flex-1 bg-transparent border-0 text-slate-200 font-mono text-sm leading-relaxed resize-none focus:outline-hidden placeholder-slate-600"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{content.trim() ? content.trim().split(/\s+/).length : 0} words | {content.length} characters</span>
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Auto-saved
          </span>
        </div>
      </div>
    </div>
  );
}

