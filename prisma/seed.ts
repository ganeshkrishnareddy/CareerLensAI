import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SKILL_CATALOG, ROLE_CATALOG, levelToScore } from "../src/lib/catalog";
import { seededRandom } from "../src/lib/utils";
import { ASSESSMENT_SEEDS, LEARNING_RESOURCES, INTERVIEW_QUESTION_SEEDS, OPPORTUNITY_SEEDS } from "./seed-data";
import { DEMO_CREDENTIALS } from "../src/lib/auth";

const prisma = new PrismaClient();
const rand = seededRandom(42);

// Demo student — the canonical "critical DSA gap" story
const DEMO_STUDENT = {
  name: "Aarav Sharma",
  email: DEMO_CREDENTIALS.student.email,
  skills: [
    { name: "Python", score: 80, level: 4 },
    { name: "Data Structures & Algorithms", score: 40, level: 2 },
    { name: "SQL", score: 45, level: 2 },
    { name: "DBMS", score: 60, level: 3 },
    { name: "Communication", score: 70, level: 3 },
    { name: "Git", score: 65, level: 3 },
    { name: "Object Oriented Programming", score: 60, level: 3 },
    { name: "Problem Solving", score: 70, level: 3 },
    { name: "Quantitative Aptitude", score: 68, level: 3 },
    { name: "Logical Reasoning", score: 65, level: 3 },
    { name: "REST APIs", score: 55, level: 3 },
    { name: "React", score: 45, level: 2 }
  ]
};

const FIRST_NAMES = ["Priya", "Rahul", "Sneha", "Vikram", "Ananya", "Rohan", "Kavya", "Arjun", "Divya", "Nikhil", "Ishita", "Karan", "Meera", "Aditya", "Pooja", "Siddharth", "Tanvi", "Yash", "Neha", "Aman", "Ritika", "Saurabh", "Pallavi", "Harsh"];
const LAST_NAMES = ["Patel", "Singh", "Reddy", "Iyer", "Gupta", "Sharma", "Nair", "Verma", "Rao", "Kulkarni", "Das", "Menon", "Joshi", "Mehta", "Bose", "Chopra", "Pillai", "Agarwal", "Desai", "Khan", "Bhat", "Malhotra", "Saxena", "Tiwari"];

