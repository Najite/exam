import { Exam, Question, DifficultyLevel, QuestionType, AIEvaluation, AIAnalytics, TopicBreakdown } from '@/types';

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

// OpenRouter LLM Gateway - Strictly uses google/gemma-4-31b-it:free (or process.env.OPENROUTER_MODEL)
// No candidate fallbacks, no local mock failover.
async function callOpenRouter(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options: { apiKey?: string; jsonMode?: boolean; temperature?: number; timeoutMs?: number } = {}
): Promise<string> {
  const key = options.apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('No OpenRouter API key found. Please set OPENROUTER_API_KEY in your .env file.');
  }

  const model = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';
  const timeoutMs = options.timeoutMs ?? 60000;

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

    if (!res.ok) {
      let errorDetail = '';
      try {
        const errJson = await res.json();
        errorDetail = errJson.error?.metadata?.raw || errJson.error?.message || JSON.stringify(errJson);
      } catch {
        errorDetail = await res.text();
      }
      throw new Error(`OpenRouter Error [${res.status}] (${model}): ${errorDetail}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`OpenRouter (${model}) returned an empty completion response.`);
    }
    return content;
  } catch (err: any) {
    console.error(`OpenRouter call error on model ${model}:`, err);
    throw err;
  }
}

function extractJsonFromText(rawText: string): any {
  let cleaned = (rawText || '').trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    throw new Error(`Failed to parse AI JSON response: ${err.message}. Excerpt: ${rawText.slice(0, 250)}`);
  }
}

export async function generateExamWithAI(params: GenerateExamParams): Promise<Exam> {
  const openRouterKey = params.apiKey?.startsWith('sk-or-') ? params.apiKey : process.env.OPENROUTER_API_KEY;
  const geminiKey = params.apiKey || process.env.GEMINI_API_KEY;

  // 1. Primary path: OpenRouter with google/gemma-4-31b-it:free
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

  throw new Error('No AI API key found. Please configure OPENROUTER_API_KEY in .env to generate exams with google/gemma-4-31b-it:free.');
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
    "Biblical reference sheet and concordance are accessible from the top toolbar.",
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
  ], { apiKey, temperature: 0.5, timeoutMs: 75000 });

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
    "Biblical reference sheet and concordance are accessible from the top toolbar.",
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

  const prompt = `You are a fair, objective exam evaluator grading a student's answer to a CBT question.
Question: "${question.text}"
Total Available Marks: ${maxScore}
Model Answer: "${question.correctAnswer}"
Evaluation Rubric: "${question.evaluationRubric || 'Assess factual correctness, scriptural precision, and completeness.'}"

Student's Answer: "${trimmedAnswer}"

Grade the student response strictly based on the rubric.
Return ONLY valid JSON matching this structure (no markdown fences, no conversational filler):
{
  "score": number (between 0 and ${maxScore}),
  "maxScore": ${maxScore},
  "accuracy": "high" | "moderate" | "low" | "none",
  "strengths": ["bullet 1", "bullet 2"],
  "improvements": ["what was missing or needs refinement"],
  "reasoning": "Clear explanation of how the score was calculated based on the rubric"
}`;

  // 1. OpenRouter (google/gemma-4-31b-it:free)
  if (openRouterKey) {
    const rawText = await callOpenRouter([
      { role: 'system', content: 'You are an objective academic evaluator. Return raw JSON only.' },
      { role: 'user', content: prompt },
    ], { apiKey: openRouterKey, temperature: 0.2, timeoutMs: 45000 });

    const parsed = extractJsonFromText(rawText);
    return {
      score: Math.min(maxScore, Math.max(0, Number(parsed.score) || 0)),
      maxScore,
      accuracy: parsed.accuracy || 'moderate',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Addressed the biblical theme directly.'],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      reasoning: parsed.reasoning || 'Evaluated based on theological precision and rubric alignment via Gemma AI.',
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

  const prompt = `You are a patient, encouraging, and scholarly AI Biblical Socratic tutor on a computer-based theological testing platform.
The student took an exam and is reviewing this biblical question:

Question: "${question.text}"
${question.options ? `Options:\n${question.options.map((o) => `${o.id}: ${o.text}`).join('\n')}\n` : ''}
Correct Answer: ${Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
Official Theological Explanation: ${question.explanation}
Student's Chosen Answer: ${userAnswer ? (Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer) : 'None'}

Student's inquiry to you: "${userQuestion}"

Provide a rich, pastoral, and academically rigorous explanation. Cite relevant scripture verses (book, chapter, verse), original language roots (Hebrew/Greek) if helpful, and gently explain why distractors fall short while upholding orthodox biblical interpretation.`;

  // 1. OpenRouter (google/gemma-4-31b-it:free)
  if (openRouterKey) {
    const text = await callOpenRouter([
      { role: 'system', content: 'You are an encouraging, scholarly Biblical Socratic tutor.' },
      { role: 'user', content: prompt },
    ], { apiKey: openRouterKey, temperature: 0.6, timeoutMs: 60000 });

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
