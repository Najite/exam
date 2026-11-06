'use client';

import React, { useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, Sliders, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { DifficultyLevel, QuestionType, Exam } from '@/types';
import { useRouter } from 'next/navigation';

interface AIExamGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamCreated?: (exam: Exam) => void;
}

export function AIExamGeneratorModal({ isOpen, onClose, onExamCreated }: AIExamGeneratorModalProps) {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Old Testament Literature & Torah');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['mcq_single', 'short_answer']);
  const [contextMaterial, setContextMaterial] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleType = (t: QuestionType) => {
    if (questionTypes.includes(t)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter((item) => item !== t));
      }
    } else {
      setQuestionTypes([...questionTypes, t]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide an exam topic or curriculum subject.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/exams/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          category,
          difficulty,
          questionCount,
          durationMinutes,
          questionTypes,
          contextMaterial: contextMaterial.trim() || undefined,
          apiKey: apiKey.trim() || undefined,
          autoSave: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate exam.');
      }

      if (onExamCreated) {
        onExamCreated(data.exam);
      }
      onClose();
      router.push(`/exam/${data.exam.id}/setup`);
    } catch (err: any) {
      setError(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-white my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AI CBT Exam Generator
              </h2>
              <p className="text-xs text-slate-400">Synthesize psychometric question sets and marking rubrics in seconds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Exam Topic */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Subject / Topic Prompt <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The Abrahamic Covenant & Genesis 15, Johannine Christology, or Justification in Romans"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
            />
          </div>

          {/* Category & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Old Testament Literature & Torah">Old Testament Literature & Torah</option>
                <option value="New Testament Gospels & Epistles">New Testament Gospels & Epistles</option>
                <option value="Pauline Theology & Early Church">Pauline Theology & Early Church</option>
                <option value="Biblical Hermeneutics & Exegesis">Biblical Hermeneutics & Exegesis</option>
                <option value="Systematic Theology & Doctrines">Systematic Theology & Doctrines</option>
                <option value="Biblical Languages (Hebrew & Greek)">Biblical Languages (Hebrew & Greek)</option>
                <option value="Church History & Patristics">Church History & Patristics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs text-center font-medium">
                {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map((level) => (
                  <button
                    type="button"
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`py-1.5 rounded-lg capitalize transition ${
                      difficulty === level
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {level.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question Count & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Question Count</span>
              </label>
              <div className="flex gap-2">
                {[3, 5, 7, 10].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      questionCount === num
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Duration (Minutes)</span>
              </label>
              <input
                type="number"
                min={3}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Allowed Question Types */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Include Question Types
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'mcq_single' as QuestionType, label: 'Single Choice MCQ' },
                { id: 'mcq_multiple' as QuestionType, label: 'Multi-Select MCQ' },
                { id: 'true_false' as QuestionType, label: 'True / False' },
                { id: 'short_answer' as QuestionType, label: 'AI Short Answer' },
                { id: 'code' as QuestionType, label: 'Code Snippet' },
              ].map((item) => {
                const checked = questionTypes.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => toggleType(item.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition ${
                      checked
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <span>{item.label}</span>
                    {checked && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Syllabus or Reference Material */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Scripture Passage / Reference Material (Optional)
            </label>
            <textarea
              rows={2}
              value={contextMaterial}
              onChange={(e) => setContextMaterial(e.target.value)}
              placeholder="Paste scripture passages (e.g. Genesis 15:1-21, Romans 3:21-31), theological notes, or syllabus excerpts..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Optional Gemini API Key */}
          <div className="pt-2 border-t border-slate-800">
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer hover:text-slate-200 font-medium flex items-center gap-1.5">
                <span>Advanced: Custom Gemini API Key (Optional)</span>
              </summary>
              <div className="mt-2 space-y-1">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your GEMINI_API_KEY (leave empty to use high-fidelity built-in engine)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  If left blank, the platform automatically uses its high-fidelity internal AI generator.
                </p>
              </div>
            </details>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Exam & Rubrics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Exam & Launch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

