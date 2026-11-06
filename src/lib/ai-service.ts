import { Exam, Question, QuestionOption, DifficultyLevel, QuestionType, AIEvaluation, AIAnalytics, TopicBreakdown } from '@/types';

interface GenerateExamParams {
  topic: string;
  category: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  durationMinutes: number;
  questionTypes: QuestionType[];
  contextMaterial?: string;
  apiKey?: string;
}

// OpenRouter LLM Gateway
async function callOpenRouter(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options: { apiKey?: string; jsonMode?: boolean; temperature?: number } = {}
): Promise<string> {
  const key = options.apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('No OpenRouter API key found');

  const targetModel = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';
  // Try target model (google/gemma-4-31b-it:free) first, fallback to openrouter/free if temporarily rate-limited
  const candidateModels = [targetModel];
  if (targetModel !== 'openrouter/free') {
    candidateModels.push('openrouter/free');
  }

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Cognita CBT Platform',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.6,
        }),
        signal: AbortSignal.timeout(18000),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      } else {
        const errText = await res.text();
        console.warn(`OpenRouter model ${model} returned ${res.status}:`, errText);
        lastError = new Error(`OpenRouter (${model}) status ${res.status}: ${errText}`);
      }
    } catch (err) {
      console.warn(`OpenRouter network error on model ${model}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All OpenRouter candidate models failed');
}

function extractJsonFromText(rawText: string): any {
  let cleaned = (rawText || '').trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

export async function generateExamWithAI(params: GenerateExamParams): Promise<Exam> {
  const openRouterKey = params.apiKey?.startsWith('sk-or-') ? params.apiKey : process.env.OPENROUTER_API_KEY;
  const geminiKey = params.apiKey || process.env.GEMINI_API_KEY;

  // 1. Try OpenRouter (google/gemma-4-31b-it:free)
  if (openRouterKey) {
    try {
      const generated = await callOpenRouterExamGeneration(params, openRouterKey);
      if (generated && generated.questions?.length > 0) {
        return generated;
      }
    } catch (err) {
      console.warn('OpenRouter exam generation error, attempting fallback:', err);
    }
  }

  // 2. Try Gemini API if key is available
  if (geminiKey && geminiKey !== openRouterKey) {
    try {
      const generated = await callGeminiExamGeneration(params, geminiKey);
      if (generated && generated.questions?.length > 0) {
        return generated;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to built-in AI synthesizer:', err);
    }
  }

  // 3. Fallback to high-fidelity built-in smart AI generator
  return generateSmartLocalExam(params);
}

async function callOpenRouterExamGeneration(params: GenerateExamParams, apiKey: string): Promise<Exam> {
  const prompt = `You are an expert biblical scholar, theologian, and psychometric test design authority.
Create a rigorous, high-stakes Computer-Based Test (CBT) examination in JSON format focusing on Biblical Studies, Scripture, Exegesis, or Christian Theology on the topic: "${params.topic}".
Category: ${params.category || 'Biblical Studies'}
Target Difficulty: ${params.difficulty}
Number of Questions: ${params.questionCount}
Allowed Question Types: ${params.questionTypes.join(', ')}
${params.contextMaterial ? `Source Scripture / Reference Material:\n"""${params.contextMaterial}"""\n` : ''}

CRITICAL: Return ONLY valid, raw JSON (no markdown formatting, no \`\`\`json code blocks).
Include specific biblical citations (book, chapter, verse), original language concepts where appropriate (Hebrew/Greek), and clear theological justifications in the explanations.
The JSON must adhere strictly to this schema:
{
  "title": "Clear biblical exam title",
  "description": "Comprehensive description of biblical scope and learning objectives",
  "category": "${params.category || 'Biblical Studies'}",
  "difficulty": "${params.difficulty}",
  "durationMinutes": ${params.durationMinutes},
  "passingScore": 70,
  "instructions": [
    "Read all biblical texts and question stems carefully before answering.",
    "Biblical reference sheet and scratchpad are accessible from the top toolbar.",
    "Full-screen lock and AI proctoring are enforced."
  ],
  "questions": [
    {
      "id": "q1",
      "type": "mcq_single" | "mcq_multiple" | "true_false" | "short_answer",
      "text": "Detailed question prompt with scriptural context",
      "topic": "Specific subtopic or biblical book",
      "bloomLevel": "knowledge" | "comprehension" | "application" | "analysis" | "evaluation",
      "marks": 5,
      "options": [
        { "id": "opt_a", "text": "Option A text" },
        { "id": "opt_b", "text": "Option B text" },
        { "id": "opt_c", "text": "Option C text" },
        { "id": "opt_d", "text": "Option D text" }
      ],
      "correctAnswer": "opt_b",
      "explanation": "Thorough theological and scriptural justification with relevant verses",
      "evaluationRubric": "Rubric criteria for short answer evaluation"
    }
  ]
}`;

  const rawText = await callOpenRouter([
    {
      role: 'system',
      content: 'You are an authoritative psychometrician and biblical scholar. Always output valid JSON strictly adhering to the requested schema without conversational filler.',
    },
    { role: 'user', content: prompt },
  ], { apiKey, temperature: 0.5 });

  const parsed = extractJsonFromText(rawText);
  const totalMarks = (parsed.questions || []).reduce((acc: number, q: any) => acc + (q.marks || 5), 0);

  return {
    id: `exam-ai-${Date.now()}`,
    title: parsed.title || `${params.topic} Assessment`,
    description: parsed.description || `AI-generated assessment for ${params.topic}`,
    category: parsed.category || params.category || 'Biblical Studies',
    difficulty: params.difficulty,
    durationMinutes: params.durationMinutes,
    passingScore: parsed.passingScore || 70,
    totalMarks: totalMarks || (params.questionCount * 5),
    isPublished: true,
    createdAt: new Date().toISOString(),
    proctoringSettings: {
      enableWebcam: true,
      enableMic: true,
      enableFullscreen: true,
      maxTabSwitches: 3,
      aiFaceDetection: true,
      blockCopyPaste: true,
    },
    instructions: parsed.instructions || [
      'Proctored CBT environment active.',
      'Answer all questions to the best of your ability.',
      'Auto-save is enabled.',
    ],
    questions: (parsed.questions || []).map((q: any, i: number) => ({
      ...q,
      id: q.id || `gen_q_${i + 1}`,
      marks: q.marks || 5,
    })),
  };
}

async function callGeminiExamGeneration(params: GenerateExamParams, apiKey: string): Promise<Exam> {
  const prompt = `You are an expert biblical scholar, theologian, and psychometric test design authority.
Create a rigorous, high-stakes Computer-Based Test (CBT) examination in JSON format focusing on Biblical Studies, Scripture, Exegesis, or Christian Theology on the topic: "${params.topic}".
Category: ${params.category || 'Biblical Studies'}
Target Difficulty: ${params.difficulty}
Number of Questions: ${params.questionCount}
Allowed Question Types: ${params.questionTypes.join(', ')}
${params.contextMaterial ? `Source Scripture / Reference Material:\n"""${params.contextMaterial}"""\n` : ''}

CRITICAL: Return ONLY valid, raw JSON (no markdown formatting, no \`\`\`json code blocks).
Include specific biblical citations (book, chapter, verse), original language concepts where appropriate (Hebrew/Greek), and clear theological justifications in the explanations.
The JSON must adhere strictly to this schema:
{
  "title": "Clear biblical exam title",
  "description": "Comprehensive description of biblical scope and learning objectives",
  "category": "${params.category || 'Biblical Studies'}",
  "difficulty": "${params.difficulty}",
  "durationMinutes": ${params.durationMinutes},
  "passingScore": 70,
  "instructions": [
    "Read all biblical texts and question stems carefully before answering.",
    "Biblical reference sheet and scratchpad are accessible from the top toolbar.",
    "Full-screen lock and AI proctoring are enforced."
  ],
  "questions": [
    {
      "id": "q1",
      "type": "mcq_single" | "mcq_multiple" | "true_false" | "short_answer",
      "text": "Detailed question prompt with scriptural context",
      "topic": "Specific subtopic or biblical book",
      "bloomLevel": "knowledge" | "comprehension" | "application" | "analysis" | "evaluation",
      "marks": 5,
      "options": [
        { "id": "opt_a", "text": "Option A text" },
        { "id": "opt_b", "text": "Option B text" },
        { "id": "opt_c", "text": "Option C text" },
        { "id": "opt_d", "text": "Option D text" }
      ],
      "correctAnswer": "opt_b",
      "explanation": "Thorough theological and scriptural justification with relevant verses",
      "evaluationRubric": "Rubric criteria for short answer evaluation"
    }
  ]
}`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini API error status ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('No content returned from Gemini');

  const cleanJson = rawText.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleanJson);

  const totalMarks = (parsed.questions || []).reduce((acc: number, q: any) => acc + (q.marks || 5), 0);

  return {
    id: `exam-ai-${Date.now()}`,
    title: parsed.title || `${params.topic} Assessment`,
    description: parsed.description || `AI-generated assessment for ${params.topic}`,
    category: parsed.category || params.category || 'General',
    difficulty: params.difficulty,
    durationMinutes: params.durationMinutes,
    passingScore: parsed.passingScore || 70,
    totalMarks: totalMarks || (params.questionCount * 5),
    isPublished: true,
    createdAt: new Date().toISOString(),
    proctoringSettings: {
      enableWebcam: true,
      enableMic: true,
      enableFullscreen: true,
      maxTabSwitches: 3,
      aiFaceDetection: true,
      blockCopyPaste: true,
    },
    instructions: parsed.instructions || [
      'Proctored CBT environment active.',
      'Answer all questions to the best of your ability.',
      'Auto-save is enabled.',
    ],
    questions: (parsed.questions || []).map((q: any, i: number) => ({
      ...q,
      id: q.id || `gen_q_${i + 1}`,
      marks: q.marks || 5,
    })),
  };
}

// Built-in smart generator when external key is not supplied
function generateSmartLocalExam(params: GenerateExamParams): Exam {
  const topicsMap: Record<string, { title: string; subtopics: string[]; sampleQuestions: Partial<Question>[] }> = {
    old_testament: {
      title: 'Old Testament Literature, Torah & Biblical Covenants',
      subtopics: ['Abrahamic Covenant', 'Yom Kippur Rituals', 'Tabernacle Theology', 'Prophetic Literature & Isaiah 53'],
      sampleQuestions: [
        {
          type: 'mcq_single',
          text: 'In Genesis 15, during the formal ratification of the Abrahamic covenant, what was the theological significance of the smoking fire pot and flaming torch passing between the divided animal pieces while Abram slept?',
          options: [
            { id: 'opt_a', text: 'It signified a bilateral conditional treaty where both parties were equally bound to death penalties' },
            { id: 'opt_b', text: 'It demonstrated Yahweh taking sole unilateral responsibility for the covenant oath upon Himself' },
            { id: 'opt_c', text: 'It indicated Abram’s priestly ordination before Melchizedek' },
            { id: 'opt_d', text: 'It represented the collective tribal elders of Israel consecrating the land grant' },
          ],
          correctAnswer: 'opt_b',
          explanation: 'In ancient Near Eastern covenant-cutting ceremonies, passing between halves invoked a self-maledictory oath. In Genesis 15:17-18, God alone in the theophanic torch and pot passed through, unilaterally binding Himself to fulfill the promise.',
          topic: 'Torah & Covenants',
          bloomLevel: 'analysis',
          marks: 5,
        },
        {
          type: 'short_answer',
          text: 'Explain the dual-goat ceremony prescribed on the Day of Atonement (Yom Kippur) in Leviticus 16. Detail the distinct symbolic function of the sacrificial goat versus the scapegoat (Azazel).',
          correctAnswer: 'In Leviticus 16, the first goat is slaughtered as a sin offering for the sanctuary and people, with its blood sprinkled upon the Mercy Seat (Kapporeth) to accomplish expiation and propitiation. The second goat (the scapegoat for Azazel) has the sins and iniquities of Israel confessed over its head by the High Priest, and is then led into the uninhabited wilderness, symbolizing the total removal and expiation of guilt away from the camp.',
          evaluationRubric: 'Candidate must identify: 1) First goat slaughtered for blood purification/propitiation on the Mercy Seat, 2) Second goat (Azazel) receiving confessed sins, and 3) The removal of sin into the wilderness representing expiation/forgiveness.',
          explanation: 'The two goats work in tandem: the slaughtered goat addresses the blood atonement required by holy justice, while the scapegoat demonstrates the complete removal of sin’s penalty and presence.',
          topic: 'Levitical Atonement',
          bloomLevel: 'analysis',
          marks: 10,
        },
        {
          type: 'mcq_multiple',
          text: 'Which of the following furniture pieces were placed strictly inside the Holy Place (Hekhal) of the Tabernacle, rather than the Outer Court or Holy of Holies? (Select all that apply)',
          options: [
            { id: 'opt_a', text: 'The Golden Lampstand (Menorah)' },
            { id: 'opt_b', text: 'The Table of Showbread (Bread of the Presence)' },
            { id: 'opt_c', text: 'The Altar of Incense' },
            { id: 'opt_d', text: 'The Bronze Laver of Washing' },
          ],
          correctAnswer: ['opt_a', 'opt_b', 'opt_c'],
          explanation: 'The Holy Place contained the Golden Lampstand (south), Table of Showbread (north), and Altar of Incense (before the veil). The Bronze Laver was outside in the Outer Court, and the Ark of the Covenant was in the Holy of Holies (Exodus 40).',
          topic: 'Tabernacle Sanctuary',
          bloomLevel: 'knowledge',
          marks: 5,
        },
      ],
    },
    new_testament: {
      title: 'New Testament Gospels, Pauline Epistles & Early Church',
      subtopics: ['Pauline Soteriology', 'Johannine Christology', 'Synoptic Gospels', 'Apostolic Council of Jerusalem'],
      sampleQuestions: [
        {
          type: 'mcq_single',
          text: 'In Romans 3:21-26, what theological term describes Christ’s sacrifice as the satisfaction or appeasement of God’s holy wrath against sin through faith in His blood?',
          options: [
            { id: 'opt_a', text: 'Propitiation (Hilasterion)' },
            { id: 'opt_b', text: 'Moral Influence' },
            { id: 'opt_c', text: 'Recapitulation' },
            { id: 'opt_d', text: 'Apotheosis' },
          ],
          correctAnswer: 'opt_a',
          explanation: 'Paul uses the Greek term hilasterion (Romans 3:25), referring to a propitiatory sacrifice that satisfies the demands of God’s holy righteousness and turns away wrath, echoing the Mercy Seat of the Old Testament.',
          topic: 'Pauline Epistles',
          bloomLevel: 'comprehension',
          marks: 5,
        },
        {
          type: 'short_answer',
          text: 'Analyze the Christological hymn in Philippians 2:5-11 (the Carmen Christi). Explain the meaning of the "Kenosis" (self-emptying) and how it relates to Christ’s pre-existence, incarnation, and exaltation.',
          correctAnswer: 'Philippians 2:5-11 articulates that Christ existed eternally in the form of God (en morphe Theou) without considering equality with God something to be grasped for selfish gain. He "emptied Himself" (ekenosen) by taking the form of a servant in human likeness, humbling Himself to death on a cross. Consequently, God hyper-exalted Him and bestowed the name above every name, so that every knee will bow and tongue confess Jesus Christ is Lord (Kurios).',
          evaluationRubric: 'Answer must articulate: 1) Eternal pre-existence in divine nature, 2) Kenosis as voluntary self-humiliation/taking human servant form without forfeiting deity, and 3) Subsequent divine exaltation and universal lordship.',
          explanation: 'Kenosis does not mean divesting deity, but veiling divine glory and voluntarily submitting to the servant role and suffering of the cross.',
          topic: 'Christology',
          bloomLevel: 'analysis',
          marks: 10,
        },
        {
          type: 'mcq_multiple',
          text: 'Which of the following are among the seven iconic "I AM" (Ego Eimi) declarations uttered by Jesus in the Gospel of John? (Select all that apply)',
          options: [
            { id: 'opt_a', text: 'I am the Bread of Life (John 6:35)' },
            { id: 'opt_b', text: 'I am the Good Shepherd (John 10:11)' },
            { id: 'opt_c', text: 'I am the True Vine (John 15:1)' },
            { id: 'opt_d', text: 'I am the King of the Earth (John 18:37)' },
          ],
          correctAnswer: ['opt_a', 'opt_b', 'opt_c'],
          explanation: 'The 7 Johannine I AM sayings are: Bread of Life (6:35), Light of the World (8:12), Door of the Sheep (10:7), Good Shepherd (10:11), Resurrection and Life (11:25), Way, Truth, and Life (14:6), and True Vine (15:1). "King of the Earth" is not one of them.',
          topic: 'Johannine Literature',
          bloomLevel: 'knowledge',
          marks: 5,
        },
      ],
    },
    hermeneutics: {
      title: 'Biblical Hermeneutics, Exegesis & Systematic Theology',
      subtopics: ['Grammatical-Historical Exegesis', 'Analogy of Faith', 'Trinitarian Theology', 'Pneumatology'],
      sampleQuestions: [
        {
          type: 'mcq_single',
          text: 'Which hermeneutical rule asserts that Scripture is its own best interpreter, requiring unclear or ambiguous passages to be interpreted in light of clearer, explicit passages?',
          options: [
            { id: 'opt_a', text: 'Sensus Plenior' },
            { id: 'opt_b', text: 'The Analogy of Faith (Analogia Fidei / Scriptura Sacra Sui Ipsius Interpres)' },
            { id: 'opt_c', text: 'The Allegorical Quadriga' },
            { id: 'opt_d', text: 'Historical-Critical Demythologization' },
          ],
          correctAnswer: 'opt_b',
          explanation: 'The Analogy of Faith (analogia fidei) affirms that because all Scripture is inspired by the Holy Spirit and cannot contradict itself, clear didactic passages govern the interpretation of obscure or apocalyptic passages.',
          topic: 'Hermeneutical Methods',
          bloomLevel: 'comprehension',
          marks: 5,
        },
        {
          type: 'short_answer',
          text: 'Differentiate between biblical "Exegesis" and "Eisegesis", explaining the methodological consequences of each approach to scriptural interpretation.',
          correctAnswer: 'Exegesis (drawing out) is the rigorous process of extracting the original authorial intent and meaning of a biblical text using grammatical, historical, literary, and canonical context. In contrast, Eisegesis (reading into) imposes the interpreter’s preconceived theological notions, modern cultural biases, or personal agenda onto the text, leading to distortion of scripture.',
          evaluationRubric: 'Candidate must clearly define: 1) Exegesis as drawing meaning out from authorial intent and historical-grammatical context, 2) Eisegesis as reading external biases into the text, and 3) The danger of doctrinal corruption caused by eisegesis.',
          explanation: 'Sound biblical hermeneutics demands exegesis to honor the divine and human authors’ intended message.',
          topic: 'Biblical Exegesis',
          bloomLevel: 'analysis',
          marks: 10,
        },
      ],
    },
    biblical_languages: {
      title: 'Biblical Hebrew & Koine Greek Linguistic Analysis',
      subtopics: ['Hebrew Covenant Vocabulary', 'Koine Greek Syntax', 'Semantic Field Analysis', 'Biblical Lexicography'],
      sampleQuestions: [
        {
          type: 'mcq_single',
          text: 'What Hebrew theological term encapsulates Yahweh’s steadfast, unfailing, loyal covenant love and enduring faithfulness toward His people (prominent in Psalm 136 and Exodus 34:6)?',
          options: [
            { id: 'opt_a', text: 'Hesed (חֶסֶד)' },
            { id: 'opt_b', text: 'Shalom (שָׁלוֹם)' },
            { id: 'opt_c', text: 'Tzedakah (צְדָקָה)' },
            { id: 'opt_d', text: 'Qodesh (קֹדֶשׁ)' },
          ],
          correctAnswer: 'opt_a',
          explanation: 'Hesed (חֶסֶד) is the quintessential biblical Hebrew covenant term denoting loyal love, mercy, and unconditional covenant fidelity.',
          topic: 'Biblical Hebrew Lexicography',
          bloomLevel: 'knowledge',
          marks: 5,
        },
        {
          type: 'short_answer',
          text: 'Examine the theological significance of the Greek title "Logos" in John 1:1-14. How does John bridge Hebrew Old Testament concepts (Dabar Yahweh) and Greek philosophical concepts to reveal Jesus Christ?',
          correctAnswer: 'In John 1, "Logos" bridges both Jewish and Greco-Roman worlds. To the Hebrew mind, the Word (Dabar) was God’s active agent in creation, prophetic revelation, and deliverance (Gen 1, Ps 33:6). To Greek thought, Logos was the rational principle ordering the cosmos. John transforms both by declaring that the eternal Logos, who was with God and was God, "became flesh and dwelt among us" (John 1:14), revealing the personal incarnation of the Son of God.',
          evaluationRubric: 'Answer must address: 1) Hebrew background of Dabar Yahweh (creation and revelation), 2) Greek concept of Logos (rational cosmic order), and 3) John’s revolutionary synthesis of the Incarnation (Logos became flesh in Jesus Christ).',
          explanation: 'John’s prologue establishes Christ’s eternal deity, distinct personhood within the Godhead, and genuine human incarnation.',
          topic: 'Koine Greek & Johannine Theology',
          bloomLevel: 'analysis',
          marks: 10,
        },
      ],
    },
  };

  const normalizedTopic = params.topic.toLowerCase().replace(/[^a-z0-9]/g, '');
  let matched = Object.entries(topicsMap).find(([k]) => {
    if (normalizedTopic.includes(k) || k.includes(normalizedTopic)) return true;
    if (k === 'old_testament' && (normalizedTopic.includes('old') || normalizedTopic.includes('torah') || normalizedTopic.includes('genesis') || normalizedTopic.includes('exodus') || normalizedTopic.includes('prophet') || normalizedTopic.includes('covenant') || normalizedTopic.includes('ot'))) return true;
    if (k === 'new_testament' && (normalizedTopic.includes('new') || normalizedTopic.includes('gospel') || normalizedTopic.includes('paul') || normalizedTopic.includes('romans') || normalizedTopic.includes('christ') || normalizedTopic.includes('nt') || normalizedTopic.includes('jesus'))) return true;
    if (k === 'hermeneutics' && (normalizedTopic.includes('hermeneutic') || normalizedTopic.includes('exegesis') || normalizedTopic.includes('theology') || normalizedTopic.includes('doctrine') || normalizedTopic.includes('trinity'))) return true;
    if (k === 'biblical_languages' && (normalizedTopic.includes('greek') || normalizedTopic.includes('hebrew') || normalizedTopic.includes('language') || normalizedTopic.includes('syntax') || normalizedTopic.includes('lexicon'))) return true;
    return false;
  })?.[1];

  const questions: Question[] = [];
  const count = Math.max(3, params.questionCount || 5);

  if (matched) {
    questions.push(...(matched.sampleQuestions as Question[]));
  }

  // Generate dynamic biblical questions to reach target count
  while (questions.length < count) {
    const idx = questions.length + 1;
    const qType: QuestionType = params.questionTypes[idx % params.questionTypes.length] || 'mcq_single';
    const subtopic = `${params.topic} Biblical Exegesis Section ${idx}`;

    if (qType === 'true_false') {
      questions.push({
        id: `gen_q_${idx}`,
        type: 'true_false',
        text: `In sound biblical hermeneutics, must interpretations of ${params.topic} be grounded in the authorial intent, grammatical syntax, and historical-cultural context of the original biblical text rather than subjective eisegesis?`,
        options: [
          { id: 'opt_true', text: 'True' },
          { id: 'opt_false', text: 'False' },
        ],
        correctAnswer: 'opt_true',
        explanation: 'Grammatical-historical exegesis demands determining what the text meant to the original recipients under the human and divine authors before deriving contemporary theological application.',
        topic: subtopic,
        bloomLevel: 'application',
        marks: 5,
      });
    } else if (qType === 'short_answer') {
      questions.push({
        id: `gen_q_${idx}`,
        type: 'short_answer',
        text: `Synthesize the primary theological and canonical significance of ${params.topic}. Cite relevant scripture cross-references and discuss how this doctrine impacts Christian theology.`,
        correctAnswer: `The study of ${params.topic} holds central canonical significance across Scripture. It must be understood in light of redemptive history, demonstrating harmony across Old and New Testaments. Crucial cross-references illuminate God’s redemptive plan and call believers to faithful obedience and sound doctrine.`,
        evaluationRubric: `Candidate must articulate: 1) The core scriptural foundations of ${params.topic}, 2) Key biblical cross-references, and 3) Practical and doctrinal implications for Christian theology.`,
        explanation: `A comprehensive biblical synthesis links historical revelation with canonical theology and personal transformation.`,
        topic: subtopic,
        bloomLevel: 'analysis',
        marks: 10,
      });
    } else {
      questions.push({
        id: `gen_q_${idx}`,
        type: 'mcq_single',
        text: `When analyzing ${params.topic} across the biblical canon, which theological principle best ensures fidelity to scriptural revelation?`,
        options: [
          { id: 'opt_a', text: 'Interpreting difficult passages in light of clear, explicit scripture (The Analogy of Faith)' },
          { id: 'opt_b', text: 'Treating Old Testament historical narratives as detached from Christological fulfillment' },
          { id: 'opt_c', text: 'Subordinating apostolic didactic teaching to cultural relativism' },
          { id: 'opt_d', text: 'Relying exclusively on allegorical speculation without grammatical foundation' },
        ],
        correctAnswer: 'opt_a',
        explanation: 'The Analogy of Faith (analogia fidei) ensures that Scripture interprets Scripture harmoniously without contradictions, grounding doctrinal truth in the unified revelation of God.',
        topic: subtopic,
        bloomLevel: 'application',
        marks: 5,
      });
    }
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return {
    id: `exam-ai-${Date.now()}`,
    title: matched?.title || `${params.topic} Master Certification`,
    description: `Rigorous AI-synthesized Computer-Based Testing module assessing key competencies in ${params.topic}.`,
    category: params.category || 'Biblical Studies',
    difficulty: params.difficulty,
    durationMinutes: params.durationMinutes,
    passingScore: 70,
    totalMarks,
    isPublished: true,
    createdAt: new Date().toISOString(),
    proctoringSettings: {
      enableWebcam: true,
      enableMic: true,
      enableFullscreen: true,
      maxTabSwitches: 3,
      aiFaceDetection: true,
      blockCopyPaste: true,
    },
    instructions: [
      'Welcome to the AI-Proctored testing terminal.',
      'Maintain an active camera feed and remain within screen boundaries throughout the session.',
      'Unscheduled tab switches or window unfocus will be flagged on your integrity audit report.',
    ],
    questions,
  };
}

export async function evaluateShortAnswerWithAI(
  question: Question,
  userAnswer: string,
  apiKey?: string
): Promise<AIEvaluation> {
  const openRouterKey = apiKey?.startsWith('sk-or-') ? apiKey : process.env.OPENROUTER_API_KEY;
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;

  if (userAnswer && userAnswer.trim().length > 5) {
    const prompt = `You are a fair, objective exam evaluator grading a student's answer to a CBT question.
Question: "${question.text}"
Total Available Marks: ${question.marks}
Model Answer: "${question.correctAnswer}"
Evaluation Rubric: "${question.evaluationRubric || 'Assess factual correctness, scriptural precision, and completeness.'}"

Student's Answer: "${userAnswer}"

Grade the student response strictly based on the rubric.
Return ONLY valid JSON matching this structure (no markdown fences, no conversational filler):
{
  "score": number (between 0 and ${question.marks}),
  "maxScore": ${question.marks},
  "accuracy": "high" | "moderate" | "low" | "none",
  "strengths": ["bullet 1", "bullet 2"],
  "improvements": ["what was missing or needs refinement"],
  "reasoning": "Clear explanation of how the score was calculated based on the rubric"
}`;

    // 1. Try OpenRouter (google/gemma-4-31b-it:free)
    if (openRouterKey) {
      try {
        const rawText = await callOpenRouter([
          { role: 'system', content: 'You are an objective academic evaluator. Return raw JSON only.' },
          { role: 'user', content: prompt },
        ], { apiKey: openRouterKey, temperature: 0.2 });

        const parsed = extractJsonFromText(rawText);
        return {
          score: Math.min(question.marks, Math.max(0, Number(parsed.score) || 0)),
          maxScore: question.marks,
          accuracy: parsed.accuracy || 'moderate',
          strengths: parsed.strengths || ['Demonstrated relevant theological context.'],
          improvements: parsed.improvements || [],
          reasoning: parsed.reasoning || 'Evaluated based on theological precision and rubric alignment via Gemma AI.',
        };
      } catch (err) {
        console.warn('OpenRouter evaluation failed, attempting fallback:', err);
      }
    }

    // 2. Try Gemini API
    if (geminiKey && geminiKey !== openRouterKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = extractJsonFromText(rawText);
            return {
              score: Math.min(question.marks, Math.max(0, Number(parsed.score) || 0)),
              maxScore: question.marks,
              accuracy: parsed.accuracy || 'moderate',
              strengths: parsed.strengths || ['Good attempt at addressing the core prompt.'],
              improvements: parsed.improvements || [],
              reasoning: parsed.reasoning || 'Evaluated based on technical accuracy and rubric alignment.',
            };
          }
        }
      } catch (err) {
        console.warn('AI evaluation API failed, falling back to heuristic grading:', err);
      }
    }
  }

  // 3. Fallback to heuristic semantic grader
  return evaluateShortAnswerHeuristically(question, userAnswer);
}

