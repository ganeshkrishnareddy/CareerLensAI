import { prisma } from "@/lib/db";
import { callAI, isRecord, safeString, aiAvailable } from "@/lib/ai";
import { trackEvent } from "./analytics-service";

export interface CoachContext {
  name: string;
  targetRole: string | null;
  readiness: {
    overall: number;
    technical: number;
    coding: number;
    aptitude: number;
    communication: number;
    interview: number;
    projects: number;
    resume: number;
  } | null;
  topGaps: { skill: string; current: number; required: number; gap: number; status: string }[];
  strengths: string[];
  roadmapProgress: number | null;
  assessmentsTaken: number;
  projectsCount: number;
  certificationsCount: number;
  recentMilestones: string[];
}

export class CoachError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function getCoachContext(userId: string): Promise<CoachContext> {
  const [user, profile, snapshot, gaps, roadmap, attempts, projects, certifications] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findUnique({ where: { userId }, include: { targetRole: true } }),
    prisma.readinessSnapshot.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.skillGap.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { priority: "desc" },
      take: 20
    }),
    prisma.roadmap.findFirst({
      where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.assessmentAttempt.count({ where: { userId, status: "SUBMITTED" } }),
    prisma.project.count({ where: { userId } }),
    prisma.certification.count({ where: { userId } })
  ]);

  const topGaps = gaps
    .filter((g) => g.status !== "STRONG")
    .slice(0, 5)
    .map((g) => ({
      skill: g.skill.name,
      current: g.currentScore,
      required: g.requiredScore,
      gap: g.gap,
      status: g.status
    }));
  const strengths = gaps.filter((g) => g.status === "STRONG").slice(0, 4).map((g) => g.skill.name);

  const critical = gaps.filter((g) => g.status === "CRITICAL_GAP");
  const recentMilestones: string[] = [];
  if (critical.length > 0) recentMilestones.push(`${critical.length} critical gap${critical.length > 1 ? "s" : ""} detected: ${critical.map((c) => c.skill.name).join(", ")}`);
  if (snapshot && snapshot.overall >= 75) recentMilestones.push("Readiness above 75% — strong position");
  if (roadmap && roadmap.progress >= 50) recentMilestones.push(`Roadmap ${roadmap.progress}% complete`);
  if (attempts >= 3) recentMilestones.push(`${attempts} assessments completed`);

  return {
    name: user?.name ?? "Student",
    targetRole: profile?.targetRole?.name ?? null,
    readiness: snapshot
      ? {
          overall: snapshot.overall,
          technical: snapshot.technical,
          coding: snapshot.coding,
          aptitude: snapshot.aptitude,
          communication: snapshot.communication,
          interview: snapshot.interview,
          projects: snapshot.projects,
          resume: snapshot.resume
        }
      : null,
    topGaps,
    strengths,
    roadmapProgress: roadmap?.progress ?? null,
    assessmentsTaken: attempts,
    projectsCount: projects,
    certificationsCount: certifications,
    recentMilestones
  };
}

export interface CoachReply {
  text: string;
  source: "AI" | "FALLBACK";
}

type Intent =
  | "NEXT"
  | "WHY_LOW"
  | "IMPROVE_SKILL"
  | "ROLES"
  | "MISSING"
  | "INTERVIEW"
  | "PROJECTS"
  | "RESUME"
  | "STUDY_PLAN"
  | "GENERAL";

const INTENT_PATTERNS: { intent: Intent; patterns: RegExp[] }[] = [
  { intent: "NEXT", patterns: [/what.*(learn|study|focus|next)/i, /(learn|study).*(next|first)/i, /where.*(start|begin)/i] },
  { intent: "WHY_LOW", patterns: [/why.*(low|score|readiness|drop)/i, /readiness.*low/i, /why.*(bad|poor|less)/i] },
  { intent: "IMPROVE_SKILL", patterns: [/improve (my )?(dsa|sql|python|java|javascript|communication|aptitude|skills?|.*)/i, /how.*(improve|get better|master)/i, /strengthen/i] },
  { intent: "ROLES", patterns: [/what roles/i, /(which|what) (roles|jobs).*ready/i, /role match/i, /suitable.*role/i, /am i ready/i] },
  { intent: "MISSING", patterns: [/what skills.*missing/i, /skills (am|do) i (missing|lack|need)/i, /missing skills/i] },
  { intent: "INTERVIEW", patterns: [/interview questions/i, /practice interview/i, /mock interview/i, /interview prep/i] },
  { intent: "PROJECTS", patterns: [/review my project/i, /project idea/i, /what project/i, /projects? (should|to build)/i] },
  { intent: "RESUME", patterns: [/resume/i, /cv/i] },
  { intent: "STUDY_PLAN", patterns: [/study plan/i, /weekly plan/i, /schedule/i, /time table/i, /plan for/i] }
];

