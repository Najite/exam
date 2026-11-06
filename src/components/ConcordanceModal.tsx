'use client';

import React, { useState } from 'react';
import { X, Search, BookOpen, Copy, Check, Bookmark, Sparkles, BookMarked, ArrowRight } from 'lucide-react';

interface ConcordanceEntry {
  topic: string;
  category: 'Old Testament' | 'New Testament' | 'Theology' | 'Linguistics';
  hebrewOrGreek?: string;
  definition: string;
  keyVerses: { ref: string; text: string }[];
}

const concordanceDatabase: ConcordanceEntry[] = [
  {
    topic: 'Covenant (Berith & Diatheke)',
    category: 'Theology',
    hebrewOrGreek: 'בְּרִית (Berith) / Διαθήκη (Diathēkē)',
    definition: 'A solemn, binding relationship instituted by God, ratified in blood, with promises, obligations, and signs.',
    keyVerses: [
      { ref: 'Genesis 15:18', text: 'On that day the LORD made a covenant with Abram, saying, "To your offspring I give this land."' },
      { ref: 'Jeremiah 31:31', text: '"Behold, the days are coming, declares the LORD, when I will make a new covenant with the house of Israel."' },
      { ref: 'Luke 22:20', text: '"This cup that is poured out for you is the new covenant in my blood."' },
      { ref: 'Hebrews 9:15', text: 'Therefore he is the mediator of a new covenant, so that those who are called may receive the promised eternal inheritance.' },
    ],
  },
  {
    topic: 'Atonement & Propitiation (Kippur & Hilasterion)',
    category: 'Theology',
    hebrewOrGreek: 'כִּפּוּר (Kippur) / Ἱλαστήριον (Hilastērion)',
    definition: 'The appeasement of divine wrath and cleansing/covering of guilt through substitutionary sacrificial blood.',
    keyVerses: [
      { ref: 'Leviticus 16:30', text: '"For on this day shall atonement be made for you to cleanse you. You shall be clean before the LORD from all your sins."' },
      { ref: 'Isaiah 53:5', text: 'He was pierced for our transgressions; he was crushed for our iniquities; upon him was the chastisement that brought us peace.' },
      { ref: 'Romans 3:25', text: 'whom God put forward as a propitiation by his blood, to be received by faith.' },
      { ref: '1 John 2:2', text: 'He is the propitiation for our sins, and not for ours only but also for the sins of the whole world.' },
    ],
  },
  {
    topic: 'Justification by Faith (Dikaiosyne)',
    category: 'New Testament',
    hebrewOrGreek: 'צֶדֶק (Tsedeq) / Δικαιοσύνη (Dikaiosynē)',
    definition: 'God’s legal judicial declaration acquitting the ungodly and imputing Christ’s perfect righteousness through faith alone.',
    keyVerses: [
      { ref: 'Genesis 15:6', text: 'And he believed the LORD, and he counted it to him as righteousness.' },
      { ref: 'Habakkuk 2:4', text: '"Behold, his soul is puffed up; it is not upright within him, but the righteous shall live by his faith."' },
      { ref: 'Romans 5:1', text: 'Therefore, since we have been justified by faith, we have peace with God through our Lord Jesus Christ.' },
      { ref: 'Galatians 2:16', text: 'yet we know that a person is not justified by works of the law but through faith in Jesus Christ.' },
    ],
  },
  {
    topic: 'Incarnation & The Word (Logos & Kenosis)',
    category: 'New Testament',
    hebrewOrGreek: 'דָּבָר (Dabar) / Λόγος (Logos) & Κένωσις (Kenōsis)',
    definition: 'The eternal Son of God taking on true human nature, veiling His glory, and dwelling among humanity without abandoning deity.',
    keyVerses: [
      { ref: 'John 1:1, 14', text: 'In the beginning was the Word, and the Word was with God, and the Word was God... And the Word became flesh and dwelt among us.' },
      { ref: 'Philippians 2:6-7', text: 'who, though he was in the form of God, did not count equality with God a thing to be grasped, but emptied himself.' },
      { ref: 'Colossians 2:9', text: 'For in him the whole fullness of deity dwells bodily.' },
      { ref: '1 Timothy 3:16', text: 'Great indeed, we confess, is the mystery of godliness: He was manifested in the flesh, vindicated by the Spirit.' },
    ],
  },
  {
    topic: 'Covenant Love & Faithfulness (Hesed & Emet)',
    category: 'Old Testament',
    hebrewOrGreek: 'חֶסֶד (Hesed) / אֱמֶת (Emet)',
    definition: 'Yahweh’s steadfast, persevering, loyal love and fidelity toward His covenant people.',
    keyVerses: [
      { ref: 'Exodus 34:6', text: '"The LORD, the LORD, a God merciful and gracious, slow to anger, and abounding in steadfast love and faithfulness."' },
      { ref: 'Psalm 136:1', text: 'Give thanks to the LORD, for he is good, for his steadfast love endures forever.' },
      { ref: 'Lamentations 3:22-23', text: 'The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning.' },
      { ref: 'Micah 6:8', text: 'He has told you, O man, what is good; and what does the LORD require of you but to do justice, and to love kindness (hesed).' },
    ],
  },
  {
    topic: 'The Holy Spirit & Regeneration (Ruach & Pneuma)',
    category: 'Theology',
    hebrewOrGreek: 'רוּחַ (Ruach) / Πνεῦμα (Pneuma)',
    definition: 'The third Person of the Trinity who convicts, indwells, regenerates, guides, and empowers believers.',
    keyVerses: [
      { ref: 'Ezekiel 36:26-27', text: '"I will give you a new heart, and a new spirit I will put within you... And I will put my Spirit within you."' },
      { ref: 'John 3:5-6', text: '"Unless one is born of water and the Spirit, he cannot enter the kingdom of God."' },
      { ref: 'John 14:26', text: '"But the Helper, the Holy Spirit, whom the Father will send in my name, he will teach you all things."' },
      { ref: 'Acts 1:8', text: '"You will receive power when the Holy Spirit has come upon you, and you will be my witnesses."' },
    ],
  },
  {
    topic: 'Creation & Divine Sovereignty (Bara)',
    category: 'Old Testament',
    hebrewOrGreek: 'בָּרָא (Bara) / שָׁמַיִם וָאָרֶץ (Shamayim va’Aretz)',
    definition: 'The effortless cosmic creation ex nihilo (out of nothing) by the Word of God, uniquely attributed to divine initiative.',
    keyVerses: [
      { ref: 'Genesis 1:1', text: 'In the beginning, God created the heavens and the earth.' },
      { ref: 'Psalm 33:6, 9', text: 'By the word of the LORD the heavens were made... For he spoke, and it came to be; he commanded, and it stood firm.' },
      { ref: 'Isaiah 40:28', text: 'Have you not known? Have you not heard? The LORD is the everlasting God, the Creator of the ends of the earth.' },
      { ref: 'Colossians 1:16', text: 'For by him all things were created, in heaven and on earth, visible and invisible, whether thrones or dominions.' },
    ],
  },
  {
    topic: 'Eschatology & The Kingdom of God (Basileia tou Theou)',
    category: 'Theology',
    hebrewOrGreek: 'מַלְכוּת (Malkuth) / Βασιλεία τοῦ Θεοῦ (Basileia tou Theou)',
    definition: 'The sovereign rule and reign of God, already inaugurated in Christ’s first coming and consummate in His glorious return.',
    keyVerses: [
      { ref: 'Daniel 7:14', text: 'And to him was given dominion and glory and a kingdom, that all peoples, nations, and languages should serve him.' },
      { ref: 'Mark 1:15', text: '"The time is fulfilled, and the kingdom of God is at hand; repent and believe in the gospel."' },
      { ref: '1 Corinthians 15:24-25', text: 'Then comes the end, when he delivers the kingdom to God the Father after destroying every rule and every authority and power.' },
      { ref: 'Revelation 21:3', text: '"Behold, the dwelling place of God is with man. He will dwell with them, and they will be his people."' },
    ],
  },
];

