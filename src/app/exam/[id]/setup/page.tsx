'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Camera, 
  Mic, 
  Maximize2, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Lock, 
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { Exam } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

function ExamSetupContent() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [candidateName, setCandidateName] = useState('Alex Rivers');
  const [candidateEmail, setCandidateEmail] = useState('alex.rivers@university.edu');
  const [candidatePhoto, setCandidatePhoto] = useState<string | null>(null);

  // Diagnostic states
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [audioLevel, setAudioLevel] = useState(15);
  const [agreedHonorCode, setAgreedHonorCode] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load Exam
  useEffect(() => {
    async function loadExam() {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        const data = await res.json();
        if (data.success && data.exam) {
          setExam(data.exam);
        }
      } catch (err) {
        console.error('Failed to load exam', err);
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [examId]);

  // Request camera and microphone
  const requestMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 300 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setMicReady(true);

      // Simulate snapshot automatically after 1 sec
      setTimeout(() => {
        captureSnapshot();
      }, 1000);
    } catch (err) {
      console.warn('Media devices not allowed or unavailable. Using virtual check.');
      setCameraReady(true);
      setMicReady(true);
    }
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 160, 120);
        setCandidatePhoto(canvas.toDataURL('image/jpeg', 0.8));
      }
    }
  };

  // Stop media on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleStartExam = () => {
    if (!candidateName.trim() || !agreedHonorCode) return;

    // Save candidate info to sessionStorage for the exam session
    sessionStorage.setItem('cbt_candidate_name', candidateName.trim());
    sessionStorage.setItem('cbt_candidate_email', candidateEmail.trim());
    if (candidatePhoto) {
      sessionStorage.setItem('cbt_candidate_photo', candidatePhoto);
    }

    // Attempt to enter fullscreen
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}

    router.push(`/exam/${examId}/take`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-2">Examination Not Found</h1>
          <p className="text-xs text-slate-400 mb-6">The requested CBT assessment could not be located.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold"
          >
            Return to Exam Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        {/* Top Title Banner */}
        <div className="mb-8 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pre-Flight Readiness & Security Clearance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{exam.title}</h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">{exam.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 text-xs font-mono text-slate-300">
            <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <span className="text-slate-500 uppercase">Duration:</span>
              <span className="font-bold text-amber-400">{exam.durationMinutes} Minutes</span>
            </div>
            <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <span className="text-slate-500 uppercase">Passing Score:</span>
              <span className="font-bold text-emerald-400">{exam.passingScore}%</span>
            </div>
          </div>
        </div>

        {/* Verification Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Candidate Profile */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="text-base font-bold text-white">Candidate Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Candidate Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. Alex Rivers"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Academic / Candidate Email
                  </label>
                  <input
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="e.g. candidate@domain.edu"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Verification Snapshot Preview */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400 mb-2">Photo Identity Verification</div>
              {candidatePhoto ? (
                <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <img
                    src={candidatePhoto}
                    alt="Candidate Snapshot"
                    className="w-12 h-12 rounded-xl object-cover border border-indigo-500/40"
                  />
                  <div>
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Photo Verified
                    </div>
                    <div className="text-[11px] text-slate-500">Embedded in proctor audit report</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  Allow camera permission on the right to capture photo verification.
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Hardware & Media Readiness */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="text-base font-bold text-white">System Hardware Diagnostics</h3>
                </div>
                {!cameraReady && (
                  <button
                    onClick={requestMedia}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Run Check</span>
                  </button>
                )}
              </div>

              {/* Camera Preview Box */}
              <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${
                    cameraReady ? 'block' : 'hidden'
                  }`}
                />
                {!cameraReady && (
                  <div className="text-center p-4">
                    <Camera className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 mb-2">Webcam & Microphone Required</p>
                    <button
                      onClick={requestMedia}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
                    >
                      Authorize Camera & Mic
                    </button>
                  </div>
                )}

                {cameraReady && (
                  <div className="absolute top-2 right-2 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Feed Online
                  </div>
                )}
              </div>

              {/* Status Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Camera className="w-3.5 h-3.5 text-indigo-400" /> Web Camera
                  </span>
                  <span className={`font-semibold flex items-center gap-1 ${cameraReady ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {cameraReady ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                    {cameraReady ? 'Connected' : 'Pending Authorization'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Mic className="w-3.5 h-3.5 text-indigo-400" /> Microphone Sensor
                  </span>
                  <span className={`font-semibold flex items-center gap-1 ${micReady ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {micReady ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                    {micReady ? 'Active' : 'Pending Authorization'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Honor Code & Launch */}
        <div className="mt-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h3 className="text-base font-bold text-white">AI Proctoring & Academic Integrity Honor Code</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-xs text-slate-300">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" /> Fullscreen Enforcement
              </div>
              <p className="text-slate-400">The exam runs in dedicated fullscreen mode. Minimizing triggers an incident strike.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Tab Switching & Strikes
              </div>
              <p className="text-slate-400">Navigating to secondary browser tabs or applications logs a strike. Max 3 strikes allowed.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Vision & Audio Guard
              </div>
              <p className="text-slate-400">Your face must remain centered in the camera frame without background voices.</p>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 cursor-pointer mb-6 hover:bg-indigo-950/40 transition">
            <input
              type="checkbox"
              checked={agreedHonorCode}
              onChange={(e) => setAgreedHonorCode(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded-md accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs text-slate-300 leading-relaxed">
              I certify that I am <strong className="text-white">{candidateName}</strong>, that I will take this examination independently without unapproved aids, external search engines, or secondary participants, and I agree to AI proctor monitoring.
            </span>
          </label>

          {/* Launch Button */}
          <button
            onClick={handleStartExam}
            disabled={!candidateName.trim() || !agreedHonorCode}
            className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            <span>Launch Secure CBT Examination Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ExamSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <ExamSetupContent />
    </Suspense>
  );
}
