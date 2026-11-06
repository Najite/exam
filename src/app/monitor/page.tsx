'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  Radio, 
  Volume2, 
  Megaphone, 
  Clock, 
  User, 
  AlertTriangle, 
  XCircle, 
  Send, 
  CheckCircle2, 
  Maximize2,
  Users,
  Search,
  Filter,
  RefreshCw,
  X
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface LiveCandidate {
  id: string;
  name: string;
  email: string;
  examTitle: string;
  examId: string;
  startedAt: string;
  timeRemainingSeconds: number;
  strikes: number;
  maxStrikes: number;
  gazeStatus: 'centered' | 'left' | 'right' | 'down';
  faceStatus: 'detected' | 'missing' | 'multiple';
  micLevel: number;
  integrityScore: number;
  status: 'active' | 'warning' | 'terminated';
  lastIncident?: string;
}

export default function LiveMonitorPage() {
  const [candidates, setCandidates] = useState<LiveCandidate[]>([
    {
      id: 'cand-1',
      name: 'Samuel Peter',
      email: 'samuel.p@churchkids.org',
      examTitle: 'Heroes of Faith: Great Bible Stories & Champions',
      examId: 'exam-ss-001',
      startedAt: '10:15 AM',
      timeRemainingSeconds: 540,
      strikes: 0,
      maxStrikes: 3,
      gazeStatus: 'centered',
      faceStatus: 'detected',
      micLevel: 14,
      integrityScore: 100,
      status: 'active',
      lastIncident: 'Session verified clean',
    },
    {
      id: 'cand-2',
      name: 'Grace Johnson',
      email: 'grace.j@churchkids.org',
      examTitle: 'The Life, Parables & Miracles of Jesus',
      examId: 'exam-ss-002',
      startedAt: '10:18 AM',
      timeRemainingSeconds: 420,
      strikes: 1,
      maxStrikes: 2,
      gazeStatus: 'left',
      faceStatus: 'detected',
      micLevel: 22,
      integrityScore: 92,
      status: 'warning',
      lastIncident: 'Gaze deviation detected (Left)',
    },
    {
      id: 'cand-3',
      name: 'Noah Caleb',
      email: 'noah.c@churchkids.org',
      examTitle: 'The Ten Commandments & The Fruit of the Spirit',
      examId: 'exam-ss-003',
      startedAt: '10:20 AM',
      timeRemainingSeconds: 310,
      strikes: 0,
      maxStrikes: 3,
      gazeStatus: 'centered',
      faceStatus: 'detected',
      micLevel: 8,
      integrityScore: 100,
      status: 'active',
      lastIncident: 'Session verified clean',
    },
    {
      id: 'cand-4',
      name: 'Hannah Joy',
      email: 'hannah.j@churchkids.org',
      examTitle: 'Bible Adventures: Joseph, Jonah & Ruth',
      examId: 'exam-ss-004',
      startedAt: '10:22 AM',
      timeRemainingSeconds: 480,
      strikes: 0,
      maxStrikes: 3,
      gazeStatus: 'centered',
      faceStatus: 'detected',
      micLevel: 10,
      integrityScore: 100,
      status: 'active',
      lastIncident: 'Session verified clean',
    },
  ]);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'clean' | 'flagged'>('all');

  // Announcement modal
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'urgent'>('info');
  const [isSending, setIsSending] = useState(false);

  // Inspector modal
  const [inspectedCandidate, setInspectedCandidate] = useState<LiveCandidate | null>(null);

  // Countdown timer simulation for active sessions
  useEffect(() => {
    const timer = setInterval(() => {
      setCandidates((prev) =>
        prev.map((c) => ({
          ...c,
          timeRemainingSeconds: Math.max(0, c.timeRemainingSeconds - 1),
          // Slight realistic noise variations
          micLevel: c.status === 'warning' ? Math.floor(Math.random() * 40 + 20) : Math.floor(Math.random() * 15 + 8),
        }))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setIsSending(true);
    try {
      await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMessage.trim(),
          sender: 'Chief Invigilator (Control Center)',
          type: broadcastType,
        }),
      });

      setBroadcastMessage('');
      setIsBroadcastOpen(false);
    } catch {
      alert('Failed to send announcement');
    } finally {
      setIsSending(false);
    }
  };

  const handleIssueWarning = (candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candidateId) {
          const nextStrikes = c.strikes + 1;
          return {
            ...c,
            strikes: nextStrikes,
            status: nextStrikes >= c.maxStrikes ? 'terminated' : 'warning',
            lastIncident: 'Official warning issued by Chief Invigilator',
          };
        }
        return c;
      })
    );
    if (inspectedCandidate?.id === candidateId) {
      setInspectedCandidate((curr) => curr ? { ...curr, strikes: curr.strikes + 1 } : null);
    }
  };

  const handleTerminateSession = (candidateId: string) => {
    if (!confirm('Are you sure you want to forcibly terminate this candidate session due to security violations?')) return;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, status: 'terminated', strikes: c.maxStrikes, lastIncident: 'Session terminated by examiner' }
          : c
      )
    );
    if (inspectedCandidate?.id === candidateId) {
      setInspectedCandidate((curr) => curr ? { ...curr, status: 'terminated' } : null);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.examTitle.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'clean' ? c.strikes === 0 : c.strikes > 0);
    return matchesSearch && matchesFilter;
  });

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Top Control Center Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-semibold mb-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Real-Time Invigilation & Proctoring Grid</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <span>Examiner Live Command Center</span>
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                {candidates.filter((c) => c.status !== 'terminated').length} Sessions Active
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live computer-vision feeds, acoustic levels, strike monitors, and remote broadcast controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBroadcastOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-950 flex items-center gap-2 transition cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>Broadcast Announcement</span>
            </button>
          </div>
        </div>

        {/* Aggregates Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Candidates</div>
              <div className="text-2xl font-bold font-mono text-white">
                {candidates.filter((c) => c.status !== 'terminated').length}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Clean Integrity</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {candidates.filter((c) => c.strikes === 0).length}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Flagged / Warned</div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {candidates.filter((c) => c.strikes > 0 && c.status !== 'terminated').length}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Terminated Sessions</div>
              <div className="text-2xl font-bold font-mono text-rose-400">
                {candidates.filter((c) => c.status === 'terminated').length}
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by student name, exam..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Feeds
            </button>
            <button
              onClick={() => setFilter('clean')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'clean' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Clean (0 Strikes)
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'flagged' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Flagged (&gt; 0)
            </button>
          </div>
        </div>

        {/* Candidate Feeds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredCandidates.map((c) => (
            <div
              key={c.id}
              className={`rounded-3xl bg-slate-900 border overflow-hidden flex flex-col justify-between shadow-xl transition hover:shadow-2xl ${
                c.status === 'terminated'
                  ? 'border-rose-900/60 opacity-60'
                  : c.strikes > 0
                  ? 'border-amber-800/80 shadow-amber-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Candidate Video Feed Thumbnail */}
              <div className="p-4 pb-0">
                <div className="relative aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  {/* Synthetic Silhouette Representation */}
                  <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-900 to-slate-950">
                    <div className="w-12 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-1">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>

                    {/* Animated HUD Overlay */}
                    <div
                      className={`absolute inset-3 border-2 rounded-xl pointer-events-none flex flex-col justify-between p-1.5 transition ${
                        c.gazeStatus === 'centered'
                          ? 'border-emerald-500/80'
                          : 'border-amber-500 animate-pulse'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[9px] font-mono text-emerald-400 bg-black/60 px-1 py-0.5 rounded-sm">
                        <span>FACE: 1</span>
                        <span>{c.gazeStatus.toUpperCase()}</span>
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-300 bg-black/60 px-1 py-0.5 rounded-sm">
                        <span>MIC:</span>
                        <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${c.micLevel > 50 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(100, c.micLevel)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Corner Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-md text-[10px] font-mono">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        c.status === 'terminated'
                          ? 'bg-rose-500'
                          : c.strikes > 0
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-emerald-400 animate-pulse'
                      }`}
                    />
                    <span>{c.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Candidate Info Body */}
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white truncate">{c.name}</h3>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        c.strikes === 0
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : c.status === 'terminated'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      Strikes: {c.strikes}/{c.maxStrikes}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{c.email}</div>
                  <div className="text-[11px] text-indigo-300 font-medium truncate mt-1">
                    {c.examTitle}
                  </div>
                </div>

                {/* Status Ticker */}
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{formatSeconds(c.timeRemainingSeconds)}</span>
                  </span>
                  <span className="text-emerald-400 font-bold">{c.integrityScore}% Score</span>
                </div>

                <div className="text-[10px] text-slate-500 truncate italic">
                  &bull; {c.lastIncident}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setInspectedCandidate(c)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg transition"
                >
                  Inspect
                </button>

                <button
                  type="button"
                  onClick={() => handleIssueWarning(c.id)}
                  disabled={c.status === 'terminated'}
                  className="px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/80 text-amber-300 text-[11px] font-semibold rounded-lg transition disabled:opacity-40"
                  title="Issue Strike Warning"
                >
                  Warn
                </button>

                <button
                  type="button"
                  onClick={() => handleTerminateSession(c.id)}
                  disabled={c.status === 'terminated'}
                  className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-[11px] font-semibold rounded-lg transition disabled:opacity-40"
                  title="Forcibly Terminate Session"
                >
                  Kill
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />

      {/* Broadcast Announcement Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 text-white shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Broadcast Invigilator Announcement</h3>
              </div>
              <button
                onClick={() => setIsBroadcastOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['info', 'warning', 'urgent'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setBroadcastType(t)}
                      className={`py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition ${
                        broadcastType === t
                          ? t === 'urgent'
                            ? 'bg-rose-950 text-rose-300 border-rose-600'
                            : t === 'warning'
                            ? 'bg-amber-950 text-amber-300 border-amber-600'
                            : 'bg-indigo-950 text-indigo-300 border-indigo-600'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Announcement Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Attention candidates: Exactly 10 minutes remain in this exam session. Please double-check all marked responses."
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !broadcastMessage.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-indigo-950 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Feed Inspector Modal */}
      {inspectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 text-white shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{inspectedCandidate.name}</h3>
                  <p className="text-xs text-slate-400">{inspectedCandidate.email} &bull; {inspectedCandidate.examTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedCandidate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Live Stream Feed */}
            <div className="aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
              <div className="text-center">
                <User className="w-16 h-16 text-slate-600 mx-auto mb-2" />
                <div className="text-xs font-mono text-emerald-400">ENCRYPTED PROCTOR STREAM ACTIVE</div>
                <div className="text-[10px] text-slate-500">30 FPS &bull; Low-latency WebRTC Feed</div>
              </div>

              <div className="absolute top-3 left-3 bg-black/70 px-2.5 py-1 rounded-md text-xs font-mono text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>LIVE FEED</span>
              </div>

              <div className="absolute bottom-3 right-3 bg-black/70 px-2.5 py-1 rounded-md text-xs font-mono text-slate-300">
                Gaze: {inspectedCandidate.gazeStatus.toUpperCase()} &bull; MIC: {inspectedCandidate.micLevel}%
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleIssueWarning(inspectedCandidate.id)}
                disabled={inspectedCandidate.status === 'terminated'}
                className="flex-1 py-2.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 font-bold text-xs rounded-xl transition"
              >
                Issue Strike Warning ({inspectedCandidate.strikes}/{inspectedCandidate.maxStrikes})
              </button>

              <button
                type="button"
                onClick={() => handleTerminateSession(inspectedCandidate.id)}
                disabled={inspectedCandidate.status === 'terminated'}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-rose-950"
              >
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