function classifyIntent(message: string): Intent {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(message))) return intent;
  }
  return "GENERAL";
}

function extractSkillName(message: string, context: CoachContext): string | null {
  const known = [...context.topGaps.map((g) => g.skill), ...context.strengths];
  for (const skill of known) {
    if (message.toLowerCase().includes(skill.toLowerCase())) return skill;
  }
  const lower = message.toLowerCase();
  const candidates: [string, string][] = [
    ["dsa", "Data Structures & Algorithms"],
    ["data structures", "Data Structures & Algorithms"],
    ["algorithms", "Data Structures & Algorithms"],
    ["sql", "SQL"],
    ["python", "Python"],
    ["java", "Java"],
    ["javascript", "JavaScript"],
    ["communication", "Communication"],
    ["aptitude", "Quantitative Aptitude"],
    ["dbms", "DBMS"],
    ["react", "React"]
  ];
  for (const [pattern, name] of candidates) {
    if (lower.includes(pattern)) return name;
  }
  return null;
}

export async function coachReply(
  userId: string,
  conversationId: string | null,
  message: string
): Promise<{ reply: CoachReply; conversationId: string }> {
  if (!message.trim()) throw new CoachError("Message cannot be empty");

  const context = await getCoachContext(userId);
  const intent = classifyIntent(message);
  const skill = extractSkillName(message, context);

  let conversation = conversationId
    ? await prisma.aiConversation.findFirst({ where: { id: conversationId, userId } })
    : null;
  if (!conversation) {
    conversation = await prisma.aiConversation.create({
      data: { userId, title: message.slice(0, 60) }
    });
  }

  await prisma.aiMessage.create({
    data: { conversationId: conversation.id, role: "USER", content: message }
  });

  let reply: CoachReply | null = null;

  if (aiAvailable()) {
    reply = await aiCoachReply(context, intent, skill, message, conversation.id);
  }
  if (!reply) {
    reply = { text: fallbackCoachReply(context, intent, skill), source: "FALLBACK" };
  }

  await prisma.aiMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: reply.text,
      source: reply.source,
      context: { intent, skill, snapshot: { overall: context.readiness?.overall } }
    }
  });

  await trackEvent(userId, "AI_COACH_USAGE", { intent, source: reply.source, conversationId: conversation.id });

  return { reply, conversationId: conversation.id };
}

