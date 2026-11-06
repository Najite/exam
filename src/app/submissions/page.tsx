'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Search, 
  Sparkles, 
  User, 
  BarChart3, 
  Filter, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Submission } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'all' | 'clean' | 'flagged' | 'high_risk'>('all');

  useEffect(() => {
    async function loadSubmissions() {
      try {
        const res = await fetch('/api/submissions');
        const data = await res.json();
        if (data.success && Array.isArray(data.submissions)) {
          setSubmissions(data.submissions);
        }
      } catch (err) {
        console.error('Failed to load submissions', err);
      } finally {
        setLoading(false);
      }
    }
    loadSubmissions();
  }, []);

  const filtered = submissions.filter((s) => {
    const matchesSearch =
      s.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      s.candidateEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.examTitle.toLowerCase().includes(search.toLowerCase());
    const matchesVerdict = verdictFilter === 'all' || s.integrityVerdict === verdictFilter;
    return matchesSearch && matchesVerdict;
  });

  const totalExams = submissions.length;
  const passedCount = submissions.filter((s) => s.passed).length;
  const passRate = totalExams > 0 ? Math.round((passedCount / totalExams) * 100) : 0;
  const avgScore = totalExams > 0 ? Math.round(submissions.reduce((a, b) => a + b.percentage, 0) / totalExams) : 0;
  const flaggedCount = submissions.filter((s) => s.integrityVerdict !== 'clean').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Sunday School Class Record</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Student Submissions & Quiz Results
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Review completed Sunday School quizzes, student scores, and Teacher Grace AI evaluations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-950 flex items-center gap-1.5 transition"
            >
              <span>Explore Exams</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Total Submissions
            </div>
            <div className="text-3xl font-mono font-bold text-white">{totalExams}</div>
            <div className="text-[11px] text-slate-500 mt-1">Completed CBT sessions</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Average Score
            </div>
            <div className="text-3xl font-mono font-bold text-indigo-400">{avgScore}%</div>
            <div className="text-[11px] text-slate-500 mt-1">Mean candidate performance</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Pass Rate
            </div>
            <div className="text-3xl font-mono font-bold text-emerald-400">{passRate}%</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {passedCount} of {totalExams} passed
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Security Flags
            </div>
            <div className="text-3xl font-mono font-bold text-amber-400">{flaggedCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Sessions with proctor alerts</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search candidate name, email, exam..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Verdict Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {(['all', 'clean', 'flagged', 'high_risk'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVerdictFilter(v)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  verdictFilter === v
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {v.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
            Loading submission records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-slate-800 p-8">
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No session records found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              When students complete proctored examinations, their full integrity audit, score breakdown, and transcripts will appear here.
            </p>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-2"
            >
              <span>Take a Sample Exam</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((sub) => {
              const formattedDate = new Date(sub.submittedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sub.id}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Candidate & Exam details */}
                  <div className="flex items-center gap-4">
                    {sub.candidatePhoto ? (
                      <img
                        src={sub.candidatePhoto}
                        alt={sub.candidateName}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-white">{sub.candidateName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({sub.candidateEmail})</span>
                      </div>
                      <div className="text-xs text-indigo-300 font-medium mb-1">{sub.examTitle}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                        <span>{formattedDate}</span>
                        <span>&bull;</span>
                        <span>Time: {Math.round(sub.timeSpentSeconds / 60)} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Score badge */}
                    <div className="text-right">
                      <div className="text-base font-bold font-mono text-white">
                        {sub.percentage}%
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          sub.passed
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {sub.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>

                    {/* Integrity Verdict */}
                    <div className="text-right">
                      <div
                        className={`text-base font-bold font-mono ${
                          sub.integrityScore >= 85
                            ? 'text-emerald-400'
                            : sub.integrityScore >= 60
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {sub.integrityScore}%
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          sub.integrityVerdict === 'clean'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : sub.integrityVerdict === 'flagged'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}
                      >
                        {sub.integrityVerdict.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Action link */}
                    <Link
                      href={`/result/${sub.id}`}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition ml-2"
                    >
                      <span>View Audit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

