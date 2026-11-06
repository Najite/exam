'use client';

import React, { useState } from 'react';
import { X, BookOpen, Search, Copy, Check, Heart, Shield, Sparkles } from 'lucide-react';

interface FormulaSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FormulaSheetModal({ isOpen, onClose }: FormulaSheetModalProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'stories' | 'verses' | 'commandments'>('stories');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const teenBibleData = {
    stories: [
      {
        name: 'Daniel & The Babylonian Pressure',
        ref: 'Daniel 1:8; 6:10',
        summary: 'Standing Firm • Counter-Cultural Faith • Unshakable Conviction',
        desc: 'As young captives in Babylon, Daniel and his friends resolved not to defile themselves with royal food or bow to golden idols. Daniel prayed consistently despite threats, showing teens how to live out holy convictions in a secular culture.',
      },
      {
        name: 'Shadrach, Meshach & Abednego: "Even If" Faith',
        ref: 'Daniel 3:16-18',
        summary: 'Courage under Fire • Defying the Golden Idol • God is With Us',
        desc: 'Facing execution in the fiery furnace, they boldly told the king: "Our God is able to deliver us... but even if He does not, we will not serve your gods." True faith stands for righteousness regardless of social consequences.',
      },
      {
        name: 'Queen Esther: "For Such a Time as This"',
        ref: 'Esther 4:14-16',
        summary: 'Purpose • Sacred Risk • "If I Perish, I Perish"',
        desc: 'Risking her life to approach the Persian king, Esther embraced her divine calling to protect her people. She teaches teens that God places each person in their sphere of influence for a transcendent purpose.',
      },
      {
        name: 'Joseph: Integrity in the Dark',
        ref: 'Genesis 39:9; 50:20',
        summary: 'Fleeing Temptation • Purity • Forgiving Past Trauma',
        desc: 'When tempted in secret, Joseph refused, saying: "How could I do such a wicked thing and sin against God?" He fled temptation rather than flirting with it, and later recognized God’s sovereignty even over his brothers’ betrayal.',
      },
      {
        name: 'Timothy: Young Leadership in the Church',
        ref: '1 Timothy 4:12',
        summary: 'Example in Youth • Speech, Conduct, Love, Faith, Purity',
        desc: 'Paul mentored young Timothy, reminding him never to let older people disqualify him due to age. Teenagers can lead by modeling Christlike integrity, authentic love, and unwavering faith.',
      },
      {
        name: 'Peter: Redemption After Failure',
        ref: 'Luke 22:54-62; John 21:15-19',
        summary: 'Grace After Denial • Restoration • "Feed My Sheep"',
        desc: 'Peter wept bitterly after denying Jesus three times out of fear. But Jesus lovingly reinstated him on the beach, asking "Do you love me?" God’s grace is greater than our worst failures.',
      },
      {
        name: 'Paul & Silas in Prison: Praise in Chains',
        ref: 'Acts 16:22-34',
        summary: 'Praise Over Anxiety • Midnight Worship • Supernatural Breakthrough',
        desc: 'Beaten and placed in stocks in Philippi, Paul and Silas sang hymns at midnight instead of despairing. God sent an earthquake that opened doors, leading to the salvation of the jailer’s entire household.',
      },
    ],
    verses: [
      {
        name: 'Romans 12:1-2 - Non-Conformity & Mind Renewal',
        ref: 'Romans 12:1-2',
        summary: '“Do not conform to the pattern of this world, but be transformed by the renewing of your mind…”',
        desc: 'The ultimate teen anchor verse: resist being squeezed into secular culture’s mold. Let God’s truth transform your thoughts, desires, and identity.',
      },
      {
        name: '1 Timothy 4:12 - Setting the Standard as a Youth',
        ref: '1 Timothy 4:12',
        summary: '“Don’t let anyone look down on you because you are young, but set an example…”',
        desc: 'God calls teenagers to lead right now—in your speech, lifestyle, love, faith, and purity—not just when you become an adult.',
      },
      {
        name: 'Philippians 4:6-7 - Anxiety into Peace',
        ref: 'Philippians 4:6-7',
        summary: '“Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God…”',
        desc: 'Replace panic with prayer. God’s supernatural peace, which surpasses all human understanding, will guard your heart and mind in Christ Jesus.',
      },
      {
        name: 'Psalm 139:13-14 - Identity & Self-Worth',
        ref: 'Psalm 139:13-14',
        summary: '“I praise you because I am fearfully and wonderfully made…”',
        desc: 'In a world driven by social media filters and comparison, Psalm 139 declares that your worth was personally woven by God before you were born.',
      },
      {
        name: '1 Peter 3:15 - Apologetics & Defending the Faith',
        ref: '1 Peter 3:15',
        summary: '“Always be prepared to give an answer to everyone who asks you for the reason for the hope you have…”',
        desc: 'Understand what you believe and why you believe it, always communicating truth with gentleness, humility, and respect.',
      },
      {
        name: 'Proverbs 3:5-6 - Guidance & Trust',
        ref: 'Proverbs 3:5-6',
        summary: '“Trust in the LORD with all your heart and lean not on your own understanding…”',
        desc: 'A vital life compass for future decisions, college, relationships, and career: acknowledge God in every path, and He will direct your steps.',
      },
    ],
    commandments: [
      {
        name: 'The Full Armor of God (Teen Field Guide)',
        ref: 'Ephesians 6:10-18',
        summary: 'Belt of Truth • Breastplate of Righteousness • Shoes of Peace • Shield of Faith • Helmet of Salvation • Sword of the Spirit',
        desc: 'Spiritual warfare is real in school and culture. Truth counters cultural lies; righteousness protects your heart; faith extinguishes flaming arrows of doubt and insecurity; God’s Word is your offensive weapon.',
      },
      {
        name: 'The Beatitudes: Radical Kingdom Living',
        ref: 'Matthew 5:3-12',
        summary: 'Poverty of Spirit • Meekness (Strength Under Control) • Peacemakers • Purity of Heart',
        desc: 'Jesus overturns worldly values: true happiness isn’t popularity or pride, but humility, hunger for righteousness, mercy, and peacemaking.',
      },
      {
        name: 'Fruit of the Spirit in Daily Relationships',
        ref: 'Galatians 5:22-23',
        summary: 'Love, Joy, Peace, Patience, Kindness, Goodness, Faithfulness, Gentleness, Self-Control',
        desc: 'Authentic signs of the Holy Spirit living inside a teenager. Self-control and gentleness in a culture of impulsiveness and outrage.',
      },
      {
        name: 'The Great Commission',
        ref: 'Matthew 28:18-20',
        summary: 'Go and make disciples of all nations, baptizing and teaching them to obey everything Christ commanded.',
        desc: 'Every young believer is called to be an ambassador for Jesus in their school, campus, sports teams, and digital presence.',
      },
    ],
  };

  const list = teenBibleData[activeTab].filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase()) ||
      item.ref.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Youth Bible Companion & Scripture Guide</h2>
              <p className="text-xs text-slate-400">Anchor verses, key heroes & turning points, and real-life Armor of God</p>
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
              placeholder="Search heroes, anchor verses, topics (e.g. Daniel, Romans 12, Armor of God)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            {[
              { id: 'stories' as const, label: 'Heroes & Turning Points', icon: Sparkles },
              { id: 'verses' as const, label: 'Anchor Life Verses', icon: Heart },
              { id: 'commandments' as const, label: 'Armor of God & Ethics', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {list.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No Bible stories or verses found matching &quot;{search}&quot;.
            </div>
          ) : (
            list.map((item, idx) => {
              const key = `${activeTab}-${idx}`;
              const isCopied = copiedKey === key;

              return (
                <div
                  key={key}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {item.ref}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-amber-200 mt-1">
                        {item.summary}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopy(`${item.name} (${item.ref}): ${item.summary}\n${item.desc}`, key)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition shrink-0 opacity-0 group-hover:opacity-100"
                      title="Copy to scratchpad"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
