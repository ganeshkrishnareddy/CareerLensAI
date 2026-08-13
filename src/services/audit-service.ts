import { prisma } from "@/lib/db";

/** Write an entry to the audit log for sensitive administrative actions. */
export async function logAudit(
  actorId: string | null,
  action: string,
  entityType?: string | null,
  entityId?: string | null,
  details?: unknown
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType: entityType ?? undefined,
        entityId: entityId ?? undefined,
        details: (details as object) ?? undefined
      }
    });
  } catch (err) {
    console.error("audit log failed:", err);
  }
}
