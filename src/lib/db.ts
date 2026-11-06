import fs from 'fs';
import path from 'path';
import { Exam, Submission } from '@/types';
import { initialExams } from './seed-data';

const DATA_DIR = path.join(process.cwd(), 'data');
const EXAMS_FILE = path.join(DATA_DIR, 'exams.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getExams(): Exam[] {
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

export function getExamById(id: string): Exam | undefined {
  const exams = getExams();
  return exams.find((e) => e.id === id);
}

export function saveExam(exam: Exam): Exam {
  ensureDataDir();
  const exams = getExams();
  const existingIdx = exams.findIndex((e) => e.id === exam.id);
  if (existingIdx >= 0) {
    exams[existingIdx] = exam;
  } else {
    exams.unshift(exam);
  }
  fs.writeFileSync(EXAMS_FILE, JSON.stringify(exams, null, 2), 'utf-8');
  return exam;
}

export function deleteExam(id: string): boolean {
  ensureDataDir();
  const exams = getExams();
  const filtered = exams.filter((e) => e.id !== id);
  if (filtered.length !== exams.length) {
    fs.writeFileSync(EXAMS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
  return false;
}

export function getSubmissions(): Submission[] {
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

export function getSubmissionById(id: string): Submission | undefined {
  const submissions = getSubmissions();
  return submissions.find((s) => s.id === id);
}

export function saveSubmission(submission: Submission): Submission {
  ensureDataDir();
  const submissions = getSubmissions();
  const existingIdx = submissions.findIndex((s) => s.id === submission.id);
  if (existingIdx >= 0) {
    submissions[existingIdx] = submission;
  } else {
    submissions.unshift(submission);
  }
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), 'utf-8');
  return submission;
}

