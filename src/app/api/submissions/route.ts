import { NextResponse } from 'next/server';
import { getExamById, saveSubmission, getSubmissions } from '@/lib/db';
import { evaluateShortAnswerWithAI, generateExamAnalytics } from '@/lib/ai-service';
import { Submission, QuestionResult, ProctorIncident } from '@/types';

export async function GET() {
  try {
    const submissions = await getSubmissions();
    return NextResponse.json({ success: true, submissions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      examId,
      candidateName,
      candidateEmail,
      candidatePhoto,
      startedAt,
      timeSpentSeconds,
      answers,
      proctorLogs = [],
      apiKey,
    } = body;

    const exam = await getExamById(examId);
    if (!exam) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }

    const questionResults: QuestionResult[] = [];
    let totalScore = 0;
    let totalPossible = 0;

    for (const q of exam.questions) {
      const userAnswer = answers?.[q.id] ?? '';
      totalPossible += q.marks;

      if (q.type === 'short_answer') {
        let aiEval;
        try {
          aiEval = await evaluateShortAnswerWithAI(q, String(userAnswer), apiKey);
        } catch (err: any) {
          console.error(`AI Evaluation failed on question ${q.id}:`, err);
          aiEval = {
            score: 0,
            maxScore: q.marks,
            accuracy: 'none' as const,
            strengths: [],
            improvements: [`Evaluation error: ${err.message}`],
            reasoning: `AI Evaluation Error: ${err.message}. Submitted for instructor review.`,
          };
        }
        const scoreAwarded = aiEval.score;
        totalScore += scoreAwarded;

        questionResults.push({
          questionId: q.id,
          userAnswer,
          isCorrect: scoreAwarded >= (q.marks * 0.7),
          scoreAwarded,
          maxScore: q.marks,
          explanation: q.explanation,
          aiEvaluation: aiEval,
        });
      } else if (q.type === 'mcq_multiple') {
        const correctSet = new Set(Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]);
        const userSet = new Set(Array.isArray(userAnswer) ? userAnswer : [userAnswer].filter(Boolean));

        const isExactMatch = correctSet.size === userSet.size && [...correctSet].every((val) => userSet.has(val));
        const scoreAwarded = isExactMatch ? q.marks : 0;
        totalScore += scoreAwarded;

        questionResults.push({
          questionId: q.id,
          userAnswer,
          isCorrect: isExactMatch,
          scoreAwarded,
          maxScore: q.marks,
          explanation: q.explanation,
        });
      } else {
        // mcq_single, true_false, code
        const isCorrect = String(userAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
        const scoreAwarded = isCorrect ? q.marks : 0;
        totalScore += scoreAwarded;

        questionResults.push({
          questionId: q.id,
          userAnswer,
          isCorrect,
          scoreAwarded,
          maxScore: q.marks,
          explanation: q.explanation,
        });
      }
    }

    const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    const passed = percentage >= exam.passingScore;

    // Calculate integrity score from proctor incidents
    let deductions = 0;
    for (const inc of proctorLogs as ProctorIncident[]) {
      if (inc.type === 'tab_switch' || inc.type === 'window_blur') deductions += 10;
      else if (inc.type === 'fullscreen_exit') deductions += 15;
      else if (inc.type === 'multiple_faces') deductions += 25;
      else if (inc.type === 'face_missing') deductions += 10;
      else if (inc.type === 'paste_attempt') deductions += 10;
      else deductions += 5;
    }

    const integrityScore = Math.max(0, 100 - deductions);
    let integrityVerdict: 'clean' | 'flagged' | 'high_risk' = 'clean';
    if (integrityScore < 60 || proctorLogs.length >= 4) {
      integrityVerdict = 'high_risk';
    } else if (integrityScore < 85 || proctorLogs.length > 0) {
      integrityVerdict = 'flagged';
    }

    // Generate AI analytics
    const aiAnalytics = generateExamAnalytics(exam, questionResults, percentage);

    const submission: Submission = {
      id: `sub-${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      candidateName: candidateName || 'Anonymous Candidate',
      candidateEmail: candidateEmail || 'candidate@example.com',
      candidatePhoto,
      startedAt: startedAt || new Date(Date.now() - (timeSpentSeconds || 60) * 1000).toISOString(),
      submittedAt: new Date().toISOString(),
      timeSpentSeconds: timeSpentSeconds || 60,
      answers: answers || {},
      score: totalScore,
      totalPossibleScore: totalPossible,
      percentage,
      passed,
      questionResults,
      proctorLogs,
      integrityScore,
      integrityVerdict,
      aiAnalytics,
    };

    await saveSubmission(submission);

    return NextResponse.json({ success: true, submission });
  } catch (err: any) {
    console.error('Error submitting exam:', err);
    return NextResponse.json({ success: false, error: err.message || 'Submission failed' }, { status: 500 });
  }
}