interface ConcordanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertVerse?: (verseText: string) => void;
}

export function ConcordanceModal({ isOpen, onClose, onInsertVerse }: ConcordanceModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const categories = ['All', 'Theology', 'Old Testament', 'New Testament'];

  const filtered = concordanceDatabase.filter((entry) => {
    const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
    const term = search.toLowerCase();
    const matchesSearch =
      entry.topic.toLowerCase().includes(term) ||
      (entry.hebrewOrGreek && entry.hebrewOrGreek.toLowerCase().includes(term)) ||
      entry.definition.toLowerCase().includes(term) ||
      entry.keyVerses.some((v) => v.ref.toLowerCase().includes(term) || v.text.toLowerCase().includes(term));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Scripture Concordance & Topical Index</span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  CBT Auxiliary Tool
                </span>
              </h2>
              <p className="text-xs text-slate-400">Search key doctrines, theological terms, and cross-references across canon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by topic, verse citation (e.g. Genesis 15, Romans 3), or Greek/Hebrew root..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Concordance Results List */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No concordance topics matched your query. Try searching for "Covenant", "Atonement", "Justification", or a book like "Romans".
            </div>
          ) : (
            filtered.map((entry, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-5 hover:border-slate-600 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{entry.topic}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {entry.category}
                      </span>
                    </div>
                    {entry.hebrewOrGreek && (
                      <div className="text-xs font-mono text-amber-300 font-semibold mt-0.5">
                        {entry.hebrewOrGreek}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {entry.definition}
                </p>

                {/* Key Scripture Verses */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Key Scripture Cross-References:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {entry.keyVerses.map((verse, vIdx) => {
                      const copyId = `entry-${idx}-v-${vIdx}`;
                      const formattedText = `"${verse.text}" (${verse.ref})`;
                      return (
                        <div
                          key={vIdx}
                          className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs font-bold text-indigo-300 mb-1">{verse.ref}</div>
                            <div className="text-[11px] text-slate-300 italic leading-relaxed">
                              "{verse.text}"
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-800/60">
                            {onInsertVerse && (
                              <button
                                type="button"
                                onClick={() => onInsertVerse(formattedText)}
                                className="px-2 py-1 text-[10px] rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 transition font-medium"
                                title="Insert into current answer"
                              >
                                Insert into Answer
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopy(formattedText, copyId)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              title="Copy verse"
                            >
                              {copiedKey === copyId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

