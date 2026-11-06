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

  const sundaySchoolData = {
    stories: [
      {
        name: 'David & Goliath (1 Samuel 17)',
        ref: '1 Samuel 17:45-49',
        summary: 'Faith in God • 5 Smooth Stones • The battle belongs to the Lord!',
        desc: 'Young shepherd David was not afraid of the giant Goliath because he trusted God. With five smooth stones and a sling, David defeated the giant in the name of the Lord.',
      },
      {
        name: 'Noah’s Ark & The Rainbow (Genesis 6-9)',
        ref: 'Genesis 9:12-17',
        summary: 'Obedience • Animal Pairs • The Rainbow Promise',
        desc: 'Noah obeyed God and built a giant ark to save his family and animals. After the flood, God put the rainbow in the sky as a promise never to flood the earth again.',
      },
      {
        name: 'Daniel in the Lions’ Den (Daniel 6)',
        ref: 'Daniel 6:16-23',
        summary: 'Praying Daily • Angel Protected • Shut the Lions’ Mouths',
        desc: 'Daniel refused to stop praying to God. When he was thrown into a den of hungry lions, God sent His angel to shut their mouths, keeping Daniel completely safe.',
      },
      {
        name: 'Moses & The Red Sea (Exodus 14)',
        ref: 'Exodus 14:13-22',
        summary: 'Deliverance • Parting the Waters • Walking on Dry Ground',
        desc: 'Trapped between Pharaoh’s army and the deep sea, God told Moses to stretch out his staff. God parted the waters so the Israelites walked safely on dry land.',
      },
      {
        name: 'The Good Samaritan (Luke 10)',
        ref: 'Luke 10:25-37',
        summary: 'Loving your Neighbor • Compassion • Helping Anyone in Need',
        desc: 'Jesus told the story of a traveler beaten by robbers. While others walked past, a Samaritan stopped, bandaged his wounds, and paid for his care. Love your neighbor!',
      },
      {
        name: 'The Prodigal Son (Luke 15)',
        ref: 'Luke 15:11-32',
        summary: 'Forgiveness • Father’s Great Hug • Lost and Found',
        desc: 'A younger son ran away and wasted everything. When he returned expecting anger, his loving father ran, hugged, and welcomed him home with a grand celebration!',
      },
      {
        name: 'Feeding the 5,000 (John 6)',
        ref: 'John 6:1-14',
        summary: 'A Boy’s Generosity • 5 Loaves & 2 Fish • 12 Baskets Leftover',
        desc: 'A young boy shared his small lunch with Jesus. Jesus prayed, thanked God, and multiplied the food to feed over 5,000 people with twelve baskets full of leftovers.',
      },
      {
        name: 'Jonah & The Big Fish (Jonah 1-3)',
        ref: 'Jonah 1:17; 2:1-10',
        summary: 'Second Chances • Big Fish • God’s Forgiving Heart',
        desc: 'Jonah tried to run from God, but after three days inside a great fish, he prayed and obeyed God’s call to tell Nineveh about God’s love and forgiveness.',
      },
    ],
    verses: [
      {
        name: 'John 3:16 - God’s Great Love',
        ref: 'John 3:16',
        summary: '“For God so loved the world that He gave His one and only Son…”',
        desc: 'God loves each one of us so much that He sent Jesus so whoever believes in Him will have everlasting life and be part of God’s family.',
      },
      {
        name: 'Psalm 23:1 - The Good Shepherd',
        ref: 'Psalm 23:1-3',
        summary: '“The LORD is my shepherd; I shall not want…”',
        desc: 'God takes care of us just like a kind, gentle shepherd leads and protects his sheep into green pastures and beside quiet waters.',
      },
      {
        name: 'Philippians 4:13 - Strength in Jesus',
        ref: 'Philippians 4:13',
        summary: '“I can do all things through Christ who strengthens me.”',
        desc: 'Whenever we face difficult tests, big challenges, or feel afraid, Jesus gives us courage and strength to overcome.',
      },
      {
        name: 'Proverbs 3:5-6 - Trust in the Lord',
        ref: 'Proverbs 3:5-6',
        summary: '“Trust in the LORD with all your heart and lean not on your own understanding…”',
        desc: 'In all our ways acknowledge God, and He will guide our footsteps on the right path.',
      },
      {
        name: 'The Lord’s Prayer',
        ref: 'Matthew 6:9-13',
        summary: '“Our Father in heaven, hallowed be Your name. Your kingdom come, Your will be done…”',
        desc: 'The prayer Jesus taught His disciples: asking God for our daily bread, forgiving others, and asking for guidance away from temptation.',
      },
      {
        name: 'The Golden Rule',
        ref: 'Luke 6:31; Matthew 7:12',
        summary: '“Do to others as you would have them do to you.”',
        desc: 'Treat every person with the kindness, respect, patience, and love that you want to receive.',
      },
    ],
    commandments: [
      {
        name: 'The 10 Commandments (Simplified for Kids)',
        ref: 'Exodus 20:1-17',
        summary: '1-4: Love God • 5-10: Love People',
        desc: '1. Put God first • 2. No idols • 3. Respect God’s name • 4. Keep the Sabbath holy • 5. Honor mom & dad • 6. Do not murder/hurt • 7. Be faithful • 8. Do not steal • 9. Do not lie • 10. Do not be jealous.',
      },
      {
        name: 'The 9 Fruit of the Spirit',
        ref: 'Galatians 5:22-23',
        summary: 'Love, Joy, Peace, Patience, Kindness, Goodness, Faithfulness, Gentleness, Self-Control',
        desc: 'The qualities that the Holy Spirit grows in our hearts as we follow Jesus every day. Against such things there is no law!',
      },
      {
        name: 'The Full Armor of God',
        ref: 'Ephesians 6:10-18',
        summary: 'Belt of Truth • Breastplate of Righteousness • Shoes of Peace • Shield of Faith • Helmet of Salvation • Sword of the Spirit',
        desc: 'God’s spiritual armor that protects our minds, hearts, and steps so we can stand strong in God’s truth and love.',
      },
      {
        name: 'The Greatest Commandment',
        ref: 'Matthew 22:37-39',
        summary: 'Love God with all your heart, soul, and mind, and love your neighbor as yourself.',
        desc: 'Jesus said all the Law and Prophets hang on these two great commandments.',
      },
    ],
  };

  const list = sundaySchoolData[activeTab].filter(
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
              <h2 className="text-base font-bold text-white">Sunday School Bible Helper</h2>
              <p className="text-xs text-slate-400">Memory verses, famous Bible stories, 10 Commandments & Fruit of the Spirit</p>
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
              placeholder="Search stories, characters, verses (e.g. David, Noah, Love, Psalm 23)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            {[
              { id: 'stories' as const, label: 'Bible Stories & Heroes', icon: Sparkles },
              { id: 'verses' as const, label: 'Memory Verses', icon: Heart },
              { id: 'commandments' as const, label: 'Commandments & Fruit', icon: Shield },
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
