import { NextResponse } from 'next/server';
import { askAITutor } from '@/lib/ai-service';
import { Question } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, userQuestion, userAnswer, apiKey } = body;

    if (!question || !userQuestion) {
      return NextResponse.json({ success: false, error: 'Question and user inquiry are required' }, { status: 400 });
    }

    const answer = await askAITutor(question as Question, userQuestion, userAnswer, apiKey);
    return NextResponse.json({ success: true, answer });
  } catch (err: any) {
    console.error('Error in AI Tutor:', err);
    return NextResponse.json({ success: false, error: err.message || 'AI Tutor query failed' }, { status: 500 });
  }
}

