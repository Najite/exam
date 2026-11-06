'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, Terminal, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

interface CodeRunnerProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  onApplyToAnswer?: (code: string) => void;
}

export function CodeRunner({ initialCode = '', onCodeChange, onApplyToAnswer }: CodeRunnerProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const handleRun = () => {
    setOutput(null);
    setIsError(false);

    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => {
        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      },
      warn: (...args: any[]) => {
        logs.push(`[WARN] ${args.map((a) => String(a)).join(' ')}`);
      },
      error: (...args: any[]) => {
        logs.push(`[ERROR] ${args.map((a) => String(a)).join(' ')}`);
      },
    };

    const startTime = performance.now();
    try {
      // Safe sandbox execution wrapper
      const runFn = new Function('console', `"use strict";\n${code}`);
      const result = runFn(customConsole);

      const endTime = performance.now();
      setExecutionTime(Math.round((endTime - startTime) * 100) / 100);

      if (logs.length > 0) {
        setOutput(logs.join('\n'));
      } else if (result !== undefined) {
        setOutput(`Result: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`);
      } else {
        setOutput('Code executed successfully with no stdout output.');
      }
    } catch (err: any) {
      setIsError(true);
      setOutput(`Runtime Error: ${err.message || String(err)}`);
    }
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput(null);
    setIsError(false);
    if (onCodeChange) onCodeChange(initialCode);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col my-3">
      {/* Sandbox Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-mono font-semibold">
          <Terminal className="w-4 h-4" />
          <span>Interactive Code Sandbox</span>
          <span className="text-[10px] text-slate-500 font-sans">(JavaScript ES2024)</span>
        </div>

        <div className="flex items-center gap-2">
          {onApplyToAnswer && (
            <button
              type="button"
              onClick={() => onApplyToAnswer(code)}
              className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 rounded-lg text-[11px] font-semibold transition"
            >
              Paste to Answer
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reset code"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleRun}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Code</span>
          </button>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="p-3 bg-slate-950 font-mono text-xs">
        <textarea
          rows={6}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (onCodeChange) onCodeChange(e.target.value);
          }}
          placeholder="// Type or test executable code here..."
          className="w-full bg-transparent text-indigo-200 resize-none focus:outline-hidden leading-relaxed font-mono selection:bg-indigo-600"
          spellCheck={false}
        />
      </div>

      {/* Terminal Output */}
      {output !== null && (
        <div className={`p-3 border-t text-xs font-mono transition-all ${
          isError ? 'bg-rose-950/40 border-rose-900/60 text-rose-300' : 'bg-slate-900/90 border-slate-800 text-emerald-300'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-bold uppercase tracking-wider">
              {isError ? (
                <>
                  <AlertCircle className="w-3 h-3 text-rose-400" /> Execution Failed
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Standard Output
                </>
              )}
            </span>
            {executionTime !== null && <span>{executionTime}ms</span>}
          </div>
          <pre className="whitespace-pre-wrap break-all leading-relaxed">{output}</pre>
        </div>
      )}
    </div>
  );
}

