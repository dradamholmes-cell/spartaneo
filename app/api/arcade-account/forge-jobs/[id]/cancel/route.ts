import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { characterForgeJobs } from "../../../../../../db/schema";
import { deleteArcadeFile } from "../../../../../lib/arcade-files";
import { getSessionUser } from "../../../../../lib/arcade-auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });
  if (user.isGuest) return Response.json({ error: "ACCOUNT_REQUIRED_FOR_FORGE" }, { status: 403 });

  const { id } = await context.params;
  const db = getDb();
  const rows = await db
    .select()
    .from(characterForgeJobs)
    .where(and(eq(characterForgeJobs.id, id), eq(characterForgeJobs.userId, user.id)))
    .limit(1);
  const job = rows[0];
  if (!job) return Response.json({ error: "FORGE_JOB_NOT_FOUND" }, { status: 404 });
  if (job.status === "ready") {
    return Response.json({ error: "READY_CHARACTER_MUST_BE_DELETED_FROM_LIBRARY" }, { status: 409 });
  }

  let sourceDeleted = false;
  if (job.sourceImageKey) {
    try {
      await deleteArcadeFile(job.sourceImageKey);
      sourceDeleted = true;
    } catch {
      // Cancellation should still revoke the bridge even if storage cleanup is temporarily unavailable.
    }
  }

  const now = new Date();
  await db
    .update(characterForgeJobs)
    .set({
      status: "cancelled",
      sourceImageKey: sourceDeleted ? null : job.sourceImageKey,
      bridgeTokenHash: null,
      bridgeTokenExpiresAt: null,
      errorCode: null,
      errorMessage: null,
      finishedAt: now,
      updatedAt: now,
    })
    .where(and(eq(characterForgeJobs.id, id), eq(characterForgeJobs.userId, user.id)));

  return Response.json({ ok: true, jobId: id, status: "cancelled", sourceDeleted });
}
