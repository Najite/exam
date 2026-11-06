export type QuestionType = 'mcq_single' | 'mcq_multiple' | 'true_false' | 'short_answer' | 'code';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type BloomLevel = 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'evaluation';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  codeSnippet?: string;
  options?: QuestionOption[];
  correctAnswer: string | string[]; // Option ID(s) or model string for short_answer
  explanation: string;
  marks: number;
  topic: string;
  bloomLevel?: BloomLevel;
  evaluationRubric?: string; // used by AI for grading short answers
}

export interface ProctoringSettings {
  enableWebcam: boolean;
  enableMic: boolean;
  enableFullscreen: boolean;
  maxTabSwitches: number;
  aiFaceDetection: boolean;
  blockCopyPaste: boolean;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: DifficultyLevel;
  durationMinutes: number;
  passingScore: number;
  totalMarks: number;
  proctoringSettings: ProctoringSettings;
  instructions: string[];
  questions: Question[];
  createdAt: string;
  isPublished: boolean;
}

export type ProctorIncidentType = 
  | 'tab_switch' 
  | 'fullscreen_exit' 
  | 'face_missing' 
  | 'multiple_faces' 
  | 'noise_detected' 
  | 'paste_attempt'
  | 'window_blur';

export interface ProctorIncident {
  id: string;
  timestamp: string;
  secondsIntoExam: number;
  type: ProctorIncidentType;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface AIEvaluation {
  score: number;
  maxScore: number;
  accuracy: string;
  strengths: string[];
  improvements: string[];
  reasoning: string;
}

export interface QuestionResult {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  scoreAwarded: number;
  maxScore: number;
  explanation: string;
  aiEvaluation?: AIEvaluation;
}

export interface TopicBreakdown {
  topic: string;
  score: number;
  total: number;
  percentage: number;
}

export interface AIAnalytics {
  topicBreakdown: TopicBreakdown[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
  estimatedPercentile: number;
}

export interface Submission {
  id: string;
  examId: string;
  examTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhoto?: string;
  startedAt: string;
  submittedAt: string;
  timeSpentSeconds: number;
  answers: Record<string, string | string[]>;
  score: number;
  totalPossibleScore: number;
  percentage: number;
  passed: boolean;
  questionResults: QuestionResult[];
  proctorLogs: ProctorIncident[];
  integrityScore: number; // 0 - 100
  integrityVerdict: 'clean' | 'flagged' | 'high_risk';
  aiAnalytics: AIAnalytics;
}
