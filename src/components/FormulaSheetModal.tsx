'use client';

import React, { useState } from 'react';
import { X, BookOpen, Search, Copy, Check } from 'lucide-react';

interface FormulaSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FormulaSheetModal({ isOpen, onClose }: FormulaSheetModalProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'math' | 'cs' | 'stats'>('math');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (formula: string, key: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formulaCategories = {
    math: [
      { name: 'Quadratic Formula', formula: 'x = (-b ± √(b² - 4ac)) / (2a)', desc: 'Roots of ax² + bx + c = 0' },
      { name: 'Pythagorean Theorem', formula: 'a² + b² = c²', desc: 'Right-angled triangles hypotenuse relation' },
      { name: 'Cylinder Surface Area', formula: 'A = 2πr² + 2πrh', desc: 'Total surface area of a cylinder' },
      { name: 'Sphere Volume', formula: 'V = (4/3)πr³', desc: 'Volume of a sphere with radius r' },
      { name: 'Logarithm Quotient Rule', formula: 'log(a / b) = log(a) - log(b)', desc: 'Decomposing log ratios' },
      { name: 'Combinations Formula', formula: 'nCr = n! / (r!(n - r)!)', desc: 'Selections without order' },
    ],
    cs: [
      { name: 'Binary Search Complexity', formula: 'Time: O(log n), Space: O(1)', desc: 'Sorted array lookup' },
      { name: 'Merge Sort Complexity', formula: 'Time: O(n log n), Space: O(n)', desc: 'Divide and conquer stable sorting' },
      { name: 'QuickSort Complexity', formula: 'Avg: O(n log n), Worst: O(n²)', desc: 'Partition-based in-place sort' },
      { name: 'Amdahl’s Law', formula: 'S = 1 / ((1 - p) + (p / s))', desc: 'Theoretical speedup using multiple processors' },
      { name: 'Bloom Filter False Positive Rate', formula: 'p ≈ (1 - e^(-kn/m))^k', desc: 'k hashes, m bits, n elements' },
      { name: 'HTTP Status 422', formula: 'Unprocessable Entity', desc: 'Semantic validation error' },
    ],
    stats: [
      { name: 'Bayes Theorem', formula: 'P(A|B) = [P(B|A) * P(A)] / P(B)', desc: 'Conditional probability update' },
      { name: 'Standard Deviation (Sample)', formula: 's = √[ Σ(x - μ)² / (n - 1) ]', desc: 'Dispersion measurement' },
      { name: 'Permutations (Order matters)', formula: 'nPr = n! / (n - r)!', desc: 'Arrangements of r objects from n' },
      { name: 'Independent Probability', formula: 'P(A ∩ B) = P(A) * P(B)', desc: 'Two independent events both occurring' },
      { name: 'Expected Value E[X]', formula: 'E[X] = Σ [x * P(x)]', desc: 'Weighted average outcome' },
    ],
  };

  const list = formulaCategories[activeTab].filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.formula.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">CBT Reference & Formula Sheet</h2>
              <p className="text-xs text-slate-400">Approved mathematical & technical reference data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search formulas or concepts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('math')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'math' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Mathematics & Geometry
            </button>
            <button
              onClick={() => setActiveTab('cs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'cs' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Computer Science & Systems
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'stats' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Probability & Statistics
            </button>
          </div>
        </div>

        {/* Formula List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {list.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No formulas matched your search.
            </div>
          ) : (
            list.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl hover:border-slate-600 transition flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.name}</div>
                  <div className="text-base font-mono font-bold text-indigo-300">{item.formula}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
                <button
                  onClick={() => handleCopy(item.formula, `${activeTab}-${idx}`)}
                  className="p-2 bg-slate-700/60 hover:bg-slate-700 rounded-lg text-slate-300 transition shrink-0"
                  title="Copy formula"
                >
                  {copiedKey === `${activeTab}-${idx}` ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
