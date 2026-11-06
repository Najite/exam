'use client';

import React from 'react';
import { X, Award, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Submission } from '@/types';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
}

export function CertificateModal({ isOpen, onClose, submission }: CertificateModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(submission.submittedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 print:hidden">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Award className="w-5 h-5" />
            <span>Official Certificate of Competency</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas Area */}
        <div className="p-8 sm:p-12 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 border-8 border-slate-800 m-4 rounded-2xl relative flex flex-col items-center text-center">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-500/60"></div>
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-500/60"></div>
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-500/60"></div>
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-500/60"></div>

          {/* Top Seal */}
          <div className="w-16 h-16 rounded-full bg-linear-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/20 mb-4 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-400">
              <Award className="w-8 h-8" />
            </div>
          </div>

          <div className="text-xs uppercase tracking-widest text-amber-400/80 font-bold mb-1">
            COGNITA AI &bull; COMPUTER-BASED TESTING ACCREDITATION
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2 tracking-wide">
            CERTIFICATE OF ACHIEVEMENT
          </h1>
          <p className="text-xs text-slate-400 mb-6 italic">This certifies that</p>

          {/* Candidate Name */}
          <div className="text-xl sm:text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-amber-200 border-b border-slate-700 pb-2 px-8 mb-4 max-w-lg">
            {submission.candidateName}
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            has successfully completed the proctored examination and satisfied all curriculum benchmarks for
          </p>

          {/* Exam Title */}
          <div className="text-base sm:text-lg font-bold text-indigo-300 mb-6 bg-slate-800/60 px-6 py-2 rounded-xl border border-slate-700">
            {submission.examTitle}
          </div>

          {/* Stats Badges */}
          <div className="flex flex-wrap justify-center gap-4 text-xs font-mono mb-8">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Score: {submission.percentage}% ({submission.score}/{submission.totalPossibleScore})</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Integrity Verified: {submission.integrityScore}%</span>
            </div>
          </div>

          {/* Signatures & Verification Hash */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 pt-6 gap-4 text-left text-xs text-slate-400">
            <div>
              <div className="font-semibold text-slate-300">Date of Issue</div>
              <div className="font-mono text-[11px] text-slate-400">{formattedDate}</div>
            </div>

            <div className="text-center">
              <div className="font-serif italic text-base text-amber-400/90 font-bold mb-0.5">
                Cognita Academic Board
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">AI Psychometric Certification</div>
            </div>

            <div className="sm:text-right">
              <div className="font-semibold text-slate-300">Credential ID</div>
              <div className="font-mono text-[11px] text-indigo-400">
                {submission.id.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

