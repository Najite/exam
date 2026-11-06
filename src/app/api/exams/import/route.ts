import { NextResponse } from 'next/server';
import { saveExam } from '@/lib/db';
import { Exam } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const examData = body.exam || body;

    if (!examData.title || !Array.isArray(examData.questions) || examData.questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid exam format. Expected title and questions array.',
      }, { status: 400 });
    }

    const importedExam: Exam = {
      id: `exam-imported-${Date.now()}`,
      title: examData.title,
      description: examData.description || 'Imported assessment module',
      category: examData.category || 'General',
      difficulty: examData.difficulty || 'intermediate',
      durationMinutes: Number(examData.durationMinutes) || 15,
      passingScore: Number(examData.passingScore) || 70,
      totalMarks: examData.questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 5), 0),
      isPublished: true,
      createdAt: new Date().toISOString(),
      proctoringSettings: {
        enableWebcam: examData.proctoringSettings?.enableWebcam ?? true,
        enableMic: examData.proctoringSettings?.enableMic ?? true,
        enableFullscreen: examData.proctoringSettings?.enableFullscreen ?? true,
        maxTabSwitches: examData.proctoringSettings?.maxTabSwitches ?? 3,
        aiFaceDetection: examData.proctoringSettings?.aiFaceDetection ?? true,
        blockCopyPaste: examData.proctoringSettings?.blockCopyPaste ?? true,
      },
      instructions: Array.isArray(examData.instructions)
        ? examData.instructions
        : ['Answer all questions.', 'Proctoring enabled.'],
      questions: examData.questions.map((q: any, idx: number) => ({
        id: q.id || `imp_q_${idx + 1}`,
        type: q.type || 'mcq_single',
        text: q.text || 'Question text',
        codeSnippet: q.codeSnippet,
        options: q.options,
        correctAnswer: q.correctAnswer || (q.options?.[0]?.id ?? 'opt_a'),
        explanation: q.explanation || 'No explanation provided.',
        marks: Number(q.marks) || 5,
        topic: q.topic || 'General Topic',
        bloomLevel: q.bloomLevel || 'application',
        evaluationRubric: q.evaluationRubric,
      })),
    };

    saveExam(importedExam);
    return NextResponse.json({ success: true, exam: importedExam });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