function evaluateShortAnswerHeuristically(question: Question, userAnswer: string): AIEvaluation {
  const answer = (userAnswer || '').toLowerCase().trim();
  const modelAnswer = String(question.correctAnswer || '').toLowerCase();
  const maxScore = question.marks || 10;

  if (!answer || answer.length < 5) {
    return {
      score: 0,
      maxScore,
      accuracy: 'none',
      strengths: [],
      improvements: ['No substantial answer was provided.', 'Review foundational concepts for this topic.'],
      reasoning: 'The response was empty or too brief to demonstrate understanding.',
    };
  }

  // Extract key terms from model answer and rubric
  const rubricTerms = `${modelAnswer} ${question.evaluationRubric || ''}`
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'were', 'which', 'their', 'when', 'what'].includes(w));

  const uniqueTerms = Array.from(new Set(rubricTerms));
  let matchCount = 0;
  for (const term of uniqueTerms) {
    if (answer.includes(term)) {
      matchCount++;
    }
  }

  const matchRatio = uniqueTerms.length > 0 ? matchCount / Math.min(uniqueTerms.length, 12) : 0.5;
  const lengthBonus = Math.min(1, answer.length / 140);
  const compositeScore = Math.min(1, (matchRatio * 0.75) + (lengthBonus * 0.25));

  const finalScore = Math.round(compositeScore * maxScore * 10) / 10;

  let accuracy: 'high' | 'moderate' | 'low' | 'none' = 'moderate';
  if (compositeScore >= 0.75) accuracy = 'high';
  else if (compositeScore < 0.35) accuracy = 'low';

  return {
    score: finalScore,
    maxScore,
    accuracy,
    strengths: [
      matchRatio > 0.4 ? 'Accurately incorporated essential technical domain terminology.' : 'Provided relevant contextual response.',
      answer.length > 80 ? 'Good depth of explanation provided.' : 'Direct and concise response.',
    ],
    improvements: accuracy !== 'high' ? [
      'Could incorporate more specific terminology and concrete examples.',
      'Review the model answer explanation for additional nuances.',
    ] : ['Well-rounded explanation that meets the core rubric expectations.'],
    reasoning: `Awarded ${finalScore}/${maxScore} marks based on alignment with key concepts in the marking rubric and depth of explanation.`,
  };
}

