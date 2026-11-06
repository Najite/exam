import { NextResponse } from 'next/server';
import { getExamById, deleteExam, saveExam } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exam = getExamById(id);
    if (!exam) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, exam });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = getExamById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }

    const updated = {
      ...existing,
      ...body,
      id,
    };
    saveExam(updated);
    return NextResponse.json({ success: true, exam: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteExam(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Exam deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
