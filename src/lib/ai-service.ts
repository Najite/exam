import { Exam, Question, DifficultyLevel, QuestionType, AIEvaluation, AIAnalytics, TopicBreakdown, QuestionOption } from '@/types';

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

// 10 Verified Free Models on OpenRouter
// Ordered for maximum speed and reliability: primary Gemma models first,
// followed by high-throughput free routers and fast reasoning models.
export const OPENROUTER_FREE_MODELS: readonly string[] = [
  'google/gemma-4-31b-it:free',                         // 1. Google Gemma 4 31B (User's primary selection)
  'google/gemma-4-26b-a4b-it:free',                     // 2. Google Gemma 4 26B A4B
  'openrouter/free',                                    // 3. OpenRouter Free Tier Auto-Router (Fast auto-routing)
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', // 4. NVIDIA Nemotron 3 Nano Omni 30B (High-speed reasoning)
  'cohere/north-mini-code:free',                        // 5. Cohere North Mini Code (Fast instruction)
  'dots-studio/dots-3-note-preview:free',               // 6. Dots Studio Note Preview (Fast response)
  'recursive/flint-v1.0:free',                          // 7. Recursive Flint (256k context)
  'nvidia/nemotron-3.5-lightning:free',                 // 8. NVIDIA Nemotron 3.5 Lightning
  'nvidia/nemotron-3.5-super-vl:free',                  // 9. NVIDIA Nemotron 3.5 Super VL
  'nvidia/nemotron-3-ultra-550b-a55b:free',             // 10. NVIDIA Nemotron 3 Ultra (550B deep reasoning)
] as const;

// OpenRouter LLM Gateway with Multi-Model Free Fallback Chain
// Tries primary model first; if rate-limited (HTTP 429) or busy, seamlessly cascades through free models
async function callOpenRouter(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options: { apiKey?: string; jsonMode?: boolean; temperature?: number; timeoutMs?: number } = {}
): Promise<string> {
  const key = options.apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('No OpenRouter API key found. Please set OPENROUTER_API_KEY in your .env file.');
  }

  const primaryModel = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';
  // Build candidate chain ensuring primary model is first, followed by verified free fallbacks
  const candidateModels = Array.from(new Set([primaryModel, ...OPENROUTER_FREE_MODELS]));
  const timeoutMs = options.timeoutMs ?? 25000;

  const attemptedErrors: string[] = [];

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
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
          temperature: options.temperature ?? 0.5,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.ok) {
        const data = await res.json();
        const choice = data.choices?.[0];
        const content = choice?.message?.content || choice?.message?.reasoning;
        if (content && typeof content === 'string' && content.trim().length > 0) {
          if (i > 0) {
            console.log(`[OpenRouter] Successfully generated via fallback model: ${model}`);
          }
          return content;
        }
      } else {
        let errorDetail = '';
        try {
          const errJson = await res.json();
          errorDetail = errJson.error?.metadata?.raw || errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errorDetail = await res.text();
        }

        const msg = `[${model}] HTTP ${res.status}: ${errorDetail}`;
        console.warn(`[OpenRouter Cascade] ${msg}`);
        attemptedErrors.push(msg);

        // If not the last model, continue to next fallback
        continue;
      }
    } catch (err: any) {
      const msg = `[${model}] Network/Timeout: ${err.message}`;
      console.warn(`[OpenRouter Cascade] ${msg}`);
      attemptedErrors.push(msg);
      continue;
    }
  }

  throw new Error(`All ${candidateModels.length} OpenRouter free models failed:\n${attemptedErrors.join('\n')}`);
}

function extractJsonFromText(rawText: string): any {
  let cleaned = (rawText || '').trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 1. Try raw parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // 2. Perform resilience cleaning for LLM formatting anomalies:
    const sanitized = cleaned
      // Replace unicode double quotes
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
      // Replace unicode single quotes inside identifiers
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
      // Remove trailing commas before closing braces/brackets
      .replace(/,\s*([}\]])/g, '$1')
      // Normalize non-breaking hyphens/dashes
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-');

    try {
      return JSON.parse(sanitized);
    } catch (secondErr: any) {
      throw new Error(`Failed to parse AI JSON response: ${secondErr.message}. Excerpt: ${rawText.slice(0, 250)}`);
    }
  }
}

