import fs from 'fs';
import path from 'path';
import { Exam, Submission } from '@/types';
import { initialExams } from './seed-data';
import {
  isSupabaseConfigured,
  getSupabaseServerClient,
  mapDbExamToExam,
  mapExamToDbExam,
  mapDbSubmissionToSubmission,
  mapSubmissionToDbSubmission,
} from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const EXAMS_FILE = path.join(DATA_DIR, 'exams.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, 'announcements.json');

export interface Announcement {
  id: string;
  sender: string;
  title?: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  timestamp: string;
  targetExamId?: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getExamsFromLocal(): Exam[] {
  ensureDataDir();
  if (!fs.existsSync(EXAMS_FILE)) {
    fs.writeFileSync(EXAMS_FILE, JSON.stringify(initialExams, null, 2), 'utf-8');
    return initialExams;
  }
  try {
    const raw = fs.readFileSync(EXAMS_FILE, 'utf-8');
    const exams = JSON.parse(raw);
    return Array.isArray(exams) ? exams : initialExams;
  } catch (err) {
    console.error('Failed to read exams.json, falling back to seed data', err);
    return initialExams;
  }
}

function getSubmissionsFromLocal(): Submission[] {
  ensureDataDir();
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  try {
    const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
    const subs = JSON.parse(raw);
    return Array.isArray(subs) ? subs : [];
  } catch (err) {
    console.error('Failed to read submissions.json', err);
    return [];
  }
}

// ============================================================================
// EXAMS API
// ============================================================================

export async function getExams(): Promise<Exam[]> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseServerClient();
      const { data, error } = await client
        .from('exams')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(mapDbExamToExam);
      }
      if (error) {
        console.warn('[Supabase] Failed to fetch exams, falling back to local storage:', error.message);
      }
    } catch (err: any) {
      console.warn('[Supabase] Connection error during getExams:', err.message);
    }
  }

  return getExamsFromLocal();
}

export async function getExamById(id: string): Promise<Exam | undefined> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseServerClient();
      const { data, error } = await client
        .from('exams')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapDbExamToExam(data);
      }
      if (error) {
        console.warn(`[Supabase] Failed to get exam ${id}:`, error.message);
      }
    } catch (err: any) {
      console.warn(`[Supabase] Connection error during getExamById(${id}):`, err.message);
    }
  }

  const exams = getExamsFromLocal();
  return exams.find((e) => e.id === id);
}

export async function saveExam(exam: Exam): Promise<Exam> {
  // Always update local cache / backup
  ensureDataDir();
  const exams = getExamsFromLocal();
  const existingIdx = exams.findIndex((e) => e.id === exam.id);
  if (existingIdx >= 0) {
    exams[existingIdx] = exam;
  } else {
    exams.unshift(exam);
  }
  fs.writeFileSync(EXAMS_FILE, JSON.stringify(exams, null, 2), 'utf-8');

  // If Supabase is active, persist to PostgreSQL
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseServerClient();
      const dbRow = mapExamToDbExam(exam);
      const { error } = await client.from('exams').upsert(dbRow, { onConflict: 'id' });
      if (error) {
        console.error('[Supabase] Error upserting exam:', error.message);
      } else {
        console.log(`[Supabase] Exam ${exam.id} successfully synced.`);
      }
    } catch (err: any) {
      console.error('[Supabase] Error syncing exam:', err.message);
    }
  }

  return exam;
}

export async function deleteExam(id: string): Promise<boolean> {
  ensureDataDir();
  const exams = getExamsFromLocal();
  const filtered = exams.filter((e) => e.id !== id);
  const deletedLocally = filtered.length !== exams.length;
  if (deletedLocally) {
    fs.writeFileSync(EXAMS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  }

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseServerClient();
      const { error } = await client.from('exams').delete().eq('id', id);
      if (error) {
        console.error(`[Supabase] Error deleting exam ${id}:`, error.message);
      }
    } catch (err: any) {
      console.error(`[Supabase] Error deleting exam ${id}:`, err.message);
    }
  }

  return deletedLocally;
}

// ============================================================================
// SUBMISSIONS API
// ============================================================================

export async function getSubmissions(): Promise<Submission[]> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseServerClient();
      const { data, error } = await client
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(mapDbSubmissionToSubmission);
      }
      if (error) {
        console.warn('[Supabase] Failed to fetch submissions, falling back to local storage:', error.message);
      }
    } catch (err: any) {
      console.warn('[Supabase] Connection error during getSubmissions:', err.message);
    }
  }

  return getSubmissionsFromLocal();
}

export async function getSubmissionById(id: string): Promise<Submission | undefined> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseServerClient();
      const { data, error } = await client
        .from('submissions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapDbSubmissionToSubmission(data);
      }
      if (error) {
        console.warn(`[Supabase] Failed to get submission ${id}:`, error.message);
      }
    } catch (err: any) {
      console.warn(`[Supabase] Connection error during getSubmissionById(${id}):`, err.message);
    }
  }

  const submissions = getSubmissionsFromLocal();
  return submissions.find((s) => s.id === id);
}

export async function saveSubmission(submission: Submission): Promise<Submission> {
  // Always update local cache / backup
  ensureDataDir();
  const submissions = getSubmissionsFromLocal();
  const existingIdx = submissions.findIndex((s) => s.id === submission.id);
  if (existingIdx >= 0) {
    submissions[existingIdx] = submission;
  } else {
    submissions.unshift(submission);
  }
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), 'utf-8');

  // If Supabase is active, persist to PostgreSQL
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseServerClient();
      const dbRow = mapSubmissionToDbSubmission(submission);
      const { error } = await client.from('submissions').upsert(dbRow, { onConflict: 'id' });
      if (error) {
        console.error('[Supabase] Error upserting submission:', error.message);
      } else {
        console.log(`[Supabase] Submission ${submission.id} successfully synced.`);
      }
    } catch (err: any) {
      console.error('[Supabase] Error syncing submission:', err.message);
    }
  }

  return submission;
}
