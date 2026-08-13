import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { SKILL_CATALOG } from "@/lib/catalog";
import { trackEvent } from "./analytics-service";
import { notify } from "./notifications-service";

export class ResumeError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE = Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024);

export interface ExtractionResult {
  skills: { name: string; category: string; occurrences: number; confidence: number }[];
  education: { degree: string; field?: string; institution?: string }[];
  contact: { email?: string; phone?: string; linkedin?: string; location?: string };
  projects: string[];
  certifications: string[];
  experience: string[];
  summary: string[];
}

export async function saveResumeFile(params: {
  userId: string;
  fileName: string;
  fileType: string;
  size: number;
  buffer: Buffer;
}): Promise<{ id: string; filePath: string }> {
  const ext = params.fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!["pdf", "docx"].includes(ext)) throw new ResumeError("Only PDF and DOCX resumes are supported.");
  if (params.size > MAX_SIZE) throw new ResumeError("File is too large (max 5 MB).");

  const dir = path.join(process.cwd(), process.env.RESUME_UPLOAD_DIR ?? "./uploads", params.userId);
  fs.mkdirSync(dir, { recursive: true });
  const safeName = `${Date.now()}-${params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(dir, safeName);
  fs.writeFileSync(filePath, params.buffer);

  const resume = await prisma.resume.create({
    data: {
      userId: params.userId,
      fileName: params.fileName,
      fileType: params.fileType === "application/pdf" ? "PDF" : "DOCX",
      fileSize: params.size,
      filePath
    }
  });

  await trackEvent(params.userId, "RESUME_UPLOAD", { fileName: params.fileName, size: params.size });
  return { id: resume.id, filePath };
}

export async function analyzeResumeText(userId: string, resumeId: string, text: string): Promise<ExtractionResult> {
  if (!text.trim()) throw new ResumeError("Could not extract any text from this file. Try a different resume.");

  const result = extractFromText(text);
  await prisma.resume.update({
    where: { id: resumeId },
    data: { extractedText: text.slice(0, 200_000), status: "EXTRACTED" }
  });
  await prisma.resumeExtraction.create({
    data: {
      resumeId,
      data: result as object,
      confidence: {
        skills: result.skills.length > 0 ? Math.min(0.95, 0.5 + result.skills.length * 0.05) : 0,
        education: result.education.length > 0 ? 0.8 : 0.2,
        contact: result.contact.email ? 0.9 : 0.3,
        projects: result.projects.length > 0 ? 0.7 : 0.3,
        certifications: result.certifications.length > 0 ? 0.8 : 0.3
      }
    }
  });

  return result;
}

export function extractFromText(text: string): ExtractionResult {
  const lower = text.toLowerCase();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // ── Skills ──
  const skillCounts: Record<string, { name: string; category: string; occurrences: number }> = {};
  const normalized = lower.replace(/[•▪●]/g, " ");
  for (const skill of SKILL_CATALOG) {
    const patterns = [skill.name, ...(skill.aliases ?? [])].filter((a) => a.length >= 2);
    let occurrences = 0;
    for (const p of patterns) {
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "gi");
      const matches = normalized.match(re);
      if (matches) occurrences += matches.length;
    }
    if (occurrences > 0 && occurrences <= 50) {
      skillCounts[skill.name] = {
        name: skill.name,
        category: skill.category,
        occurrences
      };
    }
  }
  const skills = Object.values(skillCounts)
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 40)
    .map((s) => ({
      ...s,
      confidence: Math.min(0.95, 0.5 + s.occurrences * 0.08)
    }));

  // ── Education ──
  const education: ExtractionResult["education"] = [];
  const degreeRe = /\b(B\.?Tech|B\.?E|B\.?Sc|M\.?Tech|M\.?E|M\.?Sc|BCA|MCA|MBA|M\.?Com|B\.?Com|Ph\.?D|BBA|B\.?A)\b/i;
  for (const line of lines.slice(0, 40)) {
    if (degreeRe.test(line) && line.length < 160) {
      const degree = line.match(degreeRe)?.[0].toUpperCase() ?? "";
      const fieldMatch = line.match(/\b(Computer Science|Information Technology|Electronics|Electrical|Mechanical|Civil|Data Science|AI|Artificial Intelligence|Mathematics|Physics|Commerce|Business)\b/i);
      const institution = line
        .replace(degreeRe, "")
        .replace(/\b(University|College|Institute|Institution|School|of|the|in|at)\b/gi, " ")
        .replace(/\d{4}/g, "")
        .replace(/[|•,\-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      education.push({
        degree: degree,
        field: fieldMatch?.[0] ?? undefined,
        institution: institution || undefined
      });
    }
  }

  // ── Contact ──
  const email = lower.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/)?.[0];
  const phone = text.match(/(\+?\d[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}(?!\d)/)?.[0]?.trim();
  const linkedin = lower.match(/linkedin\.com\/[a-z0-9-_/]+/)?.[0];
  const cityRe = /\b(Mumbai|Delhi|Bengaluru|Bangalore|Hyderabad|Chennai|Pune|Kolkata|Ahmedabad|Jaipur|Noida|Gurugram|Lucknow|Kochi|Indore|Bhopal|Patna|Nagpur|Vadodara|Coimbatore)\b/i;
  const location = text.match(cityRe)?.[0] ?? undefined;

  // ── Projects / experience / certifications / summary ──
  const projects: string[] = [];
  const experience: string[] = [];
  const certifications: string[] = [];
  const summary: string[] = [];

  const certRe = /\b(certification|certified|certificate|coursera|udemy|hackerrank|nptel|edx)\b/i;
  for (const line of lines) {
    if (line.length > 240) continue;
    if (certRe.test(line)) {
      certifications.push(line.slice(0, 160));
      continue;
    }
    if (/\b(project|built|developed|designed|implemented)\b/i.test(line) && /(github|app|web|system|platform|tool|app|website|api)/i.test(line)) {
      projects.push(line.slice(0, 160));
      continue;
    }
    if (/\b(experience|intern|worked at|worked as|internship)\b/i.test(line) && /\d{4}/.test(line)) {
      experience.push(line.slice(0, 160));
      continue;
    }
    if (/^(summary|objective|about|profile)\b/i.test(line) || (summary.length === 0 && line.length > 30 && !line.includes("."))) {
      summary.push(line.slice(0, 200));
    }
  }

  return {
    skills,
    education: education.slice(0, 3),
    contact: { email, phone, linkedin, location },
    projects: projects.slice(0, 5),
    certifications: certifications.slice(0, 5),
    experience: experience.slice(0, 5),
    summary: summary.slice(0, 2)
  };
}

/** Apply a confirmed extraction to the student's profile (never blindly overwrites). */
export async function applyExtraction(userId: string, resumeId: string, data: ExtractionResult) {
  const extraction = await prisma.resumeExtraction.findFirst({
    where: { resumeId, resume: { userId } },
    orderBy: { createdAt: "desc" }
  });
  if (!extraction) throw new ResumeError("No extraction found for this resume", 404);

  // Skills: only add if not already present; never lower existing scores.
  let addedSkills = 0;
  for (const s of data.skills) {
    const skill = await prisma.skill.findUnique({ where: { name: s.name } });
    if (!skill) continue;
    const existing = await prisma.studentSkill.findUnique({
      where: { userId_skillId: { userId, skillId: skill.id } }
    });
    if (!existing) {
      const level = s.confidence > 0.75 ? 3 : 2;
      await prisma.studentSkill.create({
        data: { userId, skillId: skill.id, level, score: s.confidence > 0.75 ? 65 : 50, source: "RESUME" }
      });
      addedSkills += 1;
    }
  }

  // Education: only set if profile missing university/college.
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const edu = data.education[0];
  if (profile && edu?.institution && !profile.college) {
    await prisma.profile.update({
      where: { userId },
      data: { college: edu.institution }
    });
  }

  // Certifications
  let addedCerts = 0;
  for (const c of data.certifications) {
    const name = c.replace(/[•▪●]/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
    if (!name) continue;
    const exists = await prisma.certification.findFirst({ where: { userId, name } });
    if (!exists) {
      await prisma.certification.create({ data: { userId, name } });
      addedCerts += 1;
    }
  }

  await prisma.resumeExtraction.update({ where: { id: extraction.id }, data: { status: "CONFIRMED", appliedAt: new Date() } });
  await prisma.resume.update({ where: { id: resumeId }, data: { status: "APPLIED" } });

  await notify({
    userId,
    type: "SYSTEM",
    title: "Resume applied to your profile",
    message: `${addedSkills} new skill${addedSkills === 1 ? "" : "s"}, ${addedCerts} certification${addedCerts === 1 ? "" : "s"} added from your resume.`,
    link: "/student/skills"
  });

  return { addedSkills, addedCerts };
}
