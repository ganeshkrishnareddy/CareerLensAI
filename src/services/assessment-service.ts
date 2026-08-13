import { prisma } from "@/lib/db";
import { trackEvent } from "./analytics-service";
import { notify } from "./notifications-service";
import { applySkillScoreUpdate, recomputeAnalysis } from "./analysis-service";
import { safeJsonParse } from "@/lib/utils";

export interface QuestionView {
  id: string;
  text: string;
  type: string;
  options: { key: string; text: string }[] | null;
  marks: number;
  difficulty: string;
}

export class AssessmentError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function startAssessment(userId: string, assessmentId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { questions: true }
  });
  if (!assessment || !assessment.isActive) throw new AssessmentError("Assessment not found", 404);
  if (assessment.questions.length === 0) throw new AssessmentError("This assessment has no questions yet.");

  const existing = await prisma.assessmentAttempt.findUnique({
    where: { assessmentId_userId_activeKey: { assessmentId, userId, activeKey: "active" } }
  });
  if (existing) {
    if (existing.deadline < new Date()) {
      await autoSubmitTimedOut(existing.id);
    } else {
      return { attempt: existing, questions: await questionViews(existing.id), fresh: false };
    }
  }

  const deadline = new Date(Date.now() + assessment.durationMinutes * 60000);
  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId,
      userId,
      deadline,
      totalQuestions: assessment.questions.length,
      status: "IN_PROGRESS",
      activeKey: "active"
    }
  });
  await trackEvent(userId, "ASSESSMENT_STARTED", { assessmentId, type: assessment.type });

  return { attempt, questions: await questionViews(attempt.id), fresh: true };
}

async function autoSubmitTimedOut(attemptId: string) {
  await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: { status: "TIMED_OUT", submittedAt: new Date(), activeKey: null }
  });
}

async function questionViews(attemptId: string): Promise<QuestionView[]> {
  const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId }, include: { assessment: { include: { questions: true } } } });
  if (!attempt) return [];
  return attempt.assessment.questions
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: safeJsonParse<{ key: string; text: string }[] | null>(q.options, null),
      marks: q.marks,
      difficulty: q.difficulty
    }));
}

export interface SubmitAnswer {
  questionId: string;
  answer: unknown;
}

export interface SubmitResult {
  attemptId: string;
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  perSkill: { skillId: string; skillName: string; score: number; questionCount: number }[];
  recomputed: boolean;
}

export async function submitAssessment(userId: string, attemptId: string, answers: SubmitAnswer[]): Promise<SubmitResult> {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: { include: { questions: { include: { questionSk: { include: { skill: true } } } } } }
    }
  });
  if (!attempt) throw new AssessmentError("Attempt not found", 404);
  if (attempt.userId !== userId) throw new AssessmentError("Not authorized", 403);
  if (attempt.status !== "IN_PROGRESS") throw new AssessmentError("This attempt was already submitted.");

  const now = new Date();
  if (attempt.deadline < now) {
    await autoSubmitTimedOut(attemptId);
    throw new AssessmentError("Time is up — this attempt was auto-submitted. Start a new attempt to retake.", 410);
  }

  const questions = attempt.assessment.questions;
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));
  const totalMarks = questions.reduce((a, q) => a + q.marks, 0) || 1;
  let earned = 0;
  let correctCount = 0;

  const skillAccum: Record<string, { earned: number; total: number; name: string; count: number }> = {};

  const answerRows = questions.map((q) => {
    const answer = answerMap.get(q.id) ?? null;
    const result = evaluateQuestion(q.type, q.correctAnswer, answer);
    earned += result.marks;
    if (result.correct) correctCount += 1;

    for (const qs of q.questionSk) {
      const acc = (skillAccum[qs.skillId] ??= { earned: 0, total: 0, name: qs.skill.name, count: 0 });
      acc.earned += result.marks;
      acc.total += q.marks;
      acc.count += 1;
    }

    return {
      attemptId,
      questionId: q.id,
      answer: answer as object,
      isCorrect: result.correct,
      marksEarned: result.marks,
      feedback: result.feedback
    };
  });

  await prisma.assessmentAnswer.createMany({ data: answerRows });

  const score = Math.round((earned / totalMarks) * 100);
  const passed = score >= (attempt.assessment.passScore ?? 50);
  const timeTakenSeconds = Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000);

  await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      status: "SUBMITTED",
      submittedAt: now,
      score,
      passed,
      correctCount,
      timeTakenSeconds,
      answers: answers as object,
      activeKey: null
    }
  });

  // ── Skill mapping: update the student's skill profile ──
  const perSkill: SubmitResult["perSkill"] = [];
  for (const [skillId, acc] of Object.entries(skillAccum)) {
    const skillScore = acc.total > 0 ? Math.round((acc.earned / acc.total) * 100) : 0;
    await applySkillScoreUpdate({ userId, skillId, newScore: skillScore, source: "ASSESSMENT" });
    perSkill.push({ skillId, skillName: acc.name, score: skillScore, questionCount: acc.count });
  }

  // ── Adaptive loop: recompute gaps, readiness, matches, roadmap ──
  await recomputeAnalysis(userId, { refreshRoadmap: true });
  const recomputed = true;

  await notify({
    userId,
    type: "ASSESSMENT",
    title: `Assessment result: ${attempt.assessment.title}`,
    message: `You scored ${score}% (${passed ? "passed" : "needs improvement"}). Your skill profile has been updated — view your new gaps and readiness.`,
    link: `/student/assessments/results/${attemptId}`
  });
  await trackEvent(userId, "ASSESSMENT_COMPLETED", { assessmentId: attempt.assessmentId, score, passed });

  return { attemptId, score, passed, correctCount, totalQuestions: questions.length, timeTakenSeconds, perSkill, recomputed };
}

