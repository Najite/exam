'use client';

import React, { useState } from 'react';
import { X, Delete, Calculator as CalcIcon } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalculatorModal({ isOpen, onClose }: CalculatorModalProps) {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleNum = (num: string) => {
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? num : prev + num));
  };

  const handleOp = (op: string) => {
    setDisplay((prev) => {
      if (prev === 'Error') return '0';
      const lastChar = prev.slice(-1);
      if (['+', '-', '*', '/', '^'].includes(lastChar)) {
        return prev.slice(0, -1) + op;
      }
      return prev + op;
    });
  };

  const handleClear = () => setDisplay('0');

  const handleBackspace = () => {
    setDisplay((prev) => {
      if (prev.length <= 1 || prev === 'Error') return '0';
      return prev.slice(0, -1);
    });
  };

  const handleCalculate = () => {
    try {
      // Safe math expression evaluation
      let expr = display.replace(/\^/g, '**');
      // replace scientific functions
      expr = expr.replace(/sin\(([^)]+)\)/g, 'Math.sin($1 * Math.PI / 180)');
      expr = expr.replace(/cos\(([^)]+)\)/g, 'Math.cos($1 * Math.PI / 180)');
      expr = expr.replace(/tan\(([^)]+)\)/g, 'Math.tan($1 * Math.PI / 180)');
      expr = expr.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
      expr = expr.replace(/log\(([^)]+)\)/g, 'Math.log10($1)');
      expr = expr.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');

      // Validate expression to only allow numbers, math operators, Math object
      if (!/^[0-9+\-*/().\sMathPIe]+$/.test(expr)) {
        throw new Error('Invalid');
      }

      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expr})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        setDisplay(String(Math.round(result * 100000000) / 100000000));
      } else {
        setDisplay('Error');
      }
    } catch {
      setDisplay('Error');
    }
  };

  const handleScientific = (fn: string) => {
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? `${fn}(` : `${prev}${fn}(`));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <CalcIcon className="w-4 h-4" />
            <span>CBT Scientific Calculator</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Screen */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-right">
          <div className="text-xs text-slate-400 font-mono h-4 overflow-hidden truncate">
            {memory !== null ? `M: ${memory}` : ''}
          </div>
          <div className="text-2xl font-mono text-emerald-400 tracking-wider overflow-x-auto whitespace-nowrap py-1">
            {display}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="p-4 grid grid-cols-4 gap-2 text-sm select-none">
          {/* Scientific row */}
          <button onClick={() => handleScientific('sqrt')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium">√</button>
          <button onClick={() => handleScientific('sin')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium">sin</button>
          <button onClick={() => handleScientific('cos')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium">cos</button>
          <button onClick={() => handleScientific('tan')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium">tan</button>

          {/* Row 2 */}
          <button onClick={() => handleScientific('log')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium">log</button>
          <button onClick={() => handleScientific('ln')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium">ln</button>
          <button onClick={() => handleOp('^')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium">xʸ</button>
          <button onClick={() => handleNum('3.14159')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-indigo-400 font-medium">π</button>

          {/* Controls */}
          <button onClick={handleClear} className="p-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg font-bold">C</button>
          <button onClick={handleBackspace} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center">
            <Delete className="w-4 h-4" />
          </button>
          <button onClick={() => handleNum('(')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium">(</button>
          <button onClick={() => handleNum(')')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium">)</button>

          {/* Numbers 7, 8, 9, / */}
          <button onClick={() => handleNum('7')} className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-lg font-semibold text-base">7</button>
          <button onClick={() => handleNum('8')} className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-lg font-semibold text-base">8</button>
          <button onClick={() => handleNum('9')} className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-lg font-semibold text-base">9</button>
          <button onClick={() => handleOp('/')} className="p-3 bg-indigo-600/60 hover:bg-indigo-500 rounded-lg font-bold text-base text-indigo-200">÷</button>

          {/* Numbers 4, 5, 6, * */}
          <button onClick={() => handleNum('4')} className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-lg font-semibold text-base">4</button>
          <button onClick={() => handleNum('5')} className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-lg font-semibold text-base">5</button>
          <button onClick={() => handleNum('6')} className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-lg font-semibold text-base">6</button>
          <button onClick={() => handleOp('*')} className="p-3 bg-indigo-600/60 hover:bg-indigo-500 rounded-lg font-bold text-base text-indigo-200">×</button>

          {/* Numbers 1, 2, 3, - */}
          <button onClick={() => handleNum('1')} className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-lg font-semibold text-base">1</button>
          <button onClick={() => handleNum('2')} className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-lg font-semibold text-base">2</button>
          <button onClick={() => handleNum('3')} className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-lg font-semibold text-base">3</button>
          <button onClick={() => handleOp('-')} className="p-3 bg-indigo-600/60 hover:bg-indigo-500 rounded-lg font-bold text-base text-indigo-200">−</button>

          {/* 0, ., =, + */}
          <button onClick={() => handleNum('0')} className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-lg font-semibold text-base">0</button>
          <button onClick={() => handleNum('.')} className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-lg font-semibold text-base">.</button>
          <button onClick={handleCalculate} className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-lg">=</button>
          <button onClick={() => handleOp('+')} className="p-3 bg-indigo-600/60 hover:bg-indigo-500 rounded-lg font-bold text-base text-indigo-200">+</button>
        </div>
      </div>
    </div>
  );
}
