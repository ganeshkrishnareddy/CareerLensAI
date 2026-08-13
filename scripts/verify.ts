import { PrismaClient } from "@prisma/client";
async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUniqueOrThrow({ where: { email: "student@careerlens.ai" } });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: user.id } });
  const role = await prisma.role.findUniqueOrThrow({ where: { id: profile.targetRoleId! } });
  const gaps = await prisma.skillGap.findMany({ where: { userId: user.id, roleId: role.id }, include: { skill: true }, orderBy: { priority: "desc" } });
  const snap = await prisma.readinessSnapshot.findFirstOrThrow({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const roadmap = await prisma.roadmap.findFirst({ where: { userId: user.id }, include: { items: true } });
  console.log(`Student: ${user.name}`);
  console.log(`Target role: ${role.name}`);
  console.log(`Readiness: ${snap.overall}%  (snapshots: ${await prisma.readinessSnapshot.count({ where: { userId: user.id } })})`);
  console.log(`Gaps (top 3):`);
  for (const g of gaps.slice(0, 3)) console.log(`  ${g.skill.name}: ${g.currentScore}% vs ${g.requiredScore}% → ${g.status} (priority ${g.priority})`);
  console.log(`Roadmap: ${roadmap?.title} — ${roadmap?.items.length} items, ${roadmap?.progress}% complete`);
  console.log(`Role matches: ${await prisma.roleMatch.count({ where: { userId: user.id } })}`);
  console.log(`Notifications: ${await prisma.notification.count({ where: { userId: user.id } })}`);
  console.log(`Users in DB: ${await prisma.user.count()}`);
  await prisma.$disconnect();
}
main();
