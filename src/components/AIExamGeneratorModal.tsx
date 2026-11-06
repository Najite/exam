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
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [durationMinutes, setDurationMinutes] = useState<number>(10);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['mcq_single', 'true_false', 'short_answer']);
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
      setError('Please provide a Sunday School topic or Bible story.');
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
          category: 'Sunday School',
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
        throw new Error(data.error || 'Failed to generate Sunday School quiz.');
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Sunday School Quiz Generator</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  AI Bible Assistant
                </span>
              </h2>
              <p className="text-xs text-slate-400">Generate fun, inspiring Bible quizzes and lessons for Sunday School students</p>
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
              Bible Story / Sunday School Topic <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. David and Goliath, Noah's Ark, The Good Samaritan, The Ten Commandments, or The Miracles of Jesus"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
            />
          </div>

          {/* Difficulty Level (Kids, Juniors, Teens) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Age & Learning Level
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-700 text-xs text-center font-medium">
              {[
                { id: 'beginner' as DifficultyLevel, label: 'Primary (Kids)', desc: 'Ages 5-8' },
                { id: 'intermediate' as DifficultyLevel, label: 'Juniors (Pre-teens)', desc: 'Ages 9-12' },
                { id: 'advanced' as DifficultyLevel, label: 'Youth (Teens)', desc: 'Ages 13+' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setDifficulty(item.id)}
                  className={`py-2 px-1 rounded-lg transition flex flex-col items-center justify-center ${
                    difficulty === item.id
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-[10px] opacity-75">{item.desc}</span>
                </button>
              ))}
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
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {[
                { id: 'mcq_single' as QuestionType, label: 'Single Choice (MCQ)' },
                { id: 'true_false' as QuestionType, label: 'True / False' },
                { id: 'mcq_multiple' as QuestionType, label: 'Multi-Select (Select all that apply)' },
                { id: 'short_answer' as QuestionType, label: 'Short Answer / Story Reflection' },
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
              Bible Passage or Memory Verse (Optional)
            </label>
            <textarea
              rows={2}
              value={contextMaterial}
              onChange={(e) => setContextMaterial(e.target.value)}
              placeholder="Paste Bible verses (e.g. 1 Samuel 17:40-50, Luke 10:25-37, John 3:16) or lesson notes..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Optional API Key */}
          <div className="pt-2 border-t border-slate-800">
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer hover:text-slate-200 font-medium flex items-center gap-1.5">
                <span>Advanced: Custom OpenRouter / Gemini API Key (Optional)</span>
              </summary>
              <div className="mt-2 space-y-1">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your OPENROUTER_API_KEY (leave empty to use .env key)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  Default: OpenRouter multi-model free cascade starting with <code className="text-amber-300">google/gemma-4-31b-it:free</code>.
                </p>
              </div>
            </details>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-400 hover:via-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Sunday School Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Sunday School Quiz</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

