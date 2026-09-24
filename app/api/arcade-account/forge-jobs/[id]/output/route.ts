import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { characterForgeJobs } from "../../../../../../db/schema";
import { getArcadeFile } from "../../../../../lib/arcade-files";
import { getSessionUser } from "../../../../../lib/arcade-auth";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });
  const { id } = await context.params;
  const rows = await getDb()
    .select()
    .from(characterForgeJobs)
    .where(and(eq(characterForgeJobs.id, id), eq(characterForgeJobs.userId, user.id)))
    .limit(1);
  const job = rows[0];
  if (!job) return Response.json({ error: "FORGE_JOB_NOT_FOUND" }, { status: 404 });
  if (!job.outputGlbKey) return Response.json({ error: "GLB_NOT_READY" }, { status: 404 });
  try {
    const file = await getArcadeFile(job.outputGlbKey);
    if (!file) return Response.json({ error: "GLB_NOT_FOUND" }, { status: 404 });
    return new Response(file.body, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Disposition": `inline; filename="${id}.glb"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return Response.json(
      { error: "STORAGE_NOT_CONFIGURED", message: error instanceof Error ? error.message : "R2 unavailable" },
      { status: 503 },
    );
  }
}
