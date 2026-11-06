'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  BrainCircuit, 
  Bot, 
  ArrowLeft, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  RotateCcw,
  User,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { Submission, Exam, Question } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AITutorModal } from '@/components/AITutorModal';
import { CertificateModal } from '@/components/CertificateModal';

function ResultContent() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter for question review
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'short_answer'>('all');

  // Modals
  const [selectedTutorQuestion, setSelectedTutorQuestion] = useState<Question | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const subRes = await fetch(`/api/submissions/${submissionId}`);
        const subData = await subRes.json();
        if (subData.success && subData.submission) {
          setSubmission(subData.submission);

          // Trigger confetti if passed!
          if (subData.submission.passed) {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          }

          // Fetch associated exam for full question details
          const examRes = await fetch(`/api/exams/${subData.submission.examId}`);
          const examData = await examRes.json();
          if (examData.success && examData.exam) {
            setExam(examData.exam);
          }
        }
      } catch (err) {
        console.error('Failed to load results', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading AI Performance Diagnostics...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-2">Submission Not Found</h1>
          <p className="text-xs text-slate-400 mb-6">Unable to retrieve examination transcript record.</p>
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

  // Format time spent
  const formatTimeSpent = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  // Filter questions
  const filteredQuestions = (exam?.questions || []).filter((q) => {
    const res = submission.questionResults.find((r) => r.questionId === q.id);
    if (filter === 'correct') return res?.isCorrect;
    if (filter === 'incorrect') return !res?.isCorrect;
    if (filter === 'short_answer') return q.type === 'short_answer';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-8">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-5">
            {/* Status Avatar */}
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl ${
                submission.passed
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-emerald-900/40'
                  : 'bg-gradient-to-tr from-rose-600 to-orange-500 text-white shadow-rose-900/40'
              }`}
            >
              {submission.passed ? (
                <Award className="w-10 h-10" />
              ) : (
                <XCircle className="w-10 h-10" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    submission.passed
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {submission.passed ? 'PASSED & CERTIFIED' : 'DID NOT PASS'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {submission.examTitle}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Candidate: <strong className="text-slate-200">{submission.candidateName}</strong> ({submission.candidateEmail})</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {submission.passed && (
              <button
                onClick={() => setIsCertificateOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95"
              >
                <Award className="w-4 h-4" />
                <span>View Official Certificate</span>
              </button>
            )}

            <button
              onClick={() => router.push(`/exam/${submission.examId}/setup`)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Retake Exam</span>
            </button>
          </div>
        </div>

        {/* Metrics Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Metric 1: Score */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Final Score</div>
            <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-1">
              <span>{submission.percentage}%</span>
              <span className="text-xs text-slate-500 font-normal">
                ({submission.score}/{submission.totalPossibleScore})
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Passing requirement: {exam?.passingScore || 70}%
            </div>
          </div>

          {/* Metric 2: Estimated Percentile */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Psychometric Rank</div>
            <div className="text-3xl font-extrabold text-indigo-400 font-mono">
              {submission.aiAnalytics.estimatedPercentile}th
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Estimated candidate percentile
            </div>
          </div>

          {/* Metric 3: Time Spent */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Time Taken</span>
            </div>
            <div className="text-3xl font-extrabold text-amber-300 font-mono">
              {formatTimeSpent(submission.timeSpentSeconds)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Allotted: {exam?.durationMinutes || 15} minutes
            </div>
          </div>

          {/* Metric 4: AI Integrity Score */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Integrity Audit</span>
            </div>
            <div
              className={`text-3xl font-extrabold font-mono ${
                submission.integrityScore >= 85
                  ? 'text-emerald-400'
                  : submission.integrityScore >= 60
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {submission.integrityScore}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1 capitalize font-medium">
              Verdict: {submission.integrityVerdict.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Section 2: AI Proctor Integrity Report & Topic Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Proctoring Incident Log */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">AI Proctoring Integrity Audit</h3>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    submission.integrityVerdict === 'clean'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : submission.integrityVerdict === 'flagged'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                >
                  {submission.proctorLogs.length} Security Incident(s)
                </span>
              </div>

              {submission.proctorLogs.length === 0 ? (
                <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="block font-semibold">100% Verified Clean Session</strong>
                    <span>No browser tab switches, unprompted unfocus, or camera anomalies were recorded.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {submission.proctorLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start gap-3"
                    >
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          log.severity === 'high'
                            ? 'text-rose-400'
                            : log.severity === 'medium'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-semibold text-slate-200 capitalize">
                            {log.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            +{log.secondsIntoExam}s into exam
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{log.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800 font-mono">
              Audit Hash: {submission.id} &bull; Browser Fingerprint Logged
            </p>
          </div>

          {/* AI Cognitive & Topic Mastery Diagnostics */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Curriculum Topic Mastery</h3>
            </div>

            <div className="space-y-3.5 mb-5">
              {submission.aiAnalytics.topicBreakdown.map((t, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">{t.topic}</span>
                    <span className="font-mono text-slate-400">
                      {t.score}/{t.total} pts ({t.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        t.percentage >= 75
                          ? 'bg-emerald-500'
                          : t.percentage >= 50
                          ? 'bg-indigo-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${t.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Strengths & Recommendations */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs space-y-2">
              <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Personalized Remediation Plan:</span>
              </div>
              <ul className="list-disc list-inside text-slate-400 space-y-1 text-[11px]">
                {submission.aiAnalytics.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 3: Question by Question Review */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Detailed Question Review & Explanations</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {filteredQuestions.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect official answers, semantic AI auto-grading rubrics, and launch the AI Socratic Tutor.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('correct')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === 'correct' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Correct
              </button>
              <button
                onClick={() => setFilter('incorrect')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === 'incorrect' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Incorrect
              </button>
              <button
                onClick={() => setFilter('short_answer')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === 'short_answer' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Short Answer
              </button>
            </div>
          </div>

          {/* Question Review Cards */}
          <div className="space-y-6">
            {filteredQuestions.map((q, idx) => {
              const res = submission.questionResults.find((r) => r.questionId === q.id);
              const isCorrect = res?.isCorrect;
              const userAnswer = submission.answers[q.id];

              return (
                <div
                  key={q.id}
                  className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        Question {idx + 1}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                        {q.topic}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isCorrect
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{res?.scoreAwarded ?? 0} / {q.marks} Marks</span>
                      </span>

                      {/* Socratic Tutor Trigger */}
                      <button
                        onClick={() => setSelectedTutorQuestion(q)}
                        className="px-3 py-1 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-700/60 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Bot className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ask Pastor Jordan</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm font-medium text-slate-200">{q.text}</p>

                  {/* Candidate Answer vs Correct Answer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Your Submitted Response:
                      </span>
                      <div className={`font-mono ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {userAnswer
                          ? Array.isArray(userAnswer)
                            ? userAnswer.join(', ')
                            : String(userAnswer)
                          : '<No Response Provided>'}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Official Correct Model Answer:
                      </span>
                      <div className="font-mono text-emerald-400">
                        {Array.isArray(q.correctAnswer)
                          ? q.correctAnswer.join(', ')
                          : String(q.correctAnswer)}
                      </div>
                    </div>
                  </div>

                  {/* AI Evaluation Rubric Breakdown for Short Answers */}
                  {res?.aiEvaluation && (
                    <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 text-xs space-y-2">
                      <div className="flex items-center justify-between text-purple-300 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          AI Subjective Auto-Grader Assessment
                        </span>
                        <span className="font-mono capitalize">
                          Accuracy: {res.aiEvaluation.accuracy}
                        </span>
                      </div>
                      <p className="text-slate-300 italic">{res.aiEvaluation.reasoning}</p>

                      {res.aiEvaluation.strengths?.length > 0 && (
                        <div>
                          <strong className="text-emerald-400 block mb-0.5">Key Strengths:</strong>
                          <ul className="list-disc list-inside text-slate-400 text-[11px]">
                            {res.aiEvaluation.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {res.aiEvaluation.improvements?.length > 0 && (
                        <div>
                          <strong className="text-amber-400 block mb-0.5">Missing Elements:</strong>
                          <ul className="list-disc list-inside text-slate-400 text-[11px]">
                            {res.aiEvaluation.improvements.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/60 text-xs text-slate-300">
                    <strong className="text-indigo-400 block mb-1">Explanation:</strong>
                    <p className="leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />

      {/* AI Socratic Tutor Modal */}
      {selectedTutorQuestion && (
        <AITutorModal
          isOpen={!!selectedTutorQuestion}
          onClose={() => setSelectedTutorQuestion(null)}
          question={selectedTutorQuestion}
          userAnswer={submission.answers[selectedTutorQuestion.id]}
        />
      )}

      {/* Official Certificate Modal */}
      {submission && (
        <CertificateModal
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
          submission={submission}
        />
      )}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
