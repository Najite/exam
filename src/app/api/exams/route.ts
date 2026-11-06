import { NextResponse } from 'next/server';
import { getExams, saveExam } from '@/lib/db';
import { Exam } from '@/types';

export async function GET() {
  try {
    const exams = getExams();
    return NextResponse.json({ success: true, exams });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title || !body.questions || body.questions.length === 0) {
      return NextResponse.json({ success: false, error: 'Exam title and at least one question are required' }, { status: 400 });
    }

    const newExam: Exam = {
      id: body.id || `exam-${Date.now()}`,
      title: body.title,
      description: body.description || '',
      category: body.category || 'General',
      difficulty: body.difficulty || 'intermediate',
      durationMinutes: Number(body.durationMinutes) || 15,
      passingScore: Number(body.passingScore) || 70,
      totalMarks: body.questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 5), 0),
      isPublished: true,
      createdAt: new Date().toISOString(),
      proctoringSettings: {
        enableWebcam: body.proctoringSettings?.enableWebcam ?? true,
        enableMic: body.proctoringSettings?.enableMic ?? true,
        enableFullscreen: body.proctoringSettings?.enableFullscreen ?? true,
        maxTabSwitches: body.proctoringSettings?.maxTabSwitches ?? 3,
        aiFaceDetection: body.proctoringSettings?.aiFaceDetection ?? true,
        blockCopyPaste: body.proctoringSettings?.blockCopyPaste ?? true,
      },
      instructions: body.instructions || ['Answer all questions.', 'AI Proctoring is active.'],
      questions: body.questions,
    };

    saveExam(newExam);
    return NextResponse.json({ success: true, exam: newExam });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
