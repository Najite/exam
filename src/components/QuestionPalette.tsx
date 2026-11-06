'use client';

import React from 'react';
import { Question } from '@/types';

interface QuestionPaletteProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, any>;
  markedForReview: Record<string, boolean>;
  visited: Record<string, boolean>;
  onSelectQuestion: (index: number) => void;
}

export function QuestionPalette({
  questions,
  currentIndex,
  answers,
  markedForReview,
  visited,
  onSelectQuestion,
}: QuestionPaletteProps) {
  // Helper to determine status
  const getQuestionStatus = (q: Question) => {
    const isAnswered =
      answers[q.id] !== undefined &&
      answers[q.id] !== '' &&
      (!Array.isArray(answers[q.id]) || answers[q.id].length > 0);
    const isMarked = !!markedForReview[q.id];
    const isVisited = !!visited[q.id];

    if (isAnswered && isMarked) return 'answered_marked';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    if (isVisited) return 'not_answered';
    return 'not_visited';
  };

  // Status counts
  let countAnswered = 0;
  let countNotAnswered = 0;
  let countMarked = 0;
  let countAnsweredMarked = 0;
  let countNotVisited = 0;

  questions.forEach((q) => {
    const status = getQuestionStatus(q);
    if (status === 'answered') countAnswered++;
    else if (status === 'not_answered') countNotAnswered++;
    else if (status === 'marked') countMarked++;
    else if (status === 'answered_marked') countAnsweredMarked++;
    else countNotVisited++;
  });

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl flex flex-col gap-4 text-white">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Question Palette</h3>
        <span className="text-xs font-mono text-indigo-400 font-semibold">{questions.length} Total</span>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center font-bold text-[10px] text-white">
            {countAnswered}
          </div>
          <span>Answered</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-rose-600 flex items-center justify-center font-bold text-[10px] text-white">
            {countNotAnswered}
          </div>
          <span>Not Answered</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-purple-600 flex items-center justify-center font-bold text-[10px] text-white">
            {countMarked}
          </div>
          <span>Marked Review</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-purple-600 relative flex items-center justify-center font-bold text-[10px] text-white">
            {countAnsweredMarked}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-0.5 right-0.5"></span>
          </div>
          <span>Ans. & Review</span>
        </div>

        <div className="flex items-center gap-2 col-span-2">
          <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-400">
            {countNotVisited}
          </div>
          <span>Not Visited</span>
        </div>
      </div>

      {/* Grid of question buttons */}
      <div className="pt-2 border-t border-slate-800">
        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
          {questions.map((q, idx) => {
            const status = getQuestionStatus(q);
            const isCurrent = idx === currentIndex;

            let bgClass = 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700';
            if (status === 'answered') {
              bgClass = 'bg-emerald-600 border-emerald-500 text-white font-bold hover:bg-emerald-500';
            } else if (status === 'not_answered') {
              bgClass = 'bg-rose-600/90 border-rose-500 text-white font-bold hover:bg-rose-500';
            } else if (status === 'marked') {
              bgClass = 'bg-purple-600 border-purple-500 text-white font-bold hover:bg-purple-500';
            } else if (status === 'answered_marked') {
              bgClass = 'bg-purple-600 border-purple-500 text-white font-bold hover:bg-purple-500';
            }

            return (
              <button
                key={q.id}
                onClick={() => onSelectQuestion(idx)}
                className={`relative h-9 rounded-lg border text-xs transition flex items-center justify-center font-mono ${bgClass} ${
                  isCurrent ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 scale-105 z-10' : ''
                }`}
                title={`Question ${idx + 1}`}
              >
                {idx + 1}
                {status === 'answered_marked' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

