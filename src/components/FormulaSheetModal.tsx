'use client';

import React, { useState } from 'react';
import { X, BookOpen, Search, Copy, Check, ScrollText, Landmark, Languages } from 'lucide-react';

interface FormulaSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FormulaSheetModal({ isOpen, onClose }: FormulaSheetModalProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'covenants' | 'terms' | 'canon'>('covenants');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const biblicalCategories = {
    covenants: [
      {
        name: 'Edenic / Adamic Covenant',
        ref: 'Genesis 1:26-30; 2:15-17; 3:15',
        formula: 'Mandate: Fill earth & rule • Prohibition: Tree of Knowledge • Seed Promise (Protoevangelium Gen 3:15)',
        desc: 'Universal covenant of creation, work, and moral probation. Gen 3:15 promises the Seed of the woman crushing the serpent.',
      },
      {
        name: 'Noahic Covenant',
        ref: 'Genesis 9:8-17',
        formula: 'Universal Preservation • Sign: The Rainbow (Qeshet) • Prohibition against murder/eating blood',
        desc: 'Unconditional covenant guaranteeing preservation of the earth from universal flood until the consummation.',
      },
      {
        name: 'Abrahamic Covenant',
        ref: 'Genesis 12:1-3; 15:1-21; 17:1-14',
        formula: 'Promises: Seed, Land (Canaan), Universal Blessing • Sign: Circumcision • Unilateral oath by Yahweh',
        desc: 'Foundational redemptive covenant ratified through the burning lamp passing through the pieces (Gen 15) and fulfilled in Christ (Gal 3:16).',
      },
      {
        name: 'Mosaic (Sinaitic) Covenant',
        ref: 'Exodus 19-24; Deuteronomy 28',
        formula: 'Conditional Suzerain-Vassal Treaty • Decalogue & Ceremonial Law • Sign: The Sabbath • Ratified with blood',
        desc: 'Establishes Israel as a holy nation and kingdom of priests; carries explicit blessing for obedience and curses for disobedience.',
      },
      {
        name: 'Davidic Covenant',
        ref: '2 Samuel 7:8-16; Psalm 89; 132',
        formula: 'Unconditional Royal Dynastic Grant • Eternal Throne, House, and Kingdom • Fulfilled in Christ the Son of David',
        desc: 'Yahweh promises David an everlasting dynasty culminating in the Messiah whose kingdom shall have no end (Luke 1:32-33).',
      },
      {
        name: 'The New Covenant (Berith Chadashah)',
        ref: 'Jeremiah 31:31-34; Luke 22:20; Hebrews 8:6-13',
        formula: 'Law on hearts • Sins remembered no more • Mediator: Jesus Christ • Ratified by the blood of Christ',
        desc: 'Inward spiritual regeneration, universal knowledge of God, total remission of sins, mediated by Christ our High Priest.',
      },
    ],
    terms: [
      {
        name: 'Hesed (חֶסֶד) - Hebrew',
        ref: 'Exodus 34:6-7; Psalm 136',
        formula: 'Steadfast covenant love, lovingkindness, unfailing loyal grace',
        desc: 'God’s unshakeable fidelity and relational devotion to His covenant people despite human unfaithfulness.',
      },
      {
        name: 'Shalom (שָׁלוֹם) - Hebrew',
        ref: 'Numbers 6:24-26; Isaiah 9:6',
        formula: 'Wholeness, completeness, sound moral order, cosmic well-being and reconciliation',
        desc: 'Far more than the absence of conflict; denotes flourishing, justice, and harmonious communion with God.',
      },
      {
        name: 'Berith (בְּרִית) - Hebrew',
        ref: 'Genesis 15:18; Exodus 24:8',
        formula: 'Covenant, binding solemn treaty, oath sealed in blood',
        desc: 'The foundational relational framework between God and humanity; cut (karath berith) through sacrifice.',
      },
      {
        name: 'Go’el (גֹּאֵל) - Hebrew',
        ref: 'Leviticus 25:25; Ruth 4:1-10; Job 19:25',
        formula: 'Kinsman-Redeemer, vindicator, legal protector of family land and legacy',
        desc: 'A near relative who buys back enslaved family or land; Boaz serves as a type fulfilled in Christ our Redeemer.',
      },
      {
        name: 'Kippur / Kapporeth (כִּפּוּר) - Hebrew',
        ref: 'Leviticus 16; Exodus 25:17-22',
        formula: 'Atonement, covering, Mercy Seat (propitiatory cover of the Ark)',
        desc: 'The ritual covering and cleansing of sin through innocent sacrificial blood sprinkled before Yahweh.',
      },
      {
        name: 'Logos (Λόγος) - Greek',
        ref: 'John 1:1, 14; 1 John 1:1; Revelation 19:13',
        formula: 'The Divine Word, Reason, Eternal Self-Expression of the Godhead',
        desc: 'Christ as the eternal Creator who was with God, was God, and became flesh to tabernacle among humanity.',
      },
      {
        name: 'Agape (Ἀγάπη) - Greek',
        ref: 'John 3:16; 1 Corinthians 13; 1 John 4:8',
        formula: 'Unconditional, self-giving, sacrificial divine love',
        desc: 'Love determined by the nature of the giver, choosing the highest good of the recipient without regard for personal cost.',
      },
      {
        name: 'Kenosis (Κένωσις) - Greek',
        ref: 'Philippians 2:5-11',
        formula: 'Self-emptying, voluntary humiliation of the Son in the Incarnation',
        desc: 'Christ veiling His glory and taking the form of a bondservant to endure the cross without abandoning His deity.',
      },
      {
        name: 'Parakletos (Παράκλητος) - Greek',
        ref: 'John 14:16, 26; 15:26; 16:7; 1 John 2:1',
        formula: 'Comforter, Advocate, Helper, One called alongside to assist',
        desc: 'Title of the Holy Spirit sent by the Father and Son, and of Jesus Christ our Advocate before the Father.',
      },
      {
        name: 'Dikaiosyne (Δικαιοσύνη) - Greek',
        ref: 'Romans 1:17; 3:21-26; 5:1',
        formula: 'Righteousness, justification, divine legal acquittal by faith',
        desc: 'The imputation of Christ’s perfect righteousness to the believer through faith apart from the works of the Law.',
      },
    ],
    canon: [
      {
        name: 'The Tanakh (Old Testament Divisions)',
        ref: 'Luke 24:44; Matthew 5:17',
        formula: 'Torah (Law: 5) • Nevi’im (Prophets: 8/21) • Ketuvim (Writings: 11/13)',
        desc: 'The traditional tripartite Jewish canon recognized by Jesus as testifying of His death and resurrection.',
      },
      {
        name: 'New Testament Canonical Divisions',
        ref: '27 Canonical Books',
        formula: 'Gospels (4) • Acts (1) • Pauline Epistles (13) • General Epistles (8) • Revelation (1)',
        desc: 'Apostolic witness to the life, death, resurrection, theological expansion, and apocalyptic consummation in Christ.',
      },
      {
        name: 'Chronology: The Exodus & Sinai',
        ref: 'Exodus 12-20',
        formula: 'Circa 1446 BC (Early Date) or 1260 BC (Late Date)',
        desc: 'Deliverance of Israel from Egyptian bondage, institution of the Passover, and delivery of the Law at Mount Sinai.',
      },
      {
        name: 'Chronology: United Monarchy & Temple Dedication',
        ref: '1 Samuel 8 - 1 Kings 8',
        formula: 'Saul (~1050 BC) • David (~1010-970 BC) • Solomon (~970-930 BC) • Temple Dedicated (~966 BC)',
        desc: 'The golden age of Israel under Davidic kingship and the building of the First Temple in Jerusalem.',
      },
      {
        name: 'Chronology: Divided Kingdom & Exiles',
        ref: '2 Kings 17; 25; 2 Chronicles 36',
        formula: 'Fall of Northern Israel to Assyria: 722 BC • Fall of Jerusalem to Babylon: 586 BC • Edict of Cyrus: 539 BC',
        desc: 'Judgment on idolatry leading to exile; 70-year Babylonian captivity ended by Persian decree under Cyrus the Great.',
      },
      {
        name: 'Chronology: Apostolic Church Milestones',
        ref: 'Acts 2; Acts 15; Galatians 2',
        formula: 'Crucifixion/Resurrection (~30/33 AD) • Jerusalem Council (~49 AD) • Destruction of Second Temple (70 AD)',
        desc: 'Birth of the Church at Pentecost, formal inclusion of Gentiles without circumcision at Jerusalem, and fall of Jerusalem.',
      },
    ],
  };

  const list = biblicalCategories[activeTab].filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.formula.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase()) ||
      item.ref.toLowerCase().includes(search.toLowerCase())
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
              <h2 className="text-base font-bold text-white">Scripture & Biblical Reference Sheet</h2>
              <p className="text-xs text-slate-400">Approved theological covenants, original language roots, and canon timeline</p>
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
              placeholder="Search covenants, Greek/Hebrew terms, scriptures, or dates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('covenants')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'covenants' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>Biblical Covenants</span>
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'terms' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Hebrew & Greek Terms</span>
            </button>
            <button
              onClick={() => setActiveTab('canon')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'canon' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Canon & Chronology</span>
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {list.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No biblical entries matched your search.
            </div>
          ) : (
            list.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl hover:border-slate-600 transition flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{item.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                      {item.ref}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-200">{item.formula}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
                </div>
                <button
                  onClick={() => handleCopy(`${item.name} (${item.ref}): ${item.formula}`, `${activeTab}-${idx}`)}
                  className="p-2 bg-slate-700/60 hover:bg-slate-700 rounded-lg text-slate-300 transition shrink-0 mt-1"
                  title="Copy reference"
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
