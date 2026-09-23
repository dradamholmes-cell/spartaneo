import { and, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { arcadeCharacters, characterForgeJobs } from "../../db/schema";
import { forgeOutputKey, putArcadeFile } from "./arcade-files";

const MAX_GLB_BYTES = 75 * 1024 * 1024;

export function validateGlb(bytes: ArrayBuffer) {
  if (!bytes.byteLength) return "EMPTY_GLB";
  if (bytes.byteLength > MAX_GLB_BYTES) return "GLB_TOO_LARGE";
  if (bytes.byteLength < 12) return "INVALID_GLB";
  const view = new DataView(bytes);
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const version = view.getUint32(4, true);
  const declaredLength = view.getUint32(8, true);
  if (magic !== "glTF" || version !== 2 || declaredLength !== bytes.byteLength) return "INVALID_GLB";
  return null;
}

export async function finalizeForgeGlb(jobId: string, userId: string, bytes: ArrayBuffer, providerJobId?: string | null) {
  const invalid = validateGlb(bytes);
  if (invalid) return { error: invalid } as const;

  const db = getDb();
  const rows = await db
    .select()
    .from(characterForgeJobs)
    .where(and(eq(characterForgeJobs.id, jobId), eq(characterForgeJobs.userId, userId)))
    .limit(1);
  const job = rows[0];
  if (!job) return { error: "FORGE_JOB_NOT_FOUND" } as const;

  const key = forgeOutputKey(userId, jobId);
  await putArcadeFile(key, bytes, "model/gltf-binary");
  const now = new Date();
  let characterId = job.characterId;
  if (!characterId) {
    characterId = crypto.randomUUID();
    await db.insert(arcadeCharacters).values({
      id: characterId,
      userId,
      name: job.requestedName || "New Character",
      source: "tencent-hunyuan",
      status: "ready",
      presetKey: null,
      glbUrl: `/api/arcade-account/forge-jobs/${jobId}/output`,
      previewUrl: null,
      providerJobId: providerJobId || job.providerJobId,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db
      .update(arcadeCharacters)
      .set({
        status: "ready",
        glbUrl: `/api/arcade-account/forge-jobs/${jobId}/output`,
        providerJobId: providerJobId || job.providerJobId,
        updatedAt: now,
      })
      .where(and(eq(arcadeCharacters.id, characterId), eq(arcadeCharacters.userId, userId)));
  }

  await db
    .update(characterForgeJobs)
    .set({
      characterId,
      providerJobId: providerJobId || job.providerJobId,
      outputGlbKey: key,
      status: "ready",
      finishedAt: now,
      bridgeTokenHash: null,
      bridgeTokenExpiresAt: null,
      errorCode: null,
      errorMessage: null,
      updatedAt: now,
    })
    .where(and(eq(characterForgeJobs.id, jobId), eq(characterForgeJobs.userId, userId)));

  return { ok: true, characterId, key, bytes: bytes.byteLength } as const;
}