export function generateExamAnalytics(
  exam: Exam,
  questionResults: { questionId: string; isCorrect: boolean; scoreAwarded: number; maxScore: number }[],
  percentage: number
): AIAnalytics {
  const topicMap: Record<string, { score: number; total: number }> = {};

  for (const q of exam.questions) {
    const topic = q.topic || 'General';
    if (!topicMap[topic]) topicMap[topic] = { score: 0, total: 0 };
    const result = questionResults.find((r) => r.questionId === q.id);
    topicMap[topic].total += q.marks;
    if (result) {
      topicMap[topic].score += result.scoreAwarded;
    }
  }

  const topicBreakdown: TopicBreakdown[] = Object.entries(topicMap).map(([topic, data]) => ({
    topic,
    score: data.score,
    total: data.total,
    percentage: data.total > 0 ? Math.round((data.score / data.total) * 100) : 0,
  }));

  const strongTopics = topicBreakdown.filter((t) => t.percentage >= 70).map((t) => t.topic);
  const weakTopics = topicBreakdown.filter((t) => t.percentage < 60).map((t) => t.topic);

  const recommendations: string[] = [];
  if (weakTopics.length > 0) {
    recommendations.push(`Prioritize targeted revision on: ${weakTopics.join(', ')}.`);
    recommendations.push('Work through practice problem sets with step-by-step Socratic walkthroughs.');
  } else {
    recommendations.push('Demonstrated strong mastery across all tested domains. Consider advancing to expert-level modules.');
  }

  const estimatedPercentile = Math.min(99, Math.max(10, Math.round(percentage * 0.95 + (percentage > 80 ? 5 : 0))));

  return {
    topicBreakdown,
    strengths: strongTopics.length > 0 ? strongTopics : ['Completed the full examination under timed conditions.'],
    weaknesses: weakTopics.length > 0 ? weakTopics : ['None identified; consistent performance across tested subtopics.'],
    recommendations,
    summary: percentage >= exam.passingScore
      ? `Candidate passed successfully with ${percentage}% score (${estimatedPercentile}th percentile estimate). Demonstrates strong grasp of core competencies.`
      : `Candidate scored ${percentage}%, falling short of the ${exam.passingScore}% passing threshold. Recommended focused review on highlighted areas of improvement.`,
    estimatedPercentile,
  };
}

