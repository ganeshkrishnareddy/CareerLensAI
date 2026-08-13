import type { SkillGapResult, RoadmapPlan, RoadmapTask } from "./types";

export interface RoadmapResource {
  title: string;
  url: string;
}

export interface RoadmapEvidence {
  gaps: SkillGapResult[]; // sorted by priority
  roleName: string;
  weeks: number;
  startDate: Date;
  resourcesBySkill?: Record<string, RoadmapResource[]>;
  resourcesByCategory?: Record<string, RoadmapResource[]>;
  assessmentsBySkill?: Record<string, { id: string; title: string }[]>;
  assessmentsByType?: Record<string, { id: string; title: string }[]>;
}

interface CategoryTemplate {
  topics: string[];
  practice: string[];
  resources: RoadmapResource[];
  assessmentType?: string;
}

export const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  DSA: {
    topics: ["Arrays & Strings", "Hash Maps & Sets", "Two Pointers", "Linked Lists", "Stacks & Queues", "Recursion & Backtracking", "Binary Search", "Sorting Algorithms", "Trees & Graphs", "Dynamic Programming", "Greedy Algorithms", "Complexity Analysis"],
    practice: ["Solve 5 pattern problems on LeetCode", "Implement 2 solutions from scratch without references", "Explain your approach out loud — as in an interview", "Review editorial solutions for the problems you missed"],
    resources: [
      { title: "LeetCode — DSA Patterns", url: "https://leetcode.com/studyplan/" },
      { title: "GeeksforGeeks — Data Structures", url: "https://www.geeksforgeeks.org/data-structures/" },
      { title: "NeetCode — Roadmap", url: "https://neetcode.io/roadmap" }
    ],
    assessmentType: "TECHNICAL"
  },
  PROGRAMMING: {
    topics: ["Language Fundamentals", "Functions & Scope", "Object-Oriented Programming", "Error Handling & Debugging", "File I/O & Modules", "Concurrency Basics", "Best Practices & Code Style", "Build & Packaging"],
    practice: ["Write 3 small programs using this week's concepts", "Refactor one past project to follow best practices", "Solve 5 easy coding problems in your language", "Review another student's code and give feedback"],
    resources: [
      { title: "Python Official Tutorial", url: "https://docs.python.org/3/tutorial/" },
      { title: "MDN Web Docs — JavaScript", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
      { title: "Exercism — Code Practice", url: "https://exercism.org/" }
    ],
    assessmentType: "CODING"
  },
  DATABASE: {
    topics: ["SELECT & Filtering", "JOINs", "GROUP BY & Aggregation", "Subqueries & CTEs", "Indexes & Performance", "Normalization & Schema Design", "Transactions & Constraints", "NoSQL Fundamentals"],
    practice: ["Complete 15 SQL practice queries on this topic", "Design the schema for a small real-world problem", "Write JOIN + aggregation queries on a sample dataset", "Identify slow queries and add indexes"],
    resources: [
      { title: "SQLZoo — Interactive SQL", url: "https://sqlzoo.net/" },
      { title: "W3Schools — SQL Tutorial", url: "https://www.w3schools.com/sql/" },
      { title: "PG Exercises", url: "https://pgexercises.com/" }
    ],
    assessmentType: "TECHNICAL"
  },
  FRAMEWORK: {
    topics: ["Framework Core Concepts", "Routing & State", "Components & Reusability", "Data Fetching & APIs", "Authentication Patterns", "Testing Your App", "Deployment & Builds", "Performance Optimization"],
    practice: ["Build one small feature with the framework", "Wire up a real API and handle loading states", "Add tests for the critical paths", "Deploy a demo and share the link"],
    resources: [
      { title: "React Documentation", url: "https://react.dev/learn" },
      { title: "Next.js Learn", url: "https://nextjs.org/learn" },
      { title: "MDN — Client-side frameworks", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries" }
    ],
    assessmentType: "TECHNICAL"
  },
  CLOUD: {
    topics: ["Cloud Fundamentals", "Compute & Servers", "Storage & Databases in Cloud", "Networking & DNS", "Serverless & Functions", "CI/CD Pipelines", "Monitoring & Logging", "Cost & Security Basics"],
    practice: ["Deploy a small app to the cloud", "Set up a CI/CD pipeline for it", "Create a monitoring dashboard", "Document your architecture with a diagram"],
    resources: [
      { title: "AWS Skill Builder", url: "https://aws.amazon.com/training/" },
      { title: "Google Cloud Skills Boost", url: "https://www.cloudskillsboost.google/" },
      { title: "Azure Learn", url: "https://learn.microsoft.com/azure/" }
    ],
    assessmentType: "TECHNICAL"
  },
  DATA_AI: {
    topics: ["Data Cleaning with Pandas", "Exploratory Data Analysis", "Statistics for Data Science", "Data Visualization", "Supervised ML Basics", "Model Evaluation", "Feature Engineering", "AI/LLM Fundamentals"],
    practice: ["Analyze a real dataset end-to-end", "Build and evaluate a baseline ML model", "Create a clear visualization dashboard", "Write up your findings like a case study"],
    resources: [
      { title: "Kaggle Learn", url: "https://www.kaggle.com/learn" },
      { title: "DataCamp", url: "https://www.datacamp.com/" },
      { title: "CS50 AI — Harvard", url: "https://cs50.harvard.edu/ai/" }
    ],
    assessmentType: "TECHNICAL"
  },
  CYBERSECURITY: {
    topics: ["Security Fundamentals", "Network Security", "Web Application Security (OWASP)", "Cryptography Basics", "Threat Modeling", "Incident Response Basics", "Secure Coding", "Tools: Nmap, Burp Suite, Wireshark"],
    practice: ["Complete an OWASP Top 10 walkthrough", "Do a capture-the-flag challenge", "Audit a sample app for vulnerabilities", "Document a threat model for a small system"],
    resources: [
      { title: "TryHackMe", url: "https://tryhackme.com/" },
      { title: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/" },
      { title: "Cybrary", url: "https://www.cybrary.it/" }
    ],
    assessmentType: "TECHNICAL"
  },
  TOOLS: {
    topics: ["Git & Version Control", "Linux Command Line", "Docker & Containers", "CI/CD Basics", "Package Managers", "Debugging Tools", "API Testing (Postman)", "Documentation Practices"],
    practice: ["Complete a Git branching exercise", "Containerize a small app with Docker", "Write a script to automate a repetitive task", "Set up an API collection with tests"],
    resources: [
      { title: "Git — Official Docs", url: "https://git-scm.com/doc" },
      { title: "Docker — Getting Started", url: "https://docs.docker.com/get-started/" },
      { title: "The Linux Command Line", url: "https://linuxcommand.org/tlcl.php" }
    ],
    assessmentType: "TECHNICAL"
  },
  SOFT: {
    topics: ["Communication Fundamentals", "Structured Thinking", "Conflict Resolution", "Team Collaboration", "Presentation Skills", "Time Management", "Feedback & Growth Mindset", "Leadership Basics"],
    practice: ["Practice the STAR method with 3 stories", "Present a 5-minute topic to a friend", "Write a one-page structured summary of a project", "Do a mock HR interview"],
    resources: [
      { title: "Coursera — Improving Communication Skills", url: "https://www.coursera.org/learn/wharton-communication-skills" },
      { title: "Toastmasters Public Speaking", url: "https://www.toastmasters.org/" }
    ],
    assessmentType: "COMMUNICATION"
  },
  COMMUNICATION: {
    topics: ["Communication Fundamentals", "Structured Thinking", "STAR Method Storytelling", "Presentation Skills", "Concise Technical Explanations", "Active Listening", "Written Communication", "Mock Interview Practice"],
    practice: ["Practice the STAR method with 3 experiences", "Explain a technical concept in under 2 minutes", "Record yourself answering 3 common HR questions", "Do a mock interview with a peer"],
    resources: [
      { title: "Coursera — Communication Skills", url: "https://www.coursera.org/learn/wharton-communication-skills" },
      { title: "Interview Prep — STAR Method", url: "https://www.themuse.com/advice/star-interview-method" }
    ],
    assessmentType: "COMMUNICATION"
  },
  APTITUDE: {
    topics: ["Quantitative Basics", "Percentages, Ratios & Averages", "Time, Speed & Distance", "Permutations & Combinations", "Logical Reasoning", "Data Interpretation", "Verbal Reasoning", "Puzzle Practice"],
    practice: ["Solve 15 aptitude questions on this topic", "Time yourself — aim under 1 minute per question", "Review wrong answers and note the pattern", "Attempt the linked aptitude assessment"],
    resources: [
      { title: "IndiaBix — Aptitude", url: "https://www.indiabix.com/aptitude/questions-and-answers/" },
      { title: "GeeksforGeeks — Aptitude", url: "https://www.geeksforgeeks.org/aptitude-gq/" }
    ],
    assessmentType: "APTITUDE"
  },
  OTHER: {
    topics: ["Core Concepts", "Applied Practice", "Real-World Applications", "Advanced Topics", "Common Interview Questions", "Hands-On Mini Project", "Review & Consolidate", "Mock Assessment"],
    practice: ["Learn the core concepts with a trusted course", "Build a small hands-on project", "Attempt the linked assessment", "Review interview questions for this area"],
    resources: [
      { title: "Coursera", url: "https://www.coursera.org/" },
      { title: "Udemy", url: "https://www.udemy.com/" },
      { title: "YouTube Learning", url: "https://www.youtube.com/" }
    ],
    assessmentType: "TECHNICAL"
  }
};

const WEEKS_PER_STATUS: Record<string, number> = {
  CRITICAL_GAP: 2,
  MAJOR_GAP: 2,
  IMPROVE: 1,
  STRONG: 0
};

export const DIFFICULTY_PER_STATUS: Record<string, RoadmapTask["difficulty"]> = {
  CRITICAL_GAP: "HARD",
  MAJOR_GAP: "MEDIUM",
  IMPROVE: "EASY",
  STRONG: "MEDIUM"
};

/**
 * Generate a weekly roadmap from skill gaps. Deterministic and rule-based so it
 * works identically with or without an AI provider; the AI layer can refine it.
 */
export function generateRoadmap(evidence: RoadmapEvidence): RoadmapPlan {
  const { gaps, roleName, weeks, startDate, resourcesBySkill, resourcesByCategory, assessmentsBySkill, assessmentsByType } = evidence;

  const actionable = gaps
    .filter((g) => g.status !== "STRONG")
    .sort((a, b) => b.priority - a.priority || b.gap - a.gap);

  // Allocate weeks to top gaps, respecting the plan length.
  const queue: { gap: SkillGapResult; remaining: number }[] = [];
  let budget = weeks;
  for (const gap of actionable) {
    if (budget <= 0) break;
    const alloc = Math.min(WEEKS_PER_STATUS[gap.status] ?? 1, budget);
    if (alloc <= 0) continue;
    queue.push({ gap, remaining: alloc });
    budget -= alloc;
  }

  const items: RoadmapPlan["items"] = [];
  let week = 1;
  let topicIndex = 0;

  while (queue.length > 0 && week <= weeks) {
    const entry = queue.shift()!;
    const { gap } = entry;
    const template = CATEGORY_TEMPLATES[gap.category] ?? CATEGORY_TEMPLATES.OTHER;
    const topic = template.topics[topicIndex % template.topics.length];
    topicIndex++;

    const item = buildWeekItem({
      week,
      gap,
      topic,
      template,
      roleName,
      startDate,
      resourcesBySkill,
      resourcesByCategory,
      assessmentsBySkill,
      assessmentsByType
    });
    items.push(item);

    entry.remaining -= 1;
    if (entry.remaining > 0) queue.push(entry);
    week += 1;
  }

  // Optional final consolidation week
  if (week <= weeks) {
    const template = CATEGORY_TEMPLATES.OTHER;
    items.push({
      week,
      title: `Week ${week} — Mock Interview & Role Readiness`,
      objective: `Synthesize everything you've learned and validate readiness for ${roleName}.`,
      tasks: [
        "Attempt a full-length mock assessment under timed conditions",
        "Answer 5 common interview questions out loud",
        "Update your resume with this week's accomplishments",
        "Review remaining gaps and plan the next cycle"
      ],
      estimatedMinutes: 120,
      difficulty: "MEDIUM",
      resourceTitle: "Interview practice hub",
      resourceUrl: "/student/interview",
      assessmentId: assessmentsByType?.INTERVIEW?.[0]?.id
    });
  }

  return {
    title: `${roleName || "Career"} Preparation Roadmap`,
    weeks,
    items
  };
}

function buildWeekItem(params: {
  week: number;
  gap: SkillGapResult;
  topic: string;
  template: CategoryTemplate;
  roleName: string;
  startDate: Date;
  resourcesBySkill?: Record<string, RoadmapResource[]>;
  resourcesByCategory?: Record<string, RoadmapResource[]>;
  assessmentsBySkill?: Record<string, { id: string; title: string }[]>;
  assessmentsByType?: Record<string, { id: string; title: string }[]>;
}): RoadmapPlan["items"][number] {
  const { week, gap, topic, template, roleName, startDate } = params;
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + (week - 1) * 7 + 6);

  const resources = [
    ...(params.resourcesBySkill?.[gap.skillId] ?? []),
    ...(params.resourcesByCategory?.[gap.category] ?? [])
  ];
  const fallback = template.resources;
  const resource = (resources.length > 0 ? resources : fallback)[(week - 1) % Math.max(1, resources.length > 0 ? resources.length : fallback.length)];

  const assessment = params.assessmentsBySkill?.[gap.skillId]?.[0] ??
    (template.assessmentType ? params.assessmentsByType?.[template.assessmentType]?.[0] : undefined);

  return {
    week,
    skillId: gap.skillId,
    skillName: gap.skillName,
    title: `Week ${week} — ${gap.skillName}: ${topic}`,
    objective: `Close the ${Math.max(0, gap.gap)}% gap in ${gap.skillName} for ${roleName} (currently ${gap.currentScore}%, target ${gap.requiredScore}%).`,
    tasks: template.practice,
    estimatedMinutes: 90 + ((week % 3) * 30),
    difficulty: DIFFICULTY_PER_STATUS[gap.status] ?? "MEDIUM",
    resourceUrl: resource?.url,
    resourceTitle: resource?.title,
    assessmentId: assessment?.id
  };
}
