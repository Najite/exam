'use client';

import React, { useState } from 'react';
import { Scroll, Copy, Check, Sparkles, BookOpen, Search, Highlighter } from 'lucide-react';

interface ScriptureWorkbenchProps {
  passageText: string;
  onApplyToAnswer?: (text: string) => void;
  title?: string;
}

export function ScriptureWorkbench({ passageText, onApplyToAnswer, title }: ScriptureWorkbenchProps) {
  const [copied, setCopied] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [highlightKeyTerms, setHighlightKeyTerms] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(passageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (onApplyToAnswer) {
      onApplyToAnswer(`"${passageText.trim()}"`);
    }
  };

  // List of high-value biblical key terms to highlight
  const biblicalGlossary: Record<string, string> = {
    'covenant': 'Hebrew Berith / Greek Diatheke: solemn treaty ratified in blood.',
    'atonement': 'Hebrew Kippur: expiation and propitiation through sacrifice.',
    'justified': 'Greek Dikaiosyne: declared righteous before God through faith.',
    'faith': 'Greek Pistis / Hebrew Emunah: trust, fidelity, and reliance on God.',
    'word': 'Greek Logos / Hebrew Dabar: the divine creative and revealing agent.',
    'grace': 'Greek Charis / Hebrew Hen: unmerited divine favor and power.',
    'holy': 'Hebrew Qodesh / Greek Hagios: set apart, morally pure, distinct.',
    'servant': 'Hebrew Ebed / Greek Doulos: one devoted to executing Yahweh’s redemptive purpose.',
    'blood': 'Symbol of life offered in substitutionary sacrifice.',
    'righteousness': 'Conformity to God’s holy character and divine law.',
    'kenosis': 'Self-emptying and voluntary humiliation of the incarnate Son (Phil 2).',
    'hesed': 'Steadfast covenant love and loyal fidelity.',
    'azazel': 'The scapegoat bearing the confessed sins into the wilderness (Lev 16).',
    'logos': 'The eternal Word of God incarnate (John 1:1, 14).',
    'bara': 'Divine creation ex nihilo by God alone (Gen 1:1).',
  };

  // Highlight words in the passage
  const renderInteractiveText = () => {
    const tokens = passageText.split(/(\s+|[.,;:"'!?()]+)/);
    return tokens.map((token, idx) => {
      const cleanToken = token.toLowerCase().replace(/[^a-z]/g, '');
      const hasGloss = cleanToken && biblicalGlossary[cleanToken];

      if (hasGloss && highlightKeyTerms) {
        return (
          <span
            key={idx}
            onClick={() => setSelectedWord(cleanToken)}
            className="cursor-pointer text-amber-300 font-semibold bg-amber-500/10 hover:bg-amber-500/30 px-1 py-0.5 rounded border border-amber-500/30 transition text-xs sm:text-sm"
            title={`Click to view exegetical gloss: ${biblicalGlossary[cleanToken]}`}
          >
            {token}
          </span>
        );
      }
      return <span key={idx}>{token}</span>;
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden my-4 shadow-xl">
      {/* Workbench Header */}
      <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Scroll className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">
            {title || 'Scripture Exegesis Workbench & Interlinear Text'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHighlightKeyTerms(!highlightKeyTerms)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
              highlightKeyTerms
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Highlighter className="w-3 h-3" />
            <span>Theological Glosses</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Copy passage"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Scripture Text Canvas */}
      <div className="p-4 sm:p-5 bg-linear-to-b from-slate-950 to-slate-900 font-serif text-slate-200 text-xs sm:text-sm leading-relaxed sm:leading-loose border-b border-slate-800">
        {renderInteractiveText()}
      </div>

      {/* Selected Term Exegetical Popup Card */}
      {selectedWord && biblicalGlossary[selectedWord] && (
        <div className="px-4 py-2.5 bg-amber-950/40 border-b border-amber-800/50 flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider text-amber-300 font-mono">
                {selectedWord}:
              </span>{' '}
              <span>{biblicalGlossary[selectedWord]}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedWord(null)}
            className="text-amber-400 hover:text-white text-xs font-mono font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Footer */}
      <div className="px-4 py-2.5 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px]">
          Click on highlighted keywords to inspect theological definitions and original language roots.
        </span>

        {onApplyToAnswer && (
          <button
            type="button"
            onClick={handleInsert}
            className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 rounded-lg font-medium transition text-xs flex items-center gap-1 cursor-pointer"
          >
            <BookOpen className="w-3 h-3" />
            <span>Cite Passage in Answer</span>
          </button>
        )}
      </div>
    </div>
  );
}