function normalizeExamQuestions(rawQuestions: any[]): Question[] {
  if (!Array.isArray(rawQuestions)) {
    if (typeof rawQuestions === 'object' && rawQuestions !== null) {
      rawQuestions = [rawQuestions];
    } else {
      return [];
    }
  }

  return rawQuestions.map((q: any, i: number) => {
    const rawOptions = q.options;
    let normalizedOptions: QuestionOption[] | undefined = undefined;

    if (Array.isArray(rawOptions) && rawOptions.length > 0) {
      normalizedOptions = rawOptions.map((opt: any, optIdx: number) => {
        if (typeof opt === 'string') {
          const match = opt.match(/^([A-Da-d0-9])[\.\)\:\-]\s*(.*)$/);
          if (match) {
            return {
              id: `opt_${match[1].toLowerCase()}`,
              text: match[2].trim() || opt,
            };
          }
          const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
          return {
            id: `opt_${letters[optIdx] || optIdx}`,
            text: opt,
          };
        }
        if (typeof opt === 'object' && opt !== null) {
          let id = String(opt.id || `opt_${optIdx}`);
          if (!id.startsWith('opt_')) {
            const letterMatch = id.match(/^[a-fA-F0-9]$/);
            id = letterMatch ? `opt_${id.toLowerCase()}` : `opt_${optIdx}`;
          }
          return {
            id,
            text: String(opt.text || opt.label || opt.value || ''),
          };
        }
        return { id: `opt_${optIdx}`, text: String(opt) };
      });
    } else if (typeof rawOptions === 'object' && rawOptions !== null) {
      normalizedOptions = Object.entries(rawOptions).map(([key, val]) => ({
        id: `opt_${key.toLowerCase()}`,
        text: String(val),
      }));
    }

    // Normalize correctAnswer
    let correctAnswer: any = q.correctAnswer ?? q.correct_answer ?? q.answer;
    if (typeof correctAnswer === 'string') {
      const trimmed = correctAnswer.trim();
      const letterMatch = trimmed.match(/^([a-dA-D])$/);
      if (letterMatch) {
        correctAnswer = `opt_${letterMatch[1].toLowerCase()}`;
      } else if (!trimmed.startsWith('opt_') && normalizedOptions && normalizedOptions.some(o => o.id === `opt_${trimmed.toLowerCase()}`)) {
        correctAnswer = `opt_${trimmed.toLowerCase()}`;
      }
    } else if (Array.isArray(correctAnswer)) {
      correctAnswer = correctAnswer.map((ans: any) => {
        const s = String(ans).trim();
        const letterMatch = s.match(/^([a-dA-D])$/);
        return letterMatch ? `opt_${letterMatch[1].toLowerCase()}` : s;
      });
    }

    return {
      id: q.id ? String(q.id) : `gen_q_${i + 1}`,
      type: (q.type as QuestionType) || (normalizedOptions && normalizedOptions.length > 0 ? 'mcq_single' : 'short_answer'),
      text: q.text || q.question || 'Scriptural Analysis Question',
      topic: q.topic || 'Biblical Studies',
      bloomLevel: q.bloomLevel || 'analysis',
      marks: Number(q.marks) || 5,
      options: normalizedOptions,
      correctAnswer: correctAnswer ?? (normalizedOptions ? normalizedOptions[0]?.id : 'See theological rubric'),
      explanation: q.explanation || 'Comprehensive scriptural exegesis and canonical alignment.',
      evaluationRubric: q.evaluationRubric,
    };
  });
}

