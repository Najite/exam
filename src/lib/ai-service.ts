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

export async function generateExamWithAI(params: GenerateExamParams): Promise<Exam> {
  const apiKey = params.apiKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const generated = await callGeminiExamGeneration(params, apiKey);
      if (generated && generated.questions?.length > 0) {
        return generated;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to built-in AI synthesizer:', err);
    }
  }

  // Fallback to high-fidelity built-in smart AI generator
  return generateSmartLocalExam(params);
}

async function callGeminiExamGeneration(params: GenerateExamParams, apiKey: string): Promise<Exam> {
  const prompt = `You are an expert psychometrician and test design authority.
Create a rigorous, high-stakes Computer-Based Test (CBT) examination in JSON format on the topic: "${params.topic}".
Category: ${params.category || 'General Assessment'}
Target Difficulty: ${params.difficulty}
Number of Questions: ${params.questionCount}
Allowed Question Types: ${params.questionTypes.join(', ')}
${params.contextMaterial ? `Source Reference Material:\n"""${params.contextMaterial}"""\n` : ''}

CRITICAL: Return ONLY valid, raw JSON (no markdown formatting, no \`\`\`json code blocks).
The JSON must adhere strictly to this schema:
{
  "title": "Clear exam title",
  "description": "Comprehensive description of scope and learning objectives",
  "category": "${params.category || 'Technology'}",
  "difficulty": "${params.difficulty}",
  "durationMinutes": ${params.durationMinutes},
  "passingScore": 70,
  "instructions": [
    "Read all instructions carefully before starting.",
    "Calculators and formula sheet are available in the toolbar.",
    "Full screen lock is enforced."
  ],
  "questions": [
    {
      "id": "q1",
      "type": "mcq_single" | "mcq_multiple" | "true_false" | "short_answer" | "code",
      "text": "Detailed question prompt",
      "codeSnippet": "Optional code block or null",
      "topic": "Specific subtopic name",
      "bloomLevel": "knowledge" | "comprehension" | "application" | "analysis" | "evaluation",
      "marks": 5,
      "options": [
        { "id": "opt_a", "text": "Option A text" },
        { "id": "opt_b", "text": "Option B text" },
        { "id": "opt_c", "text": "Option C text" },
        { "id": "opt_d", "text": "Option D text" }
      ],
      "correctAnswer": "opt_b", // or array ["opt_a", "opt_c"] for mcq_multiple, or string text for short_answer
      "explanation": "Thorough justification of why the answer is correct and why distractors are incorrect",
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
    cybersecurity: {
      title: 'Advanced Cybersecurity & Threat Modeling',
      subtopics: ['Network Security', 'Cryptography', 'Zero Trust Architecture', 'Incident Response'],
      sampleQuestions: [
        {
          type: 'mcq_single',
          text: 'Which cryptographic principle guarantees that sender and recipient derive a shared secret over an insecure channel without transmitting the secret itself?',
          options: [
            { id: 'opt_a', text: 'RSA asymmetric signature' },
            { id: 'opt_b', text: 'Diffie-Hellman Key Exchange' },
            { id: 'opt_c', text: 'AES-GCM Authenticated Encryption' },
            { id: 'opt_d', text: 'SHA-256 HMAC digest' },
          ],
          correctAnswer: 'opt_b',
          explanation: 'Diffie-Hellman key exchange enables two parties to negotiate a shared cryptographic secret over an untrusted channel using modular exponentiation or elliptic curves without exposing the key.',
          topic: 'Cryptography',
          bloomLevel: 'comprehension',
          marks: 5,
        },
        {
          type: 'short_answer',
          text: 'Explain the three core tenets of Zero Trust Architecture ("Never Trust, Always Verify") and how micro-segmentation reinforces them.',
          correctAnswer: 'Zero Trust assumes breach and treats all network traffic as untrusted. Its core principles are: 1) Verify explicitly (continuous authentication and authorization), 2) Least privilege access (Just-In-Time and Just-Enough-Access), and 3) Assume breach (encrypt all data, minimize blast radius). Micro-segmentation reinforces this by creating granular network perimeters around individual workloads, preventing lateral movement by attackers.',
          evaluationRubric: 'Candidate must explain: 1) Verify explicitly, 2) Least privilege, 3) Assume breach, and 4) How microsegmentation isolates workloads to stop lateral movement.',
          explanation: 'Zero trust shifts perimeter security to identity and granular data-plane enforcement, where micro-segmentation isolates east-west lateral traffic.',
          topic: 'Zero Trust Architecture',
          bloomLevel: 'analysis',
          marks: 10,
        },
        {
          type: 'mcq_multiple',
          text: 'Which of the following headers defend modern web applications against Cross-Site Scripting (XSS) and Clickjacking? (Select all that apply)',
          options: [
            { id: 'opt_a', text: 'Content-Security-Policy (CSP)' },
            { id: 'opt_b', text: 'X-Frame-Options' },
            { id: 'opt_c', text: 'Access-Control-Allow-Origin: *' },
            { id: 'opt_d', text: 'Strict-Transport-Security (HSTS)' },
          ],
          correctAnswer: ['opt_a', 'opt_b'],
          explanation: 'CSP prevents unauthorized script execution mitigating XSS; X-Frame-Options forbids unauthorized iframe embedding, preventing Clickjacking. HSTS enforces HTTPS, and wildcard CORS allows cross-origin reads without protecting against XSS.',
          topic: 'Network Security',
          bloomLevel: 'application',
          marks: 5,
        },
      ],
    },
    data_science: {
      title: 'Applied Data Science & Statistical Inference',
      subtopics: ['Hypothesis Testing', 'Regression & Classification', 'Feature Engineering', 'Model Evaluation'],
      sampleQuestions: [
        {
          type: 'mcq_single',
          text: 'In statistical hypothesis testing, committing a Type I error corresponds to which condition?',
          options: [
            { id: 'opt_a', text: 'Failing to reject a false null hypothesis (False Negative)' },
            { id: 'opt_b', text: 'Rejecting a true null hypothesis (False Positive)' },
            { id: 'opt_c', text: 'Incorrect sample size calculation leading to low statistical power' },
            { id: 'opt_d', text: 'Confounding dependent variables with collinear predictors' },
          ],
          correctAnswer: 'opt_b',
          explanation: 'A Type I error (α) occurs when the null hypothesis is true, but is incorrectly rejected (a false positive finding).',
          topic: 'Hypothesis Testing',
          bloomLevel: 'knowledge',
          marks: 5,
        },
        {
          type: 'short_answer',
          text: 'Define the bias-variance tradeoff in machine learning, and describe how increasing model complexity affects both components.',
          correctAnswer: 'The bias-variance tradeoff describes the tension between two sources of error: Bias (error from erroneous assumptions / underfitting) and Variance (error from sensitivity to small fluctuations in training data / overfitting). As model complexity increases, training bias decreases because the model fits intricate patterns, but variance increases because it begins memorizing noise, resulting in poor generalizability.',
          evaluationRubric: 'Must state: 1) Bias error / underfitting, 2) Variance error / overfitting, 3) Higher complexity lowers bias but raises variance.',
          explanation: 'Total generalization error = Bias² + Variance + Irreducible Error. Optimal model complexity minimizes this sum at the sweet spot between underfitting and overfitting.',
          topic: 'Model Evaluation',
          bloomLevel: 'comprehension',
          marks: 10,
        },
      ],
    },
  };

  const normalizedTopic = params.topic.toLowerCase().replace(/[^a-z0-9]/g, '');
  let matched = Object.entries(topicsMap).find(([k]) => normalizedTopic.includes(k) || k.includes(normalizedTopic))?.[1];

  const questions: Question[] = [];
  const count = Math.max(3, params.questionCount || 5);

  if (matched) {
    questions.push(...(matched.sampleQuestions as Question[]));
  }

  // Generate dynamic questions to reach target count
  while (questions.length < count) {
    const idx = questions.length + 1;
    const qType: QuestionType = params.questionTypes[idx % params.questionTypes.length] || 'mcq_single';
    const subtopic = `${params.topic} Core Principles Part ${idx}`;

    if (qType === 'true_false') {
      questions.push({
        id: `gen_q_${idx}`,
        type: 'true_false',
        text: `In ${params.topic}, is it considered best practice to decouple monolithic dependencies into modular components to optimize testability and scalability?`,
        options: [
          { id: 'opt_true', text: 'True' },
          { id: 'opt_false', text: 'False' },
        ],
        correctAnswer: 'opt_true',
        explanation: 'Modularity and high cohesion with low coupling allow independent testing, maintainability, and horizontal scaling.',
        topic: subtopic,
        bloomLevel: 'application',
        marks: 5,
      });
    } else if (qType === 'short_answer') {
      questions.push({
        id: `gen_q_${idx}`,
        type: 'short_answer',
        text: `Synthesize the primary operational challenges encountered when implementing ${params.topic} in production environments, and provide two mitigation strategies.`,
        correctAnswer: `Common operational challenges in ${params.topic} include observability gaps, scalability bottlenecks, and data drift or concurrency conflicts. Standard mitigations involve implementing end-to-end telemetry (metrics, logs, traces), automated automated regression testing, and resilient fallback mechanisms with circuit breakers.`,
        evaluationRubric: `Candidate must identify at least 2 distinct operational challenges (e.g., latency, state consistency, monitoring, security) and provide realistic, concrete mitigations.`,
        explanation: `Production resilience requires continuous monitoring, automated health probes, and graceful degradation paths when anomalies occur.`,
        topic: subtopic,
        bloomLevel: 'analysis',
        marks: 10,
      });
    } else {
      questions.push({
        id: `gen_q_${idx}`,
        type: 'mcq_single',
        text: `Which architectural pattern is most effective for ensuring high reliability and fault isolation in modern ${params.topic} systems?`,
        options: [
          { id: 'opt_a', text: 'Monolithic single-process execution with synchronous cascading calls' },
          { id: 'opt_b', text: 'Event-driven asynchronous messaging with circuit breakers and dead-letter queues' },
          { id: 'opt_c', text: 'Shared database state with unconstrained cross-table transactions' },
          { id: 'opt_d', text: 'Client-side orchestration with hardcoded endpoint IPs' },
        ],
        correctAnswer: 'opt_b',
        explanation: 'Event-driven architectures decouple producers from consumers, while circuit breakers isolate failures and prevent cascading system outages.',
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
    category: params.category || 'Technology',
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
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (key && userAnswer.trim().length > 5) {
    try {
      const prompt = `You are a fair, objective exam evaluator grading a student's answer to a CBT question.
Question: "${question.text}"
Total Available Marks: ${question.marks}
Model Answer: "${question.correctAnswer}"
Evaluation Rubric: "${question.evaluationRubric || 'Assess factual correctness, technical precision, and completeness.'}"

Student's Answer: "${userAnswer}"

Grade the student response strictly based on the rubric.
Return ONLY valid JSON matching this structure (no markdown fences):
{
  "score": number (between 0 and ${question.marks}),
  "maxScore": ${question.marks},
  "accuracy": "high" | "moderate" | "low" | "none",
  "strengths": ["bullet 1", "bullet 2"],
  "improvements": ["what was missing or needs refinement"],
  "reasoning": "Clear explanation of how the score was calculated based on the rubric"
}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
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
          const parsed = JSON.parse(rawText.trim().replace(/^```json/i, '').replace(/```$/i, '').trim());
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

  // Heuristic semantic grader
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
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (key) {
    try {
      const prompt = `You are a patient, encouraging, and brilliant AI Socratic tutor on a computer-based exam platform.
The student took an exam and is reviewing this question:

Question: "${question.text}"
${question.codeSnippet ? `Code Snippet:\n${question.codeSnippet}\n` : ''}
${question.options ? `Options:\n${question.options.map((o) => `${o.id}: ${o.text}`).join('\n')}\n` : ''}
Correct Answer: ${Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
Official Explanation: ${question.explanation}
Student's Chosen Answer: ${userAnswer ? (Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer) : 'None'}

Student's inquiry to you: "${userQuestion}"

Explain clearly, step-by-step, using intuitive examples. If they made a mistake, gently explain why the distractor was tempting and why the correct concept applies.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
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

  // Fallback intelligent tutor response
  return `### AI Tutor Explanation\n\n**Key Concept:** ${question.topic}\n\n${question.explanation}\n\n**Why the correct answer holds:** In ${question.topic}, the fundamental principle requires strict adherence to ${Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}. When analyzing this problem, notice that distractors often invert the causality or overlook edge cases.\n\n*Pro-tip:* When encountering similar problems, identify the core invariant or definition first before evaluating the choices!`;
}
