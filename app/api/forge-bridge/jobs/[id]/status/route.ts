import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { characterForgeJobs, tencentConnections } from "../../../../../../db/schema";
import { bearerToken, verifyForgeBridgeToken } from "../../../../../lib/forge-bridge";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowed = new Set([
  "pending_login",
  "connected",
  "uploading",
  "generating",
  "downloading",
  "daily_limit",
  "needs_attention",
  "failed",
]);

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await verifyForgeBridgeToken(id, bearerToken(request));
  if (!job) return Response.json({ error: "INVALID_OR_EXPIRED_BRIDGE_TOKEN" }, { status: 401, headers: cors });

  let body: { status?: string; providerJobId?: string; errorCode?: string; errorMessage?: string } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "INVALID_JSON" }, { status: 400, headers: cors });
  }

  const status = String(body.status || "");
  if (!allowed.has(status)) return Response.json({ error: "INVALID_FORGE_STATUS" }, { status: 400, headers: cors });
  const now = new Date();
  const db = getDb();
  await db
    .update(characterForgeJobs)
    .set({
      status,
      providerJobId: body.providerJobId ? String(body.providerJobId).slice(0, 256) : job.providerJobId,
      claimedAt: job.claimedAt || now,
      errorCode: body.errorCode ? String(body.errorCode).slice(0, 128) : status === "failed" ? "PROVIDER_FAILED" : null,
      errorMessage: body.errorMessage ? String(body.errorMessage).slice(0, 1000) : null,
      updatedAt: now,
    })
    .where(and(eq(characterForgeJobs.id, id), eq(characterForgeJobs.userId, job.userId)));

  const connectionStatus = status === "connected" || ["uploading", "generating", "downloading"].includes(status)
    ? "connected"
    : status;
  if (["connected", "pending_login", "daily_limit", "needs_attention", "failed"].includes(connectionStatus)) {
    await db
      .update(tencentConnections)
      .set({
        status: connectionStatus === "failed" ? "needs_attention" : connectionStatus,
        lastCheckedAt: now,
        needsAttentionReason:
          status === "daily_limit"
            ? "Tencent daily free generations are used up for this account. Try again after Tencent resets the allowance."
            : status === "pending_login"
              ? "Tencent login or email verification is required in the helper tab."
              : status === "needs_attention" || status === "failed"
                ? body.errorMessage || "Tencent needs attention."
                : null,
        updatedAt: now,
      })
      .where(eq(tencentConnections.userId, job.userId));
  }

  return Response.json({ ok: true, jobId: id, status }, { headers: cors });
}
