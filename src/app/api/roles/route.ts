import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  await requireSession();
  const roles = await prisma.role.findMany({
    where: { isActive: true },
    include: { roleSkills: { include: { skill: true } } },
    orderBy: { name: "asc" }
  });
  return NextResponse.json({ roles });
}