export async function generateExamWithAI(params: GenerateExamParams): Promise<Exam> {
  const openRouterKey = params.apiKey?.startsWith('sk-or-') ? params.apiKey : process.env.OPENROUTER_API_KEY;
  const geminiKey = params.apiKey || process.env.GEMINI_API_KEY;

  // 1. Primary path: OpenRouter with multi-model free cascade
  if (openRouterKey) {
    const generated = await callOpenRouterExamGeneration(params, openRouterKey);
    if (generated && generated.questions?.length > 0) {
      return generated;
    }
    throw new Error('OpenRouter generated an exam with no valid questions.');
  }

  // 2. Direct Gemini API if specifically configured
  if (geminiKey && geminiKey !== openRouterKey) {
    const generated = await callGeminiExamGeneration(params, geminiKey);
    if (generated && generated.questions?.length > 0) {
      return generated;
    }
    throw new Error('Gemini API generated an exam with no valid questions.');
  }

  throw new Error('No AI API key found. Please configure OPENROUTER_API_KEY in .env.');
}

async function callOpenRouterExamGeneration(params: GenerateExamParams, apiKey: string): Promise<Exam> {
  const prompt = `You are an encouraging, friendly, and creative Sunday School Bible Teacher and Christian educator.
Create a fun, inspiring, and age-appropriate Sunday School Bible quiz/exam in JSON format on the topic: "${params.topic}".
Category: "Sunday School"
Target Level: ${params.difficulty === 'beginner' ? 'Primary (Kids ages 5-8)' : params.difficulty === 'intermediate' ? 'Juniors (Pre-teens ages 9-12)' : 'Youth (Teens)'}
Number of Questions: ${params.questionCount}
Allowed Question Types: ${params.questionTypes.join(', ')}
${params.contextMaterial ? `Bible Passage / Lesson Notes:\n"""${params.contextMaterial}"""\n` : ''}

SUNDAY SCHOOL GUIDELINES:
- This is for SUNDAY SCHOOL, NOT a theological seminary exam. Avoid dense theological jargon, academic debates, and original language exegesis (no Hebrew/Greek grammar disputes).
- Focus on key Bible stories, heroes and heroines of faith (e.g. David, Noah, Moses, Daniel, Esther, Jesus, Peter, Paul), the parables and miracles of Jesus, practical kindness, loving God and our neighbors, and memorable Scripture lessons.
- Ensure language is warm, clear, age-appropriate, and encouraging for young learners and church students.
- In explanations, share simple, memorable biblical insights with friendly Bible references (e.g. 1 Samuel 17:45, Luke 15:11-32, John 3:16).

CRITICAL: Return ONLY valid, raw JSON (no markdown formatting, no \`\`\`json code blocks).
The JSON must adhere strictly to this schema:
{
  "title": "Inspiring Sunday School Quiz Title",
  "description": "Warm, encouraging description of the Bible story and learning lesson",
  "category": "Sunday School",
  "difficulty": "${params.difficulty}",
  "durationMinutes": ${params.durationMinutes},
  "passingScore": 60,
  "instructions": [
    "Welcome to our Sunday School Bible Quiz!",
    "Read each question carefully and think about what happened in the Bible story.",
    "Do your best and remember: learning God's Word is a blessing!"
  ],
  "questions": [
    {
      "id": "q1",
      "type": "mcq_single" | "mcq_multiple" | "true_false" | "short_answer",
      "text": "Clear, engaging question prompt about the Bible story",
      "topic": "Bible Story / Topic",
      "bloomLevel": "knowledge" | "comprehension" | "application",
      "marks": 5,
      "options": [
        { "id": "opt_a", "text": "Option A text" },
        { "id": "opt_b", "text": "Option B text" },
        { "id": "opt_c", "text": "Option C text" },
        { "id": "opt_d", "text": "Option D text" }
      ],
      "correctAnswer": "opt_b",
      "explanation": "Friendly, encouraging explanation connecting the story and Bible verse",
      "evaluationRubric": "Simple rubric criteria for short answer evaluation"
    }
  ]
}`;

  const rawText = await callOpenRouter([
    {
      role: 'system',
      content: 'You are a friendly, encouraging Sunday School Bible Teacher. Always output valid JSON strictly adhering to the requested schema without conversational filler.',
    },
    { role: 'user', content: prompt },
  ], { apiKey, temperature: 0.5, timeoutMs: 25000 });

  const parsed = extractJsonFromText(rawText);
  const rawQuestionsList = parsed.questions || (parsed.question ? [parsed] : []);
  const normalizedQuestions = normalizeExamQuestions(rawQuestionsList);
  const totalMarks = normalizedQuestions.reduce((acc: number, q: Question) => acc + (q.marks || 5), 0);

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
    questions: normalizedQuestions,
  };
}

