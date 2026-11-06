import { NextResponse } from 'next/server';
import { generateExamWithAI } from '@/lib/ai-service';
import { saveExam } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, category, difficulty, questionCount, durationMinutes, questionTypes, contextMaterial, apiKey, autoSave } = body;

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Topic is required for AI exam generation' }, { status: 400 });
    }

    const exam = await generateExamWithAI({
      topic: topic.trim(),
      category: category || 'Teen Bible Challenge',
      difficulty: difficulty || 'beginner',
      questionCount: Number(questionCount) || 5,
      durationMinutes: Number(durationMinutes) || 15,
      questionTypes: Array.isArray(questionTypes) && questionTypes.length > 0 ? questionTypes : ['mcq_single', 'short_answer'],
      contextMaterial,
      apiKey,
    });

    if (autoSave !== false) {
      saveExam(exam);
    }

    return NextResponse.json({ success: true, exam });
  } catch (err: any) {
    console.error('Error generating exam with AI:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to generate exam' }, { status: 500 });
  }
}

