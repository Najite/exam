import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Exam, Submission } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

/**
 * Returns true if Supabase URL and at least one valid key are configured.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('http') &&
    (supabaseAnonKey || supabaseServiceKey)
  );
}

/**
 * Client-safe Supabase instance (browser & server-side public queries).
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

/**
 * Server-only Supabase client with elevated privileges (service role if available).
 */
export function getSupabaseServerClient(): SupabaseClient {
  const key = supabaseServiceKey || supabaseAnonKey;
  if (!supabaseUrl || !key) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// DATA MAPPERS (PostgreSQL snake_case <-> Application camelCase)
// ============================================================================

export function mapDbExamToExam(row: any): Exam {
  return {
    id: String(row.id),
    title: row.title || 'Untitled Challenge',
    description: row.description || '',
    category: row.category || 'Teen Bible Challenge',
    difficulty: row.difficulty || 'intermediate',
    durationMinutes: Number(row.duration_minutes) || 15,
    passingScore: Number(row.passing_score) || 60,
    totalMarks: Number(row.total_marks) || 0,
    isPublished: row.is_published ?? true,
    createdAt: row.created_at || new Date().toISOString(),
    proctoringSettings: row.proctoring_settings || {
      enableWebcam: true,
      enableMic: true,
      enableFullscreen: true,
      maxTabSwitches: 3,
      aiFaceDetection: true,
      blockCopyPaste: true,
    },
    instructions: Array.isArray(row.instructions) ? row.instructions : [],
    questions: Array.isArray(row.questions) ? row.questions : [],
  };
}

export function mapExamToDbExam(exam: Exam) {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    category: exam.category,
    difficulty: exam.difficulty,
    duration_minutes: exam.durationMinutes,
    passing_score: exam.passingScore,
    total_marks: exam.totalMarks,
    is_published: exam.isPublished,
    created_at: exam.createdAt,
    proctoring_settings: exam.proctoringSettings,
    instructions: exam.instructions,
    questions: exam.questions,
  };
}

export function mapDbSubmissionToSubmission(row: any): Submission {
  return {
    id: String(row.id),
    examId: String(row.exam_id),
    examTitle: row.exam_title || '',
    candidateName: row.candidate_name || 'Anonymous Teen',
    candidateEmail: row.candidate_email || '',
    candidatePhoto: row.candidate_photo || undefined,
    startedAt: row.started_at || row.created_at || new Date().toISOString(),
    submittedAt: row.submitted_at || row.created_at || new Date().toISOString(),
    timeSpentSeconds: Number(row.time_spent_seconds) || 0,
    answers: row.answers || {},
    score: Number(row.score) || 0,
    totalPossibleScore: Number(row.total_possible_score) || 0,
    percentage: Number(row.percentage) || 0,
    passed: Boolean(row.passed),
    questionResults: Array.isArray(row.question_results) ? row.question_results : [],
    proctorLogs: Array.isArray(row.proctor_logs) ? row.proctor_logs : [],
    integrityScore: Number(row.integrity_score) ?? 100,
    integrityVerdict: row.integrity_verdict || 'clean',
    aiAnalytics: row.ai_analytics || {
      topicBreakdown: [],
      strengths: ['Completed the challenge.'],
      weaknesses: [],
      recommendations: [],
      summary: 'Assessment completed.',
      estimatedPercentile: 50,
    },
  };
}

export function mapSubmissionToDbSubmission(sub: Submission) {
  return {
    id: sub.id,
    exam_id: sub.examId,
    exam_title: sub.examTitle,
    candidate_name: sub.candidateName,
    candidate_email: sub.candidateEmail,
    candidate_photo: sub.candidatePhoto || null,
    started_at: sub.startedAt,
    submitted_at: sub.submittedAt,
    time_spent_seconds: sub.timeSpentSeconds,
    answers: sub.answers,
    score: sub.score,
    total_possible_score: sub.totalPossibleScore,
    percentage: sub.percentage,
    passed: sub.passed,
    question_results: sub.questionResults,
    proctor_logs: sub.proctorLogs,
    integrity_score: sub.integrityScore,
    integrity_verdict: sub.integrityVerdict,
    ai_analytics: sub.aiAnalytics,
  };
}
