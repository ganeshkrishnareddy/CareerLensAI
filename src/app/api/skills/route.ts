import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  const [skills, studentSkills] = await Promise.all([
    prisma.skill.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.studentSkill.findMany({ where: { userId: session.id }, include: { skill: true } })
  ]);
  return NextResponse.json({ skills, studentSkills });
}