async function aiCoachReply(
  context: CoachContext,
  intent: Intent,
  skill: string | null,
  userMessage: string,
  conversationId: string
): Promise<CoachReply | null> {
  const systemPrompt = `You are the CareerLens AI Career Coach inside a placement-preparation platform.
Answer using ONLY the student's real data below. Be specific, actionable and concise (under 180 words). Use their actual numbers.
Return STRICT JSON: {"text": "...", "followups": ["..."]}. No markdown fences.

STUDENT CONTEXT (real data):
${JSON.stringify(context, null, 1)}

The student asked (intent=${intent}${skill ? `, skill=${skill}` : ""}): "${userMessage}"`;

  const result = await callAI(
    [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
    { json: true, maxTokens: 500 }
  );

  if (!isRecord(result)) return null;
  const text = safeString(result.text, "");
  if (!text) return null;

  const followups = Array.isArray(result.followups)
    ? result.followups.filter((f): f is string => typeof f === "string").slice(0, 3)
    : [];

  let finalText = text;
  if (followups.length > 0) {
    finalText += "\n\nYou could ask next:\n" + followups.map((f) => `• ${f}`).join("\n");
  }
  return { text: finalText, source: "AI" };
}

function fallbackCoachReply(context: CoachContext, intent: Intent, skill: string | null): string {
  const r = context.readiness;
  const top = context.topGaps[0];
  const role = context.targetRole ?? "your target role";

  switch (intent) {
    case "NEXT":
      if (top) {
        return `Based on your profile, the highest-value action right now is **${top.skill}** — you're at ${top.current}% but ${role} needs ${top.required}% (a ${top.gap} point gap, ${top.status.replace(/_/g, " ")}).\n\nYour personalized roadmap already includes it — open the roadmap and start this week's ${top.skill} tasks. After you practice, take the linked assessment so your skill profile updates automatically.`;
      }
      return "You don't have any gaps against your current target role — impressive! Next best move: explore role matching to see which other roles you're closest to, or strengthen your preferred skills to raise your fit score.";
    case "WHY_LOW":
      if (!r) return "You don't have a readiness score yet. Complete your profile, add skills, and take at least one assessment — then I can explain exactly what's pulling your score down.";
      {
        const components: [string, number][] = [
          ["Interview", r.interview],
          ["Aptitude", r.aptitude],
          ["Coding", r.coding],
          ["Projects", r.projects],
          ["Resume", r.resume],
          ["Technical Skills", r.technical]
        ];
        const lowest = components.sort((a, b) => a[1] - b[1]);
        const weakest = lowest[0];
        const reason = reasonFor(weakest[0], top);
        return `Your overall readiness is ${r.overall}%. The weakest component is **${weakest[0]} at ${weakest[1]}%**. ${reason}\n\nRecommended: ${top ? `start with ${top.skill} (your #1 priority gap)` : "take the aptitude and interview assessments to fill in the missing data"} — then reassess to watch the number move.`;
      }
    case "IMPROVE_SKILL": {
      const target = skill ?? top?.skill;
      const gap = top && (!skill || top.skill === target) ? top : context.topGaps.find((g) => g.skill === target);
      if (!gap) {
        return `There's no recorded gap for ${target ?? "that skill"} against ${role} right now. If you still want to strengthen it, add it to your skill profile and I'll fold it into your analysis.`;
      }
      return `Here's a focused plan for **${gap.skill}** (${gap.current}% → need ${gap.required}%):\n\n1. **This week:** follow your roadmap's ${gap.skill} module — practice the listed tasks (about 90–120 min).\n2. **Practice:** solve problems in increasing difficulty; for ${gap.skill.toLowerCase().includes("dsa") || gap.skill.toLowerCase().includes("structure") ? "DSA, use pattern-based practice on LeetCode/NeetCode" : "use the resources linked in your roadmap"}.\n3. **Re-assess:** take the linked assessment. A good attempt updates your score automatically and I'll tell you the new gap.\n\nConsistent 3–4 focused sessions usually close a gap this size.`;
    }
    case "ROLES": {
      if (context.topGaps.length === 0 && r) {
        return `With ${r.overall}% readiness and no critical gaps, you're in a strong position. Check the **Role Matching** page — your fit scores across all roles are calculated there with the exact missing skills for each. Pick the highest fit and use its recommendations.`;
      }
      return `Right now your strongest fit is likely **${role}** (your selected target). To compare yourself against other roles, open **Role Matching** — every role is scored against your real skill profile.\n\n${top ? `Note: your ${top.skill} gap (${top.gap} points) currently caps your fit for most engineering roles. Close it and your fit scores will jump across the board.` : ""}`;
    }
    case "MISSING": {
      if (context.topGaps.length === 0) return `You're meeting every core requirement for ${role}. No missing skills right now — great work!`;
      const list = context.topGaps
        .slice(0, 4)
        .map((g) => `• ${g.skill}: ${g.current}% vs ${g.required}% needed (${g.status.replace(/_/g, " ")})`)
        .join("\n");
      return `For ${role}, your main gaps are:\n\n${list}\n\nThe most urgent is **${top?.skill}** (priority #1). Each of these is already turned into a weekly plan on your roadmap — work them in priority order and reassess after each one.`;
    }
    case "INTERVIEW":
      return `Here's a quick interview drill plan (go to **Interview Practice** for the question bank):\n\n1. Pick 3 questions for ${role} and answer them out loud.\n2. Use the STAR method for behavioral questions: Situation, Task, Action, Result.\n3. For coding rounds, practice explaining your approach before writing code.\n4. ${top ? `Brush up on ${top.skill} — it's your weakest area and the most likely interview target.` : "Review your strongest skills — you'll be asked to defend them."}\n\nAfter 2 practice rounds, take the **Interview Readiness** assessment — it updates your Interview score.`;
    case "PROJECTS": {
      const ideas =
        "Good project ideas tied to your gaps: 1) " + (top ? `a ${top.skill}-focused project (${top.skill} is your top gap — build something that forces you to use it daily)` : "a full-stack app that exercises your core skills") + "; 2) a portfolio site that doubles as your resume; 3) a small data analysis dashboard if you're targeting data roles.\n\nYou currently have " + context.projectsCount + " project(s) listed. Adding 1–2 completed projects raises your Projects readiness component directly.";
      return ideas;
    }
    case "RESUME":
      return `Resume tips based on your profile (targeting ${role}):\n\n• Quantify outcomes — “improved load time by 40%” beats “worked on performance”.\n• ${top ? `Lead with ${top.skill} since it's the biggest requirement gap for ${role} — show any coursework, project or cert that demonstrates it.` : "Mirror the keywords from the role requirement — ATS systems and recruiters both scan for them."}\n• Add your placement-relevant projects and certifications; keep it to one page for campus drives.\n• ${context.projectsCount === 0 ? "Add at least one project — right now you have none listed." : "Make sure every skill on your resume is one you can defend in an interview."}\n\nUpload your resume on the **Resume Analysis** page — CareerLens extracts your skills automatically and you can confirm them before they update your profile.`;
    case "STUDY_PLAN": {
      const weeks = context.topGaps.slice(0, 3);
      if (weeks.length === 0) return `You have no critical gaps for ${role}, so the best plan is maintenance: keep your strengths sharp with weekly practice and take one mock assessment per month.`;
      const plan = weeks
        .map((g, i) => `**Week ${i + 1}:** ${g.skill} — ${Math.ceil(g.gap / 15)} focused sessions, then the linked assessment`)
        .join("\n");
      return `Here's a 3-week plan built from your real gaps:\n\n${plan}\n\nSchedule ~90 minutes per session, 4 days a week. After each week, take the assessment for that skill so your readiness score updates. I'll generate a full weekly roadmap with tasks and resources on the **Roadmap** page.`;
    }
    default: {
      if (r && top) {
        return `Here's where you stand: **${r.overall}% overall readiness** for ${role}. Your biggest lever is **${top.skill}** (${top.current}% → need ${top.required}%). ${context.roadmapProgress !== null ? `Your roadmap is ${context.roadmapProgress}% complete.` : "Generate your roadmap to get a week-by-week plan."}\n\nAsk me things like “What should I learn next?”, “Why is my readiness low?”, or “Give me interview questions” — I answer from your live profile data.`;
      }
      return `I'm your AI Career Coach. Once you complete your profile, add your skills and take an assessment, I'll be able to answer with your real numbers — e.g. “What should I learn next?” or “What roles am I ready for?”. For now: complete your profile → select a target role → take the skill assessment.`;
    }
  }
}

function reasonFor(component: string, top?: { skill: string; current: number; required: number }): string {
  switch (component) {
    case "Interview":
      return "You have limited interview assessment data, so this component sits at its baseline. Practice interviews and retake the assessment to raise it.";
    case "Aptitude":
      return "Aptitude tests are the first filter at most companies. Take the aptitude assessment to replace the baseline with your real performance.";
    case "Projects":
      return "Projects make up the Projects component. Add completed, role-relevant projects to raise it.";
    case "Resume":
      return "Your resume component reflects profile completeness and resume upload. Complete your profile and upload/confirm your resume extraction.";
    case "Coding":
      return top
        ? `Your coding skills average out to ${top.current}%-level in the gap analysis. Practice and reassess to push this up.`
        : "Coding is measured from your DSA/programming skill scores and coding assessments.";
    default:
      return `This is the weakest input feeding your readiness score right now.`;
  }
}

export async function conversationHistory(userId: string, conversationId: string) {
  const conversation = await prisma.aiConversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } }
  });
  return conversation;
}

export async function listConversations(userId: string) {
  return prisma.aiConversation.findMany({
    where: { userId },
    include: { _count: { select: { messages: true } } },
    orderBy: { createdAt: "desc" },
    take: 20
  });
}