export async function askAITutor(
  question: Question,
  userQuestion: string,
  userAnswer?: string | string[],
  apiKey?: string
): Promise<string> {
  const openRouterKey = apiKey?.startsWith('sk-or-') ? apiKey : process.env.OPENROUTER_API_KEY;
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;

  const prompt = `You are a patient, encouraging, and scholarly AI Biblical Socratic tutor on a computer-based theological testing platform.
The student took an exam and is reviewing this biblical question:

Question: "${question.text}"
${question.options ? `Options:\n${question.options.map((o) => `${o.id}: ${o.text}`).join('\n')}\n` : ''}
Correct Answer: ${Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
Official Theological Explanation: ${question.explanation}
Student's Chosen Answer: ${userAnswer ? (Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer) : 'None'}

Student's inquiry to you: "${userQuestion}"

Provide a rich, pastoral, and academically rigorous explanation. Cite relevant scripture verses (book, chapter, verse), original language roots (Hebrew/Greek) if helpful, and gently explain why distractors fall short while upholding orthodox biblical interpretation.`;

  // 1. Try OpenRouter (google/gemma-4-31b-it:free)
  if (openRouterKey) {
    try {
      const text = await callOpenRouter([
        { role: 'system', content: 'You are an encouraging, scholarly Biblical Socratic tutor.' },
        { role: 'user', content: prompt },
      ], { apiKey: openRouterKey, temperature: 0.6 });

      if (text) return text;
    } catch (err) {
      console.warn('OpenRouter tutor error, attempting fallback:', err);
    }
  }

  // 2. Try Gemini API
  if (geminiKey && geminiKey !== openRouterKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (err) {
      console.warn('AI tutor API error, using fallback tutor explanation:', err);
    }
  }

  // 3. Fallback intelligent biblical tutor response
  return `### AI Socratic Scripture Tutor\n\n**Biblical Topic:** ${question.topic}\n\n**Exegesis & Explanation:**\n${question.explanation}\n\n**Theological Synthesis:**\nIn biblical theology, the correct understanding reflects **${Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}**. Sound hermeneutics reminds us to interpret scripture with scripture (*analogia scripturae*). When examining biblical passages, common distractors frequently isolate verses out of their literary, historical, or covenantal framework.\n\n*Exegetical Tip:* Always examine the immediate literary context, parallel texts in the canon, and the overarching redemptive-historical narrative!`;
}