async function callGeminiExamGeneration(params: GenerateExamParams, apiKey: string): Promise<Exam> {
  const prompt = `You are an encouraging, friendly, and creative Sunday School Bible Teacher and Christian educator.
Create a fun, inspiring, and age-appropriate Sunday School Bible quiz/exam in JSON format on the topic: "${params.topic}".
Category: "Sunday School"
Target Level: ${params.difficulty === 'beginner' ? 'Primary (Kids ages 5-8)' : params.difficulty === 'intermediate' ? 'Juniors (Pre-teens ages 9-12)' : 'Youth (Teens)'}
Number of Questions: ${params.questionCount}
Allowed Question Types: ${params.questionTypes.join(', ')}
${params.contextMaterial ? `Bible Passage / Lesson Notes:\n"""${params.contextMaterial}"""\n` : ''}

SUNDAY SCHOOL GUIDELINES:
- This is for SUNDAY SCHOOL, NOT a theological seminary exam. Avoid dense theological jargon, academic debates, and original language exegesis.
- Focus on key Bible stories, heroes and heroines of faith, the parables and miracles of Jesus, practical kindness, and memorable Scripture lessons.
- Ensure language is warm, clear, age-appropriate, and encouraging for young learners and church students.
- In explanations, share simple, memorable biblical insights with friendly Bible references.

CRITICAL: Return ONLY valid, raw JSON (no markdown formatting, no \`\`\`json code blocks).
The JSON must adhere strictly to this schema:
{
  "title": "Inspiring Sunday School Quiz Title",
  "description": "Warm, encouraging description of the Bible story and learning lesson",
  "category": "Sunday School",
  "difficulty": "${params.difficulty}",
  "durationMinutes": ${params.durationMinutes},
  "passingScore": 60,
  "instructions": [
    "Welcome to our Sunday School Bible Quiz!",
    "Read each question carefully and think about what happened in the Bible story.",
    "Do your best and remember: learning God's Word is a blessing!"
  ],
  "questions": [
    {
      "id": "q1",
      "type": "mcq_single" | "mcq_multiple" | "true_false" | "short_answer",
      "text": "Clear, engaging question prompt about the Bible story",
      "topic": "Bible Story / Topic",
      "bloomLevel": "knowledge" | "comprehension" | "application",
      "marks": 5,
      "options": [
        { "id": "opt_a", "text": "Option A text" },
        { "id": "opt_b", "text": "Option B text" },
        { "id": "opt_c", "text": "Option C text" },
        { "id": "opt_d", "text": "Option D text" }
      ],
      "correctAnswer": "opt_b",
      "explanation": "Friendly, encouraging explanation connecting the story and Bible verse",
      "evaluationRubric": "Simple rubric criteria for short answer evaluation"
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
  const rawQuestionsList = parsed.questions || (parsed.question ? [parsed] : []);
  const normalizedQuestions = normalizeExamQuestions(rawQuestionsList);
  const totalMarks = normalizedQuestions.reduce((acc: number, q: Question) => acc + (q.marks || 5), 0);

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
    questions: normalizedQuestions,
  };
}

export async function evaluateShortAnswerWithAI(
  question: Question,
  userAnswer: string,
  apiKey?: string
): Promise<AIEvaluation> {
  const openRouterKey = apiKey?.startsWith('sk-or-') ? apiKey : process.env.OPENROUTER_API_KEY;
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;

  const trimmedAnswer = (userAnswer || '').trim();
  const maxScore = question.marks || 10;

  // If answer is empty or whitespace, award 0 marks without invoking LLM
  if (!trimmedAnswer) {
    return {
      score: 0,
      maxScore,
      accuracy: 'none',
      strengths: [],
      improvements: ['No answer was provided by the candidate.'],
      reasoning: 'The response was empty.',
    };
  }

  const prompt = `You are a kind, encouraging Sunday School Bible teacher evaluating a student's answer to a Bible quiz question.
Question: "${question.text}"
Total Available Marks: ${maxScore}
Model Answer: "${question.correctAnswer}"
Evaluation Rubric: "${question.evaluationRubric || 'Assess whether the student understood the Bible story, key character, or practical moral/faith lesson.'}"

Student's Answer: "${trimmedAnswer}"

Grade the student's response with warmth, fairness, and encouragement. Celebrate what they remembered or applied from the Bible story.
Return ONLY valid JSON matching this structure (no markdown fences, no conversational filler):
{
  "score": number (between 0 and ${maxScore}),
  "maxScore": ${maxScore},
  "accuracy": "high" | "moderate" | "low" | "none",
  "strengths": ["encouraging praise for what the student remembered or explained"],
  "improvements": ["gentle reminder of any story detail or verse that was missed"],
  "reasoning": "Encouraging explanation of the grade and biblical lesson"
}`;

  // 1. OpenRouter cascade
  if (openRouterKey) {
    const rawText = await callOpenRouter([
      { role: 'system', content: 'You are an objective academic evaluator. Return raw JSON only.' },
      { role: 'user', content: prompt },
    ], { apiKey: openRouterKey, temperature: 0.2, timeoutMs: 35000 });

    const parsed = extractJsonFromText(rawText);
    return {
      score: Math.min(maxScore, Math.max(0, Number(parsed.score) || 0)),
      maxScore,
      accuracy: parsed.accuracy || 'moderate',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Addressed the biblical theme directly.'],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      reasoning: parsed.reasoning || 'Evaluated based on theological precision and rubric alignment via AI.',
    };
  }

  // 2. Direct Gemini API if configured
  if (geminiKey && geminiKey !== openRouterKey) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Gemini API error status ${res.status}: ${errorBody}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('No content returned from Gemini evaluation');

    const parsed = extractJsonFromText(rawText);
    return {
      score: Math.min(maxScore, Math.max(0, Number(parsed.score) || 0)),
      maxScore,
      accuracy: parsed.accuracy || 'moderate',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Good attempt at addressing the core prompt.'],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      reasoning: parsed.reasoning || 'Evaluated based on technical accuracy and rubric alignment.',
    };
  }

  throw new Error('No AI API key found for evaluation. Please configure OPENROUTER_API_KEY in .env');
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

  const prompt = `You are Teacher Grace, a loving, patient, and joyful Sunday School Bible teacher.
A Sunday School student is reviewing this Bible quiz question and asking you for guidance:

Question: "${question.text}"
${question.options ? `Options:\n${question.options.map((o) => `${o.id}: ${o.text}`).join('\n')}\n` : ''}
Correct Answer: ${Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
Bible Story Explanation: ${question.explanation}
Student's Chosen Answer: ${userAnswer ? (Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer) : 'None'}

Student's inquiry: "${userQuestion}"

Provide a warm, inspiring, and easy-to-understand Sunday School explanation suitable for students and church learners.
Use simple, clear language, tell the Bible story vividly, cite memorable Bible verses (e.g. John 3:16, Psalm 23, Proverbs 3:5-6), share a friendly everyday life lesson, and encourage the student in their faith!
DO NOT use seminary jargon, academic exegesis, or complex linguistic terms.`;

  // 1. OpenRouter cascade
  if (openRouterKey) {
    const text = await callOpenRouter([
      { role: 'system', content: 'You are Teacher Grace, a warm and encouraging Sunday School Bible teacher.' },
      { role: 'user', content: prompt },
    ], { apiKey: openRouterKey, temperature: 0.6, timeoutMs: 30000 });

    if (text) return text;
    throw new Error('AI Tutor returned an empty response.');
  }

  // 2. Direct Gemini API if configured
  if (geminiKey && geminiKey !== openRouterKey) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6 },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Gemini API error status ${res.status}: ${errorBody}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
    throw new Error('AI Tutor returned an empty response.');
  }

  throw new Error('No AI API key found for AI Tutor. Please configure OPENROUTER_API_KEY in .env');
}
