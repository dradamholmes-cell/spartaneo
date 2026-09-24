import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { arcadeCharacters, arcadeUsers, characterForgeJobs } from "../../../../../db/schema";
import { deleteArcadeFile } from "../../../../lib/arcade-files";
import { getSessionUser } from "../../../../lib/arcade-auth";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });
  const { id } = await context.params;
  const db = getDb();
  const rows = await db
    .select()
    .from(arcadeCharacters)
    .where(and(eq(arcadeCharacters.id, id), eq(arcadeCharacters.userId, user.id)))
    .limit(1);
  const character = rows[0];
  if (!character) return Response.json({ error: "CHARACTER_NOT_FOUND" }, { status: 404 });

  const jobs = await db
    .select()
    .from(characterForgeJobs)
    .where(and(eq(characterForgeJobs.characterId, id), eq(characterForgeJobs.userId, user.id)));

  const storageKeys = new Set<string>();
  for (const job of jobs) {
    if (job.sourceImageKey) storageKeys.add(job.sourceImageKey);
    if (job.outputGlbKey) storageKeys.add(job.outputGlbKey);
  }

  if (storageKeys.size) {
    try {
      for (const key of storageKeys) await deleteArcadeFile(key);
    } catch (error) {
      return Response.json(
        { error: "STORAGE_CLEANUP_FAILED", message: error instanceof Error ? error.message : "R2 unavailable" },
        { status: 503 },
      );
    }
  }

  await db.delete(characterForgeJobs).where(and(eq(characterForgeJobs.characterId, id), eq(characterForgeJobs.userId, user.id)));
  await db.delete(arcadeCharacters).where(and(eq(arcadeCharacters.id, id), eq(arcadeCharacters.userId, user.id)));
  if (user.activeCharacterId === id) {
    await db
      .update(arcadeUsers)
      .set({ activeCharacterId: null, updatedAt: new Date() })
      .where(eq(arcadeUsers.id, user.id));
  }
  return Response.json({ ok: true, deletedFiles: storageKeys.size, deletedJobs: jobs.length });
}
