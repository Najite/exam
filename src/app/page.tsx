'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  HelpCircle, 
  BookOpen, 
  Award, 
  Video, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Search,
  Filter,
  BarChart3,
  BrainCircuit,
  Eye,
  Trash2
} from 'lucide-react';
import { Exam } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AIExamGeneratorModal } from '@/components/AIExamGeneratorModal';

export default function HomePage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      if (data.success && Array.isArray(data.exams)) {
        setExams(data.exams);
      }
    } catch (err) {
      console.error('Failed to load exams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDeleteExam = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this Teen Bible Challenge?')) return;
    try {
      const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExams((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      alert('Failed to delete quiz');
    }
  };

  const difficultyLevels = [
    { id: 'All', label: 'All Teen Levels' },
    { id: 'beginner', label: 'Junior High (13-14)' },
    { id: 'intermediate', label: 'High School (15-16)' },
    { id: 'advanced', label: 'Senior Youth (17-19)' },
  ];

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      exam.description.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'All' || exam.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar onOpenGenerator={() => setIsGeneratorOpen(true)} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-slate-800/80 bg-gradient-to-b from-amber-950/20 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.12),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs font-semibold mb-6 shadow-lg shadow-amber-950/50">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Teen Bible Challenge & Youth Platform</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="text-emerald-400">Pastor Jordan AI Mentor</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Real-World Faith & Scripture <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200">
                Teen Bible Challenge
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Interactive Bible challenges designed for Christian teenagers (ages 13–19). Dive deep into God’s Word, tackle real-life culture, navigate peer pressure, and discover purpose in Christ with AI mentoring from Pastor Jordan.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setIsGeneratorOpen(true)}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm shadow-xl shadow-amber-600/30 flex items-center gap-2.5 transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Teen Bible Quiz</span>
              </button>

              <Link
                href="/submissions"
                className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm flex items-center gap-2.5 transition"
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Youth Submissions & Records</span>
              </Link>
            </div>
          </div>

          {/* Features Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-10 border-t border-slate-800/60">
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white mb-1">Teen Bible AI</h2>
              <p className="text-xs text-slate-400">Deep challenges on Daniel, Identity in Christ, Sermon on the Mount, and Overcoming Anxiety.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Eye className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white mb-1">Integrity Guard</h2>
              <p className="text-xs text-slate-400">Focus and integrity monitoring to build honest, distraction-free study habits.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white mb-1">Mentor Evaluation</h2>
              <p className="text-xs text-slate-400">Evaluates genuine scriptural depth, critical thinking, and real-life teen application.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white mb-1">Pastor Jordan AI</h2>
              <p className="text-xs text-slate-400">Authentic Youth Pastor mentor addressing real-life culture, questions, and faith.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Catalog Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>Teen Bible Challenges</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {filteredExams.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Select a Bible challenge below to test your scriptural depth and life application</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search stories, heroes, parables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Level tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {difficultyLevels.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedDifficulty(lvl.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedDifficulty === lvl.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exams Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading Teen Bible Challenges...
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-slate-800 p-8">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Teen Bible Challenges found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              No challenges match your filter. Create a brand new Teen Bible Challenge in seconds with our AI generator!
            </p>
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Teen Bible Quiz</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => {
              const difficultyColors = {
                beginner: 'bg-emerald-950 text-emerald-300 border-emerald-800',
                intermediate: 'bg-indigo-950 text-indigo-300 border-indigo-800',
                advanced: 'bg-purple-950 text-purple-300 border-purple-800',
              };

              return (
                <div
                  key={exam.id}
                  className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between overflow-hidden group shadow-xl hover:shadow-2xl hover:shadow-indigo-950/30"
                >
                  <div className="p-6">
                    {/* Top tags */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-800/60 px-2.5 py-0.5 rounded-md">
                        {exam.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            difficultyColors[exam.difficulty] || difficultyColors.intermediate
                          }`}
                        >
                          {exam.difficulty}
                        </span>
                        <button
                          onClick={(e) => handleDeleteExam(exam.id, e)}
                          title="Delete Exam"
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition mb-2 line-clamp-2">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                      {exam.description}
                    </p>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 text-center mb-4">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Duration</div>
                        <div className="text-xs font-mono font-bold text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{exam.durationMinutes}m</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Questions</div>
                        <div className="text-xs font-mono font-bold text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                          <BookOpen className="w-3 h-3 text-indigo-400" />
                          <span>{exam.questions.length}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Pass Mark</div>
                        <div className="text-xs font-mono font-bold text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                          <Award className="w-3 h-3 text-emerald-400" />
                          <span>{exam.passingScore}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Security flags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      {exam.proctoringSettings.enableWebcam && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 flex items-center gap-1">
                          <Video className="w-2.5 h-2.5" /> Webcam
                        </span>
                      )}
                      {exam.proctoringSettings.enableFullscreen && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-950/40 text-indigo-400 border border-indigo-900/60 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" /> Fullscreen
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/40 text-purple-400 border border-purple-900/60">
                        {exam.totalMarks} Marks
                      </span>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 bg-slate-950/90 border-t border-slate-800/80">
                    <Link
                      href={`/exam/${exam.id}/setup`}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 shadow-md shadow-indigo-600/20"
                    >
                      <span>Take Examination</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* AI Exam Generator Modal */}
      <AIExamGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onExamCreated={(newExam) => {
          setExams((prev) => [newExam, ...prev]);
        }}
      />
    </div>
  );
}
