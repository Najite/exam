'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Calculator as CalcIcon, 
  BookOpen, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  RotateCcw, 
  Send, 
  CheckCircle2, 
  User, 
  AlertCircle,
  HelpCircle,
  Loader2,
  Code2,
  Volume2,
  VolumeX,
  Sparkles,
  BookMarked,
  Megaphone
} from 'lucide-react';
import { Exam, Question, ProctorIncident, ProctorIncidentType } from '@/types';
import { WebcamProctor } from '@/components/WebcamProctor';
import { QuestionPalette } from '@/components/QuestionPalette';
import { CalculatorModal } from '@/components/CalculatorModal';
import { FormulaSheetModal } from '@/components/FormulaSheetModal';
import { ConcordanceModal } from '@/components/ConcordanceModal';
import { ScratchpadModal } from '@/components/ScratchpadModal';
import { ScriptureWorkbench } from '@/components/ScriptureWorkbench';

function ExamTakeContent() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  // Data states
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Candidate info
  const [candidateName, setCandidateName] = useState('Alex Rivers');
  const [candidateEmail, setCandidateEmail] = useState('alex.rivers@university.edu');
  const [candidatePhoto, setCandidatePhoto] = useState<string | null>(null);

  // CBT Test State
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({ q1: true });

  // Time tracking
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const secondsElapsedRef = useRef<number>(0);
  const startedAtRef = useRef<string>(new Date().toISOString());

  // Proctoring & Integrity state
  const [proctorLogs, setProctorLogs] = useState<ProctorIncident[]>([]);
  const [strikeCount, setStrikeCount] = useState<number>(0);
  const [maxStrikes, setMaxStrikes] = useState<number>(3);
  const maxStrikesRef = useRef<number>(3);
  const [strikeWarningModal, setStrikeWarningModal] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<{ type: string; message: string } | null>(null);

  // Accessibility: Text to speech
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Utility modals
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [isConcordanceOpen, setIsConcordanceOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  // Update ref for seconds elapsed
  useEffect(() => {
    secondsElapsedRef.current = secondsElapsed;
  }, [secondsElapsed]);

  // Load Exam and Session Storage
  useEffect(() => {
    const savedName = sessionStorage.getItem('cbt_candidate_name');
    const savedEmail = sessionStorage.getItem('cbt_candidate_email');
    const savedPhoto = sessionStorage.getItem('cbt_candidate_photo');
    if (savedName) setCandidateName(savedName);
    if (savedEmail) setCandidateEmail(savedEmail);
    if (savedPhoto) setCandidatePhoto(savedPhoto);

    async function loadExam() {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        const data = await res.json();
        if (data.success && data.exam) {
          setExam(data.exam);
          const totalSec = (data.exam.durationMinutes || 15) * 60;
          setSecondsRemaining(totalSec);
          const strikes = data.exam.proctoringSettings?.maxTabSwitches || 3;
          setMaxStrikes(strikes);
          maxStrikesRef.current = strikes;

          // Mark first question visited
          if (data.exam.questions?.[0]) {
            setVisited({ [data.exam.questions[0].id]: true });
          }

          // Check if there are cached answers from local storage
          const cachedAnswers = localStorage.getItem(`cbt_answers_${examId}`);
          if (cachedAnswers) {
            try {
              setAnswers(JSON.parse(cachedAnswers));
            } catch {}
          }
        }
      } catch (err) {
        console.error('Failed to load exam', err);
      } finally {
        setLoading(false);
      }
    }

    loadExam();
  }, [examId]);

  // Poll for Chief Invigilator Live Announcements
  const lastAnnouncementIdRef = useRef<string | null>(null);

  useEffect(() => {
    const pollAnnouncements = async () => {
      try {
        const res = await fetch(`/api/announcements?examId=${examId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.announcements) && data.announcements.length > 0) {
          const latest = data.announcements[0];
          if (!lastAnnouncementIdRef.current) {
            // First run, record latest ID without disturbing with historic announcement
            lastAnnouncementIdRef.current = latest.id;
          } else if (latest.id !== lastAnnouncementIdRef.current) {
            lastAnnouncementIdRef.current = latest.id;
            setActiveToast({
              type: `invigilator (${latest.sender})`,
              message: latest.message,
            });
            setTimeout(() => {
              setActiveToast((curr) => (curr?.message === latest.message ? null : curr));
            }, 8000);
          }
        }
      } catch (err) {
        // Silently ignore background polling glitches
      }
    };

    pollAnnouncements();
    const interval = setInterval(pollAnnouncements, 8000);
    return () => clearInterval(interval);
  }, [examId]);

  // Log Proctor Incident (Stable callback with throttled notifications)
  const logIncident = useCallback((incident: Omit<ProctorIncident, 'id' | 'timestamp' | 'secondsIntoExam'>) => {
    const newInc: ProctorIncident = {
      ...incident,
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      secondsIntoExam: secondsElapsedRef.current,
    };

    setProctorLogs((prev) => [...prev, newInc]);

    // Show on-screen toast
    setActiveToast({ type: incident.type, message: incident.description });
    setTimeout(() => {
      setActiveToast((curr) => (curr?.message === incident.description ? null : curr));
    }, 5000);

    // If critical security breach (tab switch, fullscreen exit, multiple faces), increment strike
    if (incident.type === 'tab_switch' || incident.type === 'fullscreen_exit' || incident.type === 'multiple_faces') {
      setStrikeCount((prev) => {
        const next = prev + 1;
        setStrikeWarningModal(`Security Alert: ${incident.description}. Strike ${next} of ${maxStrikesRef.current}.`);
        if (next >= maxStrikesRef.current) {
          // Trigger auto-submit on strike limit reached
          setTimeout(() => {
            handleSubmitExam(true);
          }, 1800);
        }
        return next;
      });
    }
  }, []);

  // Anti-Cheating: Fullscreen & Tab Blur Listeners (Debounced to prevent double counting)
  useEffect(() => {
    if (!exam) return;

    let lastTabSwitchTime = 0;

    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.hidden && now - lastTabSwitchTime > 3000) {
        lastTabSwitchTime = now;
        logIncident({
          type: 'tab_switch',
          severity: 'high',
          description: 'Candidate switched away from exam tab or minimized browser window',
        });
      }
    };

    const handleWindowBlur = () => {
      const now = Date.now();
      if (now - lastTabSwitchTime > 3000) {
        lastTabSwitchTime = now;
        logIncident({
          type: 'window_blur',
          severity: 'medium',
          description: 'Window focus lost. Candidate interacted outside exam terminal',
        });
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && exam.proctoringSettings.enableFullscreen) {
        logIncident({
          type: 'fullscreen_exit',
          severity: 'high',
          description: 'Candidate exited required fullscreen test environment',
        });
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logIncident({
        type: 'paste_attempt',
        severity: 'medium',
        description: 'Clipboard copy/paste blocked by exam security monitor',
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopyPaste);
    window.addEventListener('paste', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopyPaste);
      window.removeEventListener('paste', handleCopyPaste);
    };
  }, [exam, logIncident]);

  // Countdown Timer Loop
  useEffect(() => {
    if (loading || !exam || isSubmitting) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(false);
          return 0;
        }
        return prev - 1;
      });
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, exam, isSubmitting]);

  // Accessibility Text-to-Speech
  const handleToggleSpeak = () => {
    if (!exam || !exam.questions[currentIndex]) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const q = exam.questions[currentIndex];
    let textToRead = `Question ${currentIndex + 1}. ${q.text}.`;
    if (q.options) {
      textToRead += ' Options: ' + q.options.map((o, idx) => `Option ${idx + 1}: ${o.text}`).join('. ');
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Cache answers to localStorage
  const handleAnswerChange = (qId: string, value: any) => {
    setAnswers((prev) => {
      const updated = { ...prev, [qId]: value };
      localStorage.setItem(`cbt_answers_${examId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectQuestion = (index: number) => {
    if (!exam || !exam.questions[index]) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setCurrentIndex(index);
    setVisited((prev) => ({ ...prev, [exam.questions[index].id]: true }));
  };

  const handleNext = () => {
    if (!exam) return;
    if (currentIndex < exam.questions.length - 1) {
      handleSelectQuestion(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      handleSelectQuestion(currentIndex - 1);
    }
  };

  const handleToggleMarkForReview = (qId: string) => {
    setMarkedForReview((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleClearResponse = (qId: string) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      localStorage.setItem(`cbt_answers_${examId}`, JSON.stringify(copy));
      return copy;
    });
  };

  // Submit Exam
  const handleSubmitExam = async (forcedByViolation = false) => {
    if (!exam || isSubmitting) return;
    setIsSubmitting(true);
    if (isSpeaking) window.speechSynthesis.cancel();

    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam.id,
          candidateName,
          candidateEmail,
          candidatePhoto,
          startedAt: startedAtRef.current,
          timeSpentSeconds: secondsElapsedRef.current,
          answers,
          proctorLogs: forcedByViolation
            ? [
                ...proctorLogs,
                {
                  id: `inc-term-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  secondsIntoExam: secondsElapsedRef.current,
                  type: 'tab_switch',
                  severity: 'high',
                  description: 'Exam automatically submitted due to security strike limit reached',
                },
              ]
            : proctorLogs,
        }),
      });

      const data = await res.json();
      if (data.success && data.submission) {
        localStorage.removeItem(`cbt_answers_${examId}`);
        router.push(`/result/${data.submission.id}`);
      } else {
        alert(data.error || 'Failed to submit exam.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      alert(err.message || 'Submission error occurred');
      setIsSubmitting(false);
    }
  };

  // Format time (HH:MM:SS)
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !exam) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading secure testing terminal...</p>
        </div>
      </div>
    );
  }

  const currentQ = exam.questions[currentIndex];
  const isTimeCritical = secondsRemaining < 300;
  const isTimeEmergency = secondsRemaining < 60;

  return (
    <div className={`min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none ${
      fontSize === 'large' ? 'text-base' : 'text-sm'
    }`}>
      {/* Real-time Floating Proctor or Invigilator Toast Notification */}
      {activeToast && (
        <div className={`fixed top-20 right-6 z-50 max-w-sm rounded-2xl p-3.5 shadow-2xl text-white flex items-start gap-3 animate-in slide-in-from-top-4 duration-200 border-2 ${
          activeToast.type.includes('invigilator')
            ? 'bg-slate-900/95 border-indigo-500 shadow-indigo-950/60'
            : 'bg-slate-900/95 border-amber-500/80 shadow-amber-950/40'
        }`}>
          {activeToast.type.includes('invigilator') ? (
            <Megaphone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-bounce" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <div className={`font-bold capitalize mb-0.5 ${
              activeToast.type.includes('invigilator') ? 'text-indigo-300' : 'text-amber-300'
            }`}>
              {activeToast.type.includes('invigilator')
                ? '📢 Invigilator Broadcast'
                : `AI Proctor Notice: ${activeToast.type.replace('_', ' ')}`}
            </div>
            <p className="text-slate-300 leading-snug">{activeToast.message}</p>
          </div>
        </div>
      )}

      {/* Critical Strike Modal (on Tab Switch or Multi-face violation) */}
      {strikeWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-rose-950 border-2 border-rose-500 w-full max-w-md rounded-3xl p-6 text-white text-center shadow-2xl animate-in zoom-in-95">
            <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3 animate-bounce" />
            <h2 className="text-xl font-bold mb-2">Proctor Security Violation</h2>
            <p className="text-xs text-rose-200 mb-6 leading-relaxed">
              {strikeWarningModal}
            </p>
            <button
              onClick={() => {
                setStrikeWarningModal(null);
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="w-full py-3 bg-white hover:bg-slate-100 text-rose-950 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              I Understand & Acknowledge (Return to Test)
            </button>
          </div>
        </div>
      )}

      {/* CBT Top Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        {/* Candidate Info */}
        <div className="flex items-center gap-3">
          {candidatePhoto ? (
            <img
              src={candidatePhoto}
              alt={candidateName}
              className="w-9 h-9 rounded-xl object-cover border border-indigo-500"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
              <User className="w-4 h-4" />
            </div>
          )}
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-white leading-tight">{candidateName}</div>
            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">{exam.title}</div>
          </div>
        </div>

        {/* Center Timer */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono font-bold tracking-wider text-sm transition-all border ${
              isTimeEmergency
                ? 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse'
                : isTimeCritical
                ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                : 'bg-slate-950 text-emerald-400 border-slate-800'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'animate-spin' : ''}`} />
            <span>{formatTime(secondsRemaining)}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </header>

      {/* Utility Toolbar */}
      <div className="h-10 bg-slate-950/90 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="flex items-center gap-1.5 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition"
          >
            <CalcIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Calculator</span>
          </button>

          <button
            onClick={() => setIsFormulaOpen(true)}
            className="flex items-center gap-1.5 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition"
            title="Open Scripture & Biblical Reference Sheet"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Scripture Sheet</span>
          </button>

          <button
            onClick={() => setIsConcordanceOpen(true)}
            className="flex items-center gap-1.5 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition"
            title="Open Scripture Concordance & Topical Cross-References"
          >
            <BookMarked className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Concordance</span>
          </button>

          <button
            onClick={() => setIsScratchpadOpen(true)}
            className="flex items-center gap-1.5 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Scratchpad</span>
          </button>

          {/* Text-To-Speech Read Aloud */}
          <button
            type="button"
            onClick={handleToggleSpeak}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition ${
              isSpeaking
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 animate-pulse'
                : 'hover:text-white hover:bg-slate-800'
            }`}
            title="Read Question Aloud (Accessibility Voice)"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-indigo-400" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
            <span className="hidden sm:inline">{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Font toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                fontSize === 'normal' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition ${
                fontSize === 'large' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              A+
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            AI Proctor Active
          </div>
        </div>
      </div>

      {/* Main Examination Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        {/* Left: Question Box (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl">
          <div>
            {/* Question Header & Meta */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  Question {currentIndex + 1}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  of {exam.questions.length}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium">
                  {currentQ.topic}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                {currentQ.bloomLevel && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 uppercase text-[10px]">
                    {currentQ.bloomLevel}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  {currentQ.marks} Marks
                </span>
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <h2 className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed mb-4">
                {currentQ.text}
              </h2>

              {/* Interactive Scripture Workbench if question has biblical passage or linguistic snippet */}
              {(currentQ.type === 'code' || currentQ.codeSnippet) && (
                <ScriptureWorkbench
                  passageText={currentQ.codeSnippet || currentQ.text}
                  onApplyToAnswer={(citedText) => {
                    const current = answers[currentQ.id] || '';
                    handleAnswerChange(currentQ.id, current ? `${current}\n\n${citedText}` : citedText);
                  }}
                />
              )}
            </div>

            {/* Answer Options Area */}
            <div className="space-y-3">
              {/* Short Answer text area */}
              {currentQ.type === 'short_answer' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <span>Synthesize Response</span>
                    <span className="text-indigo-400 font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Semantic Grading Enabled
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    placeholder="Provide a comprehensive theological response citing scriptural cross-references, exegetical principles, and key conceptual criteria..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden resize-none leading-relaxed"
                  />
                  <div className="text-right text-[11px] text-slate-500 font-mono">
                    {(answers[currentQ.id] || '').length} characters
                  </div>
                </div>
              )}

              {/* MCQ Single / True False / Code with options */}
              {(currentQ.type === 'mcq_single' || currentQ.type === 'true_false' || currentQ.type === 'code') &&
                currentQ.options?.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => handleAnswerChange(currentQ.id, opt.id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition group ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-600 text-white'
                            : 'border-slate-600 group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs sm:text-sm leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}

              {/* MCQ Multiple Select */}
              {currentQ.type === 'mcq_multiple' &&
                currentQ.options?.map((opt) => {
                  const currentList = Array.isArray(answers[currentQ.id]) ? answers[currentQ.id] : [];
                  const isSelected = currentList.includes(opt.id);

                  const toggleMulti = () => {
                    let nextList: string[];
                    if (isSelected) {
                      nextList = currentList.filter((item: string) => item !== opt.id);
                    } else {
                      nextList = [...currentList, opt.id];
                    }
                    handleAnswerChange(currentQ.id, nextList);
                  };

                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={toggleMulti}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition group ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-600 text-white'
                            : 'border-slate-600 group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs sm:text-sm leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-8 mt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {/* Mark for review & clear */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleMarkForReview(currentQ.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                  markedForReview[currentQ.id]
                    ? 'bg-purple-950 text-purple-300 border-purple-700'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{markedForReview[currentQ.id] ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleClearResponse(currentQ.id)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/60 flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={handlePrevious}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === exam.questions.length - 1}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-indigo-950"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Proctor HUD & Question Palette (1 col) */}
        <div className="space-y-6">
          {/* Live AI Proctor Component */}
          <WebcamProctor
            onIncident={logIncident}
            secondsElapsed={secondsElapsed}
            strikeCount={strikeCount}
            maxStrikes={maxStrikes}
            enableFaceCheck={exam.proctoringSettings.aiFaceDetection}
            enableMicCheck={exam.proctoringSettings.enableMic}
          />

          {/* Standardized CBT Question Palette */}
          <QuestionPalette
            questions={exam.questions}
            currentIndex={currentIndex}
            answers={answers}
            markedForReview={markedForReview}
            visited={visited}
            onSelectQuestion={handleSelectQuestion}
          />
        </div>
      </main>

      {/* Confirmation Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 text-white shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold mb-2">Submit Examination?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Please review your summary below before concluding this certified CBT session.
            </p>

            {/* Summary counters */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center mb-6">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Answered</div>
                <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                  {Object.keys(answers).length}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Unanswered</div>
                <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                  {Math.max(0, exam.questions.length - Object.keys(answers).length)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Marked</div>
                <div className="text-base font-bold text-purple-400 font-mono mt-0.5">
                  {Object.values(markedForReview).filter(Boolean).length}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Return to Exam
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitExam(false)}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-950 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Grading with AI...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm & Finish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tool Modals */}
      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
      <FormulaSheetModal
        isOpen={isFormulaOpen}
        onClose={() => setIsFormulaOpen(false)}
      />
      <ConcordanceModal
        isOpen={isConcordanceOpen}
        onClose={() => setIsConcordanceOpen(false)}
        onInsertVerse={(verse) => {
          if (currentQ) {
            const current = answers[currentQ.id] || '';
            handleAnswerChange(currentQ.id, current ? `${current}\n\n${verse}` : verse);
          }
        }}
      />
      <ScratchpadModal
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        examId={exam.id}
      />
    </div>
  );
}

export default function ExamTakePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-xs text-slate-400">Initializing Exam Terminal...</p>
          </div>
        </div>
      }
    >
      <ExamTakeContent />
    </Suspense>
  );
}
