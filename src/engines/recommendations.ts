import type { ReadinessComponents, SkillGapResult } from "./types";
import { criticalGaps } from "./gap";

export interface RecommendationSet {
  summary: string;
  nextAction: string;
  priorities: {
    skillId: string;
    skillName: string;
    category: string;
    current: number;
    required: number;
    gap: number;
    action: string;
    why: string;
    estimatedWeeks: number;
  }[];
  studyPlan: string[];
  projectIdeas: string[];
  interviewTips: string[];
  resumeTips: string[];
  roleSuggestions: string[];
}

const PROJECT_IDEAS_BY_CATEGORY: Record<string, string[]> = {
  DSA: [
    "Build a real-time leaderboard or expense splitter that forces you to use maps, sorting and heaps.",
    "Implement a mini search engine (inverted index + ranking) to practice trees and hashing."
  ],
  DATABASE: [
    "Design and build a small library-management system with normalized schema and interesting JOIN reports.",
    "Build a job-listing aggregator with a search + filter UI backed by indexed queries."
  ],
  PROGRAMMING: [
    "Build a CLI tool that solves a problem you face weekly (file organizer, test data generator).",
    "Contribute a bug fix to an open-source project on GitHub."
  ],
  FRAMEWORK: [
    "Rebuild your strongest class project with the framework and deploy it — then add tests.",
    "Build a portfolio site that doubles as your resume."
  ],
  CLOUD: [
    "Deploy one project with CI/CD and a monitoring dashboard; document the architecture.",
    "Automate a routine task with a serverless function."
  ],
  DATA_AI: [
    "Take a public dataset relevant to your target role and ship an end-to-end analysis with charts.",
    "Build a small ML model (e.g., housing price or student performance prediction) and evaluate it honestly."
  ],
  CYBERSECURITY: [
    "Set up a deliberately vulnerable app in Docker and write a pentest report for it.",
    "Complete 5 TryHackMe rooms and summarize each attack chain."
  ],
  TOOLS: [
    "Containerize one of your existing projects and write a Dockerfile + README.",
    "Set up a CI pipeline that runs lint, tests and a build."
  ],
  COMMUNICATION: [
    "Record a 2-minute explanation of your final-year project and iterate on it.",
    "Write STAR-method answers for 5 common HR questions and practice aloud."
  ],
  SOFT: [
    "Run a mock group discussion with peers and ask for structured feedback.",
    "Document one project as a case study in clear, structured writing."
  ],
  APTITUDE: [
    "Track a daily 30-minute aptitude sprint for 3 weeks and chart your accuracy.",
    "Attempt 10 past placement aptitude papers under timed conditions."
  ],
  OTHER: [
    "Build a small project that showcases this skill end-to-end.",
    "Create a short demo video explaining a key concept in this area."
  ]
};

const INTERVIEW_TIPS = [
  "Practice the STAR method for 5 experiences — recruiters consistently rate structured answers higher.",
  "Do at least 2 timed mock interviews before your real one; review the recordings.",
  "Prepare 3 questions to ask the interviewer — it signals genuine interest.",
  "Explain your final-year project clearly: problem, your role, tech choices, outcome, and lessons.",
  "For coding rounds: verbalize your approach before writing code, and test edge cases."
];

const RESUME_TIPS = [
  "Quantify outcomes: 'improved load time by 40%' beats 'worked on performance'.",
  "List skills you can actually defend in an interview — every resume skill is fair game.",
  "Add your placement-relevant projects and certifications; keep it to one page for campus drives.",
  "Mirror the keywords from the role requirement — recruiters and ATS both look for them.",
  "Keep education concise and put your strongest, most role-relevant section first."
];

