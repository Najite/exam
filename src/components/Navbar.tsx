'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Shield, Cpu, Award } from 'lucide-react';

interface NavbarProps {
  onOpenGenerator?: () => void;
}

export function Navbar({ onOpenGenerator }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-base text-white tracking-tight">
              <span>Cognita</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">AI</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800 font-mono">
                CBT
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide">Next-Gen AI Testing & Proctoring</p>
          </div>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <Link href="/" className="hover:text-white transition flex items-center gap-1.5">
            <span>Certification Exams</span>
          </Link>
          <Link href="/submissions" className="hover:text-white transition flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Audit & Submissions</span>
          </Link>
          <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-1 rounded-full text-[11px] font-mono">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>AI Proctor 2.0</span>
          </div>
        </nav>

        {/* Action button */}
        <div className="flex items-center gap-3">
          {onOpenGenerator && (
            <button
              onClick={onOpenGenerator}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Exam Generator</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
