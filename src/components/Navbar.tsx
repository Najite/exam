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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:scale-105 transition">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-base text-white tracking-tight">
              <span>Cognita</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Youth</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800 font-mono">
                Teen Bible Challenge
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide">Scripture, Culture & Faith for Teens</p>
          </div>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <Link href="/" className="hover:text-white transition flex items-center gap-1.5">
            <span>Bible Challenges</span>
          </Link>
          <Link href="/submissions" className="hover:text-white transition flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Youth Submissions</span>
          </Link>
          <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-1 rounded-full text-[11px] font-mono">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Integrity Guard</span>
          </div>
        </nav>

        {/* Action button */}
        <div className="flex items-center gap-3">
          {onOpenGenerator && (
            <button
              onClick={onOpenGenerator}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Teen Bible Quiz</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

