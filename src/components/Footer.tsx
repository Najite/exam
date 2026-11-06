import React from 'react';
import { Shield, Sparkles, Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 py-10 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-400">Cognita AI CBT Engine</span>
          <span>&bull;</span>
          <span>Computer-Based Testing Platform</span>
        </div>

        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            Integrity Guard AI
          </span>
          <span className="flex items-center gap-1.5 text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini & Heuristic Powered
          </span>
        </div>
      </div>
    </footer>
  );
}
