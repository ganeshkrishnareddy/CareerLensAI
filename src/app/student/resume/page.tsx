import { FileSearch, UploadCloud } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, EmptyState, Badge, statusBadgeColor } from "@/components/ui/ui";
import { formatDate } from "@/lib/utils";
import { ResumeUploader } from "./client";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const session = await requireRole("STUDENT");
  const resumes = await prisma.resume.findMany({
    where: { userId: session.id },
    include: { extractions: { orderBy: { createdAt: "desc" } } },
    orderBy: { uploadedAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Resume Analysis</h1>
        <p className="mt-1 text-sm text-ink-500">Upload your resume — CareerLens extracts skills, education and certifications with confidence scores. You confirm everything before it touches your profile.</p>
      </div>

      <ResumeUploader />

      <div>
        <h2 className="mb-3 text-[15px] font-bold text-ink-900">Your resumes</h2>
        {resumes.length === 0 ? (
          <EmptyState
            icon={<UploadCloud className="h-8 w-8" />}
            title="No resumes uploaded yet"
            description="Upload a PDF or DOCX to run the AI-assisted extraction pipeline."
          />
        ) : (
          <div className="space-y-3">
            {resumes.map((r) => {
              const extraction = r.extractions[0];
              const data = extraction ? safeJsonParse<{ skills?: { name: string; confidence: number }[] }>(extraction.data, {}) : null;
              return (
                <Card key={r.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <FileSearch className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-ink-900">{r.fileName}</p>
                      <p className="text-[11px] text-ink-400">
                        {r.fileType} · {(r.fileSize / 1024).toFixed(0)} KB · uploaded {formatDate(r.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {data?.skills && (
                      <span className="text-xs text-ink-500">{data.skills.length} skills extracted</span>
                    )}
                    <Badge color={statusBadgeColor(r.status)}>{r.status}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
