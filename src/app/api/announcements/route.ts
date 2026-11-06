import { NextResponse } from 'next/server';

interface Announcement {
  id: string;
  sender: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  timestamp: string;
  targetExamId?: string; // all exams if undefined
}

// In-memory / file backed announcements storage
let activeAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    sender: 'Chief Invigilator',
    message: 'Welcome to the AI-Proctored Exam session. Ensure your camera remains unobstructed.',
    type: 'info',
    timestamp: new Date().toISOString(),
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId');

  const relevant = activeAnnouncements.filter(
    (a) => !a.targetExamId || a.targetExamId === examId
  );

  return NextResponse.json({ success: true, announcements: relevant });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, sender = 'Chief Proctor', type = 'info', targetExamId } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      sender,
      message: message.trim(),
      type,
      timestamp: new Date().toISOString(),
      targetExamId,
    };

    activeAnnouncements.unshift(newAnnouncement);
    // Keep max 10
    if (activeAnnouncements.length > 10) {
      activeAnnouncements = activeAnnouncements.slice(0, 10);
    }

    return NextResponse.json({ success: true, announcement: newAnnouncement });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