export function buildRecommendations(params: {
  gaps: SkillGapResult[];
  readiness: ReadinessComponents;
  roleName: string | null;
  projectCount: number;
  certificationCount: number;
  hasRoadmap: boolean;
}): RecommendationSet {
  const { gaps, readiness, roleName, projectCount, certificationCount, hasRoadmap } = params;
  const critical = criticalGaps(gaps).filter((g) => g.status === "CRITICAL_GAP");
  const major = gaps.filter((g) => g.status === "MAJOR_GAP");
  const top = gaps[0];

  const priorities = gaps
    .filter((g) => g.status !== "STRONG")
    .slice(0, 5)
    .map((g) => ({
      skillId: g.skillId,
      skillName: g.skillName,
      category: g.category,
      current: g.currentScore,
      required: g.requiredScore,
      gap: g.gap,
      action: actionFor(g),
      why: g.impact,
      estimatedWeeks: g.status === "CRITICAL_GAP" ? 3 : g.status === "MAJOR_GAP" ? 2 : 1
    }));

  const target = roleName ? ` for ${roleName}` : "";
  let summary: string;
  if (critical.length > 0) {
    summary = `Your placement readiness is ${readiness.overall}%. You have ${critical.length} critical gap${critical.length > 1 ? "s" : ""}${target}: ${critical.map((c) => c.skillName).join(", ")}. These are the highest-leverage areas to fix first.`;
  } else if (readiness.overall >= 75) {
    summary = `You're at ${readiness.overall}% readiness${target} — strong position. Focus on the remaining ${major.length} major gap${major.length > 1 ? "s" : ""} to cross into placement-ready territory.`;
  } else {
    summary = `Your placement readiness is ${readiness.overall}%${target}. Consistent weekly practice on your top gaps will move this number measurably.`;
  }

  const studyPlan = buildStudyPlan(priorities, roleName);

  const projectIdeas: string[] = [];
  for (const p of priorities.slice(0, 3)) {
    const ideas = PROJECT_IDEAS_BY_CATEGORY[p.category] ?? PROJECT_IDEAS_BY_CATEGORY.OTHER;
    projectIdeas.push(...ideas.slice(0, 1));
  }
  if (projectCount === 0) {
    projectIdeas.push("You have no projects listed — build at least one end-to-end project; it directly raises your Projects and overall readiness scores.");
  }
  if (certificationCount === 0) {
    projectIdeas.push("Consider one relevant certification this month — it strengthens your resume component.");
  }

  const roleSuggestions = roleName
    ? [`Your current target (${roleName}) remains your best bet once gaps close. Re-run role matching after each assessment cycle.`]
    : ["Select a target role to unlock precise skill-gap analysis."];

  return {
    summary,
    nextAction: top
      ? `Start with ${top.skillName} (${top.currentScore}% → need ${top.requiredScore}%). ${hasRoadmap ? "Your roadmap already has a focused plan for it." : "Generate your personalized roadmap and begin Week 1."}`
      : "Complete your skill profile or select a target role to get personalized recommendations.",
    priorities,
    studyPlan,
    projectIdeas: projectIdeas.slice(0, 3),
    interviewTips: INTERVIEW_TIPS,
    resumeTips: RESUME_TIPS,
    roleSuggestions
  };
}

function actionFor(g: SkillGapResult): string {
  switch (g.status) {
    case "CRITICAL_GAP":
      return `Dedicate 2–3 hours/week to ${g.skillName} with focused practice, then attempt the linked assessment.`;
    case "MAJOR_GAP":
      return `Follow the roadmap's ${g.skillName} weeks and attempt the assessment to lock in the gain.`;
    case "IMPROVE":
      return `One focused week on ${g.skillName} plus a quick assessment should close this gap.`;
    default:
      return `Keep ${g.skillName} sharp with light weekly practice.`;
  }
}

function buildStudyPlan(priorities: RecommendationSet["priorities"], roleName: string | null): string[] {
  const plan: string[] = [];
  priorities.slice(0, 3).forEach((p, i) => {
    const period = i === 0 ? "This week" : i === 1 ? "Next week" : "Week three";
    plan.push(`${period}: ${p.skillName} — ${p.action}`);
  });
  if (plan.length === 0) {
    plan.push(`Review ${roleName ?? "your target role"} requirements and maintain current strengths.`);
  }
  return plan;
}
