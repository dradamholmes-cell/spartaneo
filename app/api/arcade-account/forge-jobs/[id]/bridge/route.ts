import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { characterForgeJobs, tencentConnections } from "../../../../../../db/schema";
import { getSessionUser } from "../../../../../lib/arcade-auth";
import { mintForgeBridgeToken } from "../../../../../lib/forge-bridge";

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
  if (!job.sourceImageKey) return Response.json({ error: "SOURCE_IMAGE_REQUIRED" }, { status: 409 });
  if (job.status === "ready") return Response.json({ error: "FORGE_JOB_ALREADY_READY" }, { status: 409 });

  const connectionRows = await db
    .select()
    .from(tencentConnections)
    .where(eq(tencentConnections.userId, user.id))
    .limit(1);
  const now = new Date();
  const sessionRef = connectionRows[0]?.sessionRef || crypto.randomUUID();
  await db
    .insert(tencentConnections)
    .values({
      userId: user.id,
      status: connectionRows[0]?.status === "connected" ? "connected" : "pending_login",
      sessionRef,
      helperMode: "browser_helper",
      lastCheckedAt: now,
      needsAttentionReason: connectionRows[0]?.status === "connected" ? null : "Tencent login may be required in the helper tab.",
      createdAt: connectionRows[0]?.createdAt || now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: tencentConnections.userId,
      set: {
        sessionRef,
        helperMode: "browser_helper",
        lastCheckedAt: now,
        updatedAt: now,
      },
    });

  const bridge = await mintForgeBridgeToken(id, user.id);
  await db
    .update(characterForgeJobs)
    .set({
      status: "waiting_for_tencent",
      errorCode: null,
      errorMessage: null,
      updatedAt: now,
    })
    .where(and(eq(characterForgeJobs.id, id), eq(characterForgeJobs.userId, user.id)));

  return Response.json({
    job: {
      id,
      requestedName: job.requestedName,
      provider: "tencent-hunyuan",
      providerModel: "v3.1",
      inputMode: "single_image",
      faceTarget: 50000,
      outputFormat: "glb",
      status: "waiting_for_tencent",
    },
    tencent: {
      sessionRef,
      status: connectionRows[0]?.status === "connected" ? "connected" : "pending_login",
    },
    bridge: {
      token: bridge.token,
      expiresAt: bridge.expiresAt.toISOString(),
      sourceEndpoint: `/api/forge-bridge/jobs/${id}/source`,
      statusEndpoint: `/api/forge-bridge/jobs/${id}/status`,
      outputEndpoint: `/api/forge-bridge/jobs/${id}/output`,
    },
  });
}