function evaluateQuestion(
  type: string,
  correctAnswer: unknown,
  answer: unknown
): { marks: number; correct: boolean; feedback?: string } {
  const correct = safeJsonParse<{ keys?: string[]; rubric?: string[] } | null>(correctAnswer, null);

  if (type === "MCQ" || type === "MULTIPLE") {
    const answerKeys = Array.isArray(answer) ? answer.map(String).sort() : typeof answer === "string" ? [answer] : [];
    const correctKeys = [...(correct?.keys ?? [])].sort();
    const isCorrect =
      answerKeys.length > 0 &&
      answerKeys.length === correctKeys.length &&
      answerKeys.every((k, i) => k === correctKeys[i]);
    return { marks: isCorrect ? 1 : 0, correct: isCorrect, feedback: isCorrect ? undefined : "Incorrect answer." };
  }

  // Coding / text questions: rubric keyword matching (deterministic).
  if (type === "CODING" || type === "TEXT") {
    const text = typeof answer === "string" ? answer : JSON.stringify(answer ?? "");
    const rubric = correct?.rubric ?? [];
    if (rubric.length === 0) {
      const hasContent = text.trim().length > 0;
      return { marks: hasContent ? 1 : 0, correct: hasContent, feedback: hasContent ? undefined : "No answer provided." };
    }
    const lower = text.toLowerCase();
    const matched = rubric.filter((k) => lower.includes(k.toLowerCase())).length;
    const ratio = matched / rubric.length;
    const partial = ratio >= 0.5;
    return {
      marks: partial ? ratio : 0,
      correct: ratio >= 0.8,
      feedback: partial ? `Matched ${matched}/${rubric.length} rubric points.` : "Answer did not cover the key points."
    };
  }

  return { marks: 0, correct: false, feedback: "Unsupported question type." };
}

export async function getAttemptResult(attemptId: string, userId: string) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: { include: { questions: { include: { questionSk: { include: { skill: true } } } } } },
      answersDb: true
    }
  });
  if (!attempt) throw new AssessmentError("Attempt not found", 404);
  if (attempt.userId !== userId) throw new AssessmentError("Not authorized", 403);

  const answerMap = new Map(attempt.answersDb.map((a) => [a.questionId, a]));
  const perSkill: { skillId: string; skillName: string; score: number }[] = [];
  const skillAgg: Record<string, { earned: number; total: number; name: string }> = {};
  for (const q of attempt.assessment.questions) {
    const row = answerMap.get(q.id);
    const marks = row?.marksEarned ?? 0;
    for (const qs of q.questionSk) {
      const agg = (skillAgg[qs.skillId] ??= { earned: 0, total: 0, name: qs.skill.name });
      agg.earned += marks;
      agg.total += q.marks;
    }
  }
  for (const [skillId, agg] of Object.entries(skillAgg)) {
    perSkill.push({ skillId, skillName: agg.name, score: agg.total > 0 ? Math.round((agg.earned / agg.total) * 100) : 0 });
  }

  const questions = attempt.assessment.questions
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((q) => {
      const row = answerMap.get(q.id);
      return {
        id: q.id,
        text: q.text,
        type: q.type,
        options: safeJsonParse(q.options, null),
        marks: q.marks,
        difficulty: q.difficulty,
        correctAnswer: safeJsonParse(q.correctAnswer, null),
        explanation: q.explanation,
        yourAnswer: row?.answer ?? null,
        isCorrect: row?.isCorrect ?? null,
        marksEarned: row?.marksEarned ?? 0,
        feedback: row?.feedback ?? null
      };
    });

  return { attempt, perSkill, questions };
}
