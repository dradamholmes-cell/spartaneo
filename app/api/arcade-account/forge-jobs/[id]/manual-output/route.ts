import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { characterForgeJobs } from "../../../../../../db/schema";
import { getSessionUser } from "../../../../../lib/arcade-auth";
import { finalizeForgeGlb } from "../../../../../lib/forge-finalize";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });
  if (user.isGuest) return Response.json({ error: "ACCOUNT_REQUIRED_FOR_FORGE" }, { status: 403 });

  const { id } = await context.params;
  const rows = await getDb()
    .select()
    .from(characterForgeJobs)
    .where(and(eq(characterForgeJobs.id, id), eq(characterForgeJobs.userId, user.id)))
    .limit(1);
  const job = rows[0];
  if (!job) return Response.json({ error: "FORGE_JOB_NOT_FOUND" }, { status: 404 });
  if (job.status === "ready") return Response.json({ error: "FORGE_JOB_ALREADY_READY" }, { status: 409 });

  const bytes = await request.arrayBuffer();
  try {
    const result = await finalizeForgeGlb(id, user.id, bytes, job.providerJobId);
    if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: "STORAGE_NOT_CONFIGURED", message: error instanceof Error ? error.message : "R2 unavailable" },
      { status: 503 },
    );
  }
}