async function main() {
  console.log("🌱 Seeding CareerLens AI…");

  // ── Wipe in dependency order ──
  await prisma.auditLog.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.roadmapItem.deleteMany();
  await prisma.roadmap.deleteMany();
  await prisma.skillGap.deleteMany();
  await prisma.roleMatch.deleteMany();
  await prisma.readinessSnapshot.deleteMany();
  await prisma.skillScore.deleteMany();
  await prisma.studentSkill.deleteMany();
  await prisma.assessmentAnswer.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.questionSkill.deleteMany();
  await prisma.question.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.resumeExtraction.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.project.deleteMany();
  await prisma.aiMessage.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.facultyNote.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.roleSkill.deleteMany();
  await prisma.role.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.learningResource.deleteMany();
  await prisma.interviewQuestion.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.platformSetting.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.department.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.user.deleteMany();

  // ── Institution ──
  const institution = await prisma.institution.create({
    data: { name: "Kairo Institute of Technology", code: "KIT", address: "Hyderabad, Telangana", website: "https://kairo.example.edu" }
  });
  const depts = await Promise.all([
    prisma.department.create({ data: { institutionId: institution.id, name: "Computer Science & Engineering", code: "CSE" } }),
    prisma.department.create({ data: { institutionId: institution.id, name: "Information Technology", code: "IT" } }),
    prisma.department.create({ data: { institutionId: institution.id, name: "Electronics & Communication", code: "ECE" } }),
    prisma.department.create({ data: { institutionId: institution.id, name: "Mechanical Engineering", code: "ME" } })
  ]);
  const batches = [];
  for (const dept of depts) {
    batches.push(
      await prisma.batch.create({ data: { departmentId: dept.id, name: "2026", year: 2026, startYear: 2022, endYear: 2026 } }),
      await prisma.batch.create({ data: { departmentId: dept.id, name: "2027", year: 2027, startYear: 2023, endYear: 2027 } })
    );
  }

  // ── Users (staff) ──
  const hash = await bcrypt.hash(DEMO_CREDENTIALS.admin.password, 10);
  const [admin, faculty] = await Promise.all([
    prisma.user.create({ data: { name: "Prof. Meera Krishnan", email: DEMO_CREDENTIALS.admin.email, passwordHash: hash, role: "ADMIN", emailVerified: true } }),
    prisma.user.create({ data: { name: "Prof. Ramesh Iyer", email: DEMO_CREDENTIALS.faculty.email, passwordHash: hash, role: "FACULTY", emailVerified: true } })
  ]);
  await prisma.profile.create({ data: { userId: admin.id, college: "Kairo Institute of Technology", university: "Kairo University" } });
  await prisma.profile.create({ data: { userId: faculty.id, college: "Kairo Institute of Technology", university: "Kairo University", departmentId: depts[0].id, batchId: batches[0].id } });

  // ── Skills ──
  const skillNames = new Map<string, string>(); // name -> id
  const allSkills = new Map<string, { name: string; category: string }>();
  for (const s of SKILL_CATALOG) allSkills.set(s.name, { name: s.name, category: s.category });
  for (const role of ROLE_CATALOG) {
    for (const rs of role.skills) {
      if (!allSkills.has(rs.skill)) {
        allSkills.set(rs.skill, { name: rs.skill, category: guessCategory(rs.skill) });
      }
    }
  }
  for (const q of ASSESSMENT_SEEDS.flatMap((a) => a.questions)) {
    for (const s of q.skills) {
      if (!allSkills.has(s.name)) allSkills.set(s.name, { name: s.name, category: guessCategory(s.name) });
    }
  }
  for (const s of allSkills.values()) {
    const created = await prisma.skill.create({ data: s });
    skillNames.set(created.name, created.id);
  }

  // ── Roles + requirements ──
  for (const role of ROLE_CATALOG) {
    const created = await prisma.role.create({
      data: { name: role.name, description: role.description, category: role.category }
    });
    for (const rs of role.skills) {
      const skillId = skillNames.get(rs.skill);
      if (!skillId) continue;
      await prisma.roleSkill.create({
        data: {
          roleId: created.id,
          skillId,
          requirement: rs.requirement,
          minProficiency: rs.minProficiency,
          weight: rs.weight
        }
      });
    }
  }

  // ── Assessments ──
  for (const seed of ASSESSMENT_SEEDS) {
    const role = seed.roleName ? await prisma.role.findFirst({ where: { name: seed.roleName } }) : null;
    const skill = seed.skillName ? await prisma.skill.findUnique({ where: { name: seed.skillName } }) : null;
    const assessment = await prisma.assessment.create({
      data: {
        title: seed.title,
        description: seed.description,
        type: seed.type,
        difficulty: seed.difficulty,
        durationMinutes: seed.durationMinutes,
        passScore: seed.passScore,
        roleId: role?.id ?? null,
        skillId: skill?.id ?? null,
        createdBy: admin.id
      }
    });
    for (const q of seed.questions) {
      const question = await prisma.question.create({
        data: {
          assessmentId: assessment.id,
          text: q.text,
          type: q.type,
          options: (q.options as object) ?? undefined,
          correctAnswer: q.correctAnswer as object,
          marks: q.marks,
          difficulty: q.difficulty,
          explanation: q.explanation
        }
      });
      for (const s of q.skills) {
        const skillId = skillNames.get(s.name);
        if (!skillId) continue;
        await prisma.questionSkill.create({
          data: { questionId: question.id, skillId, weight: s.weight ?? 1 }
        });
      }
    }
  }

  // ── Learning resources, interview questions, opportunities ──
  for (const r of LEARNING_RESOURCES) {
    const skillId = r.skillName ? skillNames.get(r.skillName) : null;
    await prisma.learningResource.create({
      data: { title: r.title, description: r.description, url: r.url, type: r.type, difficulty: r.difficulty, skillId: skillId ?? null }
    });
  }
  for (const q of INTERVIEW_QUESTION_SEEDS) {
    const role = q.roleName ? await prisma.role.findFirst({ where: { name: q.roleName } }) : null;
    const skill = q.skillName ? await prisma.skill.findUnique({ where: { name: q.skillName } }) : null;
    await prisma.interviewQuestion.create({
      data: {
        roleId: role?.id ?? null,
        skillId: skill?.id ?? null,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        sampleAnswer: q.sampleAnswer
      }
    });
  }
  for (const o of OPPORTUNITY_SEEDS) {
    const role = o.roleName ? await prisma.role.findFirst({ where: { name: o.roleName } }) : null;
    await prisma.opportunity.create({
      data: {
        roleId: role?.id ?? null,
        title: o.title,
        company: o.company,
        location: o.location,
        type: o.type,
        url: o.url,
        description: o.description,
        salaryRange: o.salaryRange
      }
    });
  }

  // ── Platform settings ──
  await prisma.platformSetting.create({
    data: {
      key: "readiness_weights",
      value: { technical: 25, coding: 20, aptitude: 10, communication: 15, interview: 10, projects: 10, resume: 10 }
    }
  });

  // ── Students ──
  const roles = await prisma.role.findMany({ where: { isActive: true } });
  const allRoles = roles.filter((r) => !r.isCustom);
  const roleByName = new Map(allRoles.map((r) => [r.name, r]));

  const students: { name: string; email: string; targetRoleName: string; base: number; noise: number; isDemo?: boolean }[] = [
    { name: DEMO_STUDENT.name, email: DEMO_CREDENTIALS.student.email, targetRoleName: "Software Developer", base: 0, noise: 0, isDemo: true }
  ];
  FIRST_NAMES.forEach((fname, i) => {
    const lname = LAST_NAMES[i % LAST_NAMES.length];
    students.push({
      name: `${fname} ${lname}`,
      email: `${fname.toLowerCase()}.${lname.toLowerCase()}${i + 1}@kairo.example.edu`,
      targetRoleName: allRoles[Math.floor(rand() * allRoles.length)].name,
      base: 35 + Math.floor(rand() * 45),
      noise: Math.floor(rand() * 18)
    });
  });

  const studentUserIds: string[] = [];

  for (const [idx, student] of students.entries()) {
    const role = roleByName.get(student.targetRoleName);
    if (!role) continue;
    const dept = depts[Math.floor(rand() * depts.length)];
    const batch = batches.filter((b) => b.departmentId === dept.id)[Math.floor(rand() * 2)];

    const user = await prisma.user.create({
      data: {
        name: student.name,
        email: student.email,
        passwordHash: hash,
        role: "STUDENT",
        emailVerified: true
      }
    });
    studentUserIds.push(user.id);

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        institutionId: institution.id,
        departmentId: dept.id,
        batchId: batch.id,
        phone: `9${String(100000000 + Math.floor(rand() * 899999999))}`,
        college: "Kairo Institute of Technology",
        university: "Kairo University",
        graduationYear: batch.year,
        cgpa: Math.round((6.2 + rand() * 3.2) * 100) / 100,
        location: ["Hyderabad", "Bengaluru", "Pune", "Chennai", "Mumbai"][Math.floor(rand() * 5)],
        targetRoleId: role.id,
        onboardingCompleted: true,
        onboardingStep: 7,
        bio: `${student.name} — ${role.name} aspirant`
      }
    });
    void profile;

    // Skills: derived from role requirements with gaps
    const roleSkills = await prisma.roleSkill.findMany({ where: { roleId: role.id }, include: { skill: true } });
    const skillsToAdd: { skillId: string; level: number; score: number; source: string }[] = [];
    for (const rs of roleSkills) {
      let score: number;
      if (student.isDemo) {
        const demo = DEMO_STUDENT.skills.find((s) => s.name === rs.skill.name);
        score = demo ? demo.score : rs.minProficiency - 25;
      } else {
        const roll = rand();
        if (roll < 0.3) score = rs.minProficiency + 5 + Math.floor(rand() * 15); // strong
        else if (roll < 0.65) score = rs.minProficiency - Math.floor(rand() * 15); // near
        else score = Math.max(10, rs.minProficiency - 20 - Math.floor(rand() * 30)); // gap
      }
      score = Math.max(10, Math.min(95, score));
      skillsToAdd.push({ skillId: rs.skillId, level: scoreToLevel(score), score, source: "SELF" });
    }
    // Extra non-role skills for realism
    const extraNames = student.isDemo
      ? ["React", "REST APIs", "Quantitative Aptitude", "Logical Reasoning"]
      : ["Git", "Communication", "Quantitative Aptitude", "Problem Solving"];
    for (const name of extraNames) {
      const skillId = skillNames.get(name);
      if (!skillId || skillsToAdd.some((s) => s.skillId === skillId)) continue;
      const score = student.isDemo
        ? (DEMO_STUDENT.skills.find((s) => s.name === name)?.score ?? 60)
        : Math.max(20, Math.min(90, student.base + Math.floor(rand() * 30)));
      skillsToAdd.push({ skillId, level: scoreToLevel(score), score, source: "SELF" });
    }
    await prisma.studentSkill.createMany({ data: skillsToAdd.map((s) => ({ ...s, userId: user.id })) });
    // Skill history (a few weeks of progress)
    for (const s of skillsToAdd.slice(0, 6)) {
      const base = Math.max(10, s.score - 8 - Math.floor(rand() * 10));
      for (const week of [1, 2, 3]) {
        await prisma.skillScore.create({
          data: {
            userId: user.id,
            skillId: s.skillId,
            score: Math.min(100, base + week * 4 + Math.floor(rand() * 5)),
            source: "SELF",
            snapshotAt: new Date(Date.now() - (4 - week) * 7 * 86400000)
          }
        });
      }
    }

    // Projects + certifications
    const techOptions = ["Python", "JavaScript", "React", "SQL", "Node.js", "Flutter", "Machine Learning", "Docker"];
    const projectCount = student.isDemo ? 3 : 1 + Math.floor(rand() * 2);
    for (let p = 0; p < projectCount; p++) {
      const techs: string[] = [];
      const techCount = 2 + Math.floor(rand() * 2);
      for (let t = 0; t < techCount; t++) {
        const tName = techOptions[Math.floor(rand() * techOptions.length)];
        if (!techs.includes(tName)) techs.push(tName);
      }
      await prisma.project.create({
        data: {
          userId: user.id,
          name: student.isDemo
            ? ["Placement Prep Tracker", "E-Commerce REST API", "Campus Events Portal"][p]
            : `${["Student", "Library", "Attendance", "Chat", "Expense", "E-Commerce"][Math.floor(rand() * 6)]} Management System ${p + 1}`,
          description: "A full project built during coursework with real-world use cases.",
          technologies: techs,
          role: "Developer",
          difficulty: ["BEGINNER", "INTERMEDIATE", "ADVANCED"][Math.floor(rand() * 3)],
          status: p === 0 ? "COMPLETED" : ["PLANNED", "IN_PROGRESS", "COMPLETED"][Math.floor(rand() * 3)],
          githubUrl: `https://github.com/${student.name.toLowerCase().replace(/\s/g, "")}/project-${p + 1}`
        }
      });
    }
    if (rand() > 0.4 || student.isDemo) {
      const certNames = student.isDemo
        ? ["Python for Everybody — Coursera", "SQL Basics — HackerRank"]
        : ["Introduction to Programming — NPTEL", "Data Science Foundations — Coursera"];
      for (const c of certNames) {
        await prisma.certification.create({
          data: { userId: user.id, name: c, issuer: c.includes("NPTEL") ? "NPTEL" : "Coursera", date: new Date("2025-06-01") }
        });
      }
    }

    // Resume (marker rows — real files are uploaded by users)
    await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: `${student.name.toLowerCase().replace(/\s/g, "-")}-resume.pdf`,
        fileType: "PDF",
        fileSize: 120000,
        filePath: "seed/marker",
        status: "UPLOADED"
      }
    });

    // Assessment attempts
    const attempts: { type: string; score: number }[] = student.isDemo
      ? [
          { type: "APTITUDE", score: 68 },
          { type: "COMMUNICATION", score: 72 },
          { type: "TECHNICAL", score: 45 },
          { type: "INTERVIEW", score: 60 }
        ]
      : [
          { type: "APTITUDE", score: 40 + Math.floor(rand() * 50) },
          { type: "COMMUNICATION", score: 45 + Math.floor(rand() * 45) }
        ];
    for (const [i, a] of attempts.entries()) {
      const assessment = await prisma.assessment.findFirst({ where: { type: a.type, isActive: true } });
      if (!assessment) continue;
      const questions = await prisma.question.findMany({ where: { assessmentId: assessment.id } });
      const total = questions.reduce((sum, q) => sum + q.marks, 0) || 1;
      const earned = Math.round((a.score / 100) * total);
      const attempt = await prisma.assessmentAttempt.create({
        data: {
          assessmentId: assessment.id,
          userId: user.id,
          status: "SUBMITTED",
          startedAt: new Date(Date.now() - (10 - i) * 3 * 86400000),
          submittedAt: new Date(Date.now() - (10 - i) * 3 * 86400000 + 900000),
          deadline: new Date(Date.now() - (10 - i) * 3 * 86400000 + assessment.durationMinutes * 60000),
          score: a.score,
          passed: a.score >= assessment.passScore,
          totalQuestions: questions.length,
          correctCount: questions.length ? Math.round((a.score / 100) * questions.length) : 0,
          timeTakenSeconds: assessment.durationMinutes * 45
        }
      });
      // Insert answers snapshot (marker answers)
      for (const q of questions.slice(0, 5)) {
        await prisma.assessmentAnswer.create({
          data: { attemptId: attempt.id, questionId: q.id, marksEarned: rand() > 0.4 ? q.marks : 0, isCorrect: rand() > 0.4 }
        });
      }
    }
  }

  // ── Run the analysis loop for every student (gaps, snapshots, matches, roadmaps) ──
  const { recomputeAnalysis } = await import("../src/services/analysis-service");
  const { ensureRoadmap, updateItemStatus } = await import("../src/services/roadmap-service");

  for (const userId of studentUserIds) {
    await recomputeAnalysis(userId, { refreshRoadmap: false });
    try {
      await ensureRoadmap(userId, 6);
    } catch {
      // role-less students are skipped
    }
  }

  // Demo student: build the "before" story — readiness snapshots over time + roadmap progress
  const demoUser = await prisma.user.findUnique({ where: { email: DEMO_CREDENTIALS.student.email } });
  if (demoUser) {
    const latest = await prisma.readinessSnapshot.findFirst({ where: { userId: demoUser.id }, orderBy: { createdAt: "desc" } });
    if (latest) {
      const mk = (overall: number, technical: number, coding: number, aptitude: number, communication: number, interview: number, projects: number, resume: number, daysAgo: number) =>
        prisma.readinessSnapshot.create({
          data: { userId: demoUser.id, overall, technical, coding, aptitude, communication, interview, projects, resume, createdAt: new Date(Date.now() - daysAgo * 86400000) }
        });
      await mk(55, 58, 46, 60, 66, 52, 62, 58, 28);
      await mk(61, 64, 52, 63, 68, 55, 65, 62, 14);
      await prisma.readinessSnapshot.update({
        where: { id: latest.id },
        data: { createdAt: new Date(Date.now() - 2 * 86400000) }
      });
    }

    // Roadmap progress: complete week 1 + a couple items
    const roadmap = await prisma.roadmap.findFirst({ where: { userId: demoUser.id }, include: { items: true } });
    if (roadmap) {
      const week1 = roadmap.items.filter((i) => i.week === 1);
      for (const item of week1.slice(0, 2)) {
        await updateItemStatus(demoUser.id, item.id, "COMPLETED");
      }
      const extra = roadmap.items.find((i) => i.week === 2);
      if (extra) await updateItemStatus(demoUser.id, extra.id, "IN_PROGRESS");
    }

    // Seed notifications for the demo journey
    const notifData = [
      { type: "SYSTEM", title: "Welcome to CareerLens AI 👋", message: "Your account is ready. Complete your profile to unlock your skill-gap analysis.", link: "/onboarding" },
      { type: "SKILL", title: "Skill gap detected: DSA", message: "Data Structures & Algorithms is a critical gap for Software Developer (40% vs 85% required).", link: "/student/gaps" },
      { type: "ROADMAP", title: "Roadmap week 1 complete", message: "Great momentum! Continue with Week 2 of your personalized plan.", link: "/student/roadmap" },
      { type: "ASSESSMENT", title: "Assessment result: Technical Foundations", message: "You scored 45%. Your skill profile has been updated — retake after focused practice.", link: "/student/assessments" },
      { type: "MILESTONE", title: "Readiness snapshot saved", message: "Your current placement readiness is tracked. Re-assess to see improvement.", link: "/student/readiness" }
    ];
    for (const n of notifData) {
      await prisma.notification.create({
        data: { userId: demoUser.id, type: n.type, title: n.title, message: n.message, link: n.link, read: n === notifData[0] }
      });
    }

    // AI coach history sample
    const conv = await prisma.aiConversation.create({ data: { userId: demoUser.id, title: "How do I improve my DSA?" } });
    await prisma.aiMessage.createMany({
      data: [
        { conversationId: conv.id, role: "USER", content: "How can I improve my DSA?" },
        {
          conversationId: conv.id,
          role: "ASSISTANT",
          source: "FALLBACK",
          content: "Here's a focused plan for Data Structures & Algorithms (40% → need 85%):\n\n1. **This week:** follow your roadmap's DSA module.\n2. **Practice:** use pattern-based practice on LeetCode/NeetCode.\n3. **Re-assess:** take the DSA Fundamentals Test. A good attempt updates your score automatically.\n\nConsistent 3–4 focused sessions usually close a gap this size."
        }
      ]
    });
  }

  console.log("✅ Seed complete.");
  console.log("");
  console.log("Demo accounts (password: CareerLens@2026):");
  console.log(`  Student: ${DEMO_CREDENTIALS.student.email}`);
  console.log(`  Faculty: ${DEMO_CREDENTIALS.faculty.email}`);
  console.log(`  Admin:   ${DEMO_CREDENTIALS.admin.email}`);
}

function scoreToLevel(score: number): number {
  if (score >= 90) return 5;
  if (score >= 70) return 4;
  if (score >= 50) return 3;
  if (score >= 30) return 2;
  return 1;
}

function guessCategory(name: string): string {
  const lower = name.toLowerCase();
  if (/object oriented|oop|dart|firebase/.test(lower)) return "PROGRAMMING";
  if (/communication|verbal|present/.test(lower)) return "COMMUNICATION";
  if (/reasoning|aptitude/.test(lower)) return "APTITUDE";
  return "OTHER";
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
