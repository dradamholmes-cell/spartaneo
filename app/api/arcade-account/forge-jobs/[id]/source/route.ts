import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { characterForgeJobs } from "../../../../../../db/schema";
import { deleteArcadeFile, forgeSourceKey, putArcadeFile } from "../../../../../lib/arcade-files";
import { getSessionUser } from "../../../../../lib/arcade-auth";

const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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
  if (["generating", "downloading", "ready"].includes(job.status)) {
    return Response.json({ error: "FORGE_JOB_ALREADY_STARTED" }, { status: 409 });
  }

  const type = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const extension = TYPES[type];
  if (!extension) return Response.json({ error: "UNSUPPORTED_IMAGE_TYPE" }, { status: 415 });

  const declared = Number(request.headers.get("content-length") || "0");
  if (declared > MAX_SOURCE_BYTES) return Response.json({ error: "IMAGE_TOO_LARGE" }, { status: 413 });
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength) return Response.json({ error: "EMPTY_IMAGE" }, { status: 400 });
  if (bytes.byteLength > MAX_SOURCE_BYTES) return Response.json({ error: "IMAGE_TOO_LARGE" }, { status: 413 });

  const key = forgeSourceKey(user.id, id, extension);
  try {
    if (job.sourceImageKey && job.sourceImageKey !== key) await deleteArcadeFile(job.sourceImageKey);
    await putArcadeFile(key, bytes, type);
  } catch (error) {
    const message = error instanceof Error ? error.message : "R2 unavailable";
    return Response.json({ error: "STORAGE_NOT_CONFIGURED", message }, { status: 503 });
  }

  const now = new Date();
  await db
    .update(characterForgeJobs)
    .set({
      sourceImageKey: key,
      status: "source_ready",
      errorCode: null,
      errorMessage: null,
      updatedAt: now,
    })
    .where(and(eq(characterForgeJobs.id, id), eq(characterForgeJobs.userId, user.id)));

  return Response.json({ ok: true, jobId: id, status: "source_ready", bytes: bytes.byteLength });
}
