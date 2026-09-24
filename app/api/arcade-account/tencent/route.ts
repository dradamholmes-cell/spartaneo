import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { tencentConnections } from "../../../../db/schema";
import { getSessionUser } from "../../../lib/arcade-auth";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });
  const rows = await getDb()
    .select()
    .from(tencentConnections)
    .where(eq(tencentConnections.userId, user.id))
    .limit(1);
  return Response.json({ tencent: rows[0] ?? { status: "not_connected", helperMode: "browser_helper" } });
}

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });
  if (user.isGuest) return Response.json({ error: "ACCOUNT_REQUIRED_FOR_FORGE" }, { status: 403 });

  let body: { action?: string } = {};
  try {
    body = await request.json();
  } catch {
    // handled below
  }
  const action = String(body.action || "begin");
  const db = getDb();
  const now = new Date();

  if (action === "disconnect") {
    await db
      .insert(tencentConnections)
      .values({
        userId: user.id,
        status: "not_connected",
        sessionRef: null,
        helperMode: "browser_helper",
        lastCheckedAt: now,
        needsAttentionReason: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tencentConnections.userId,
        set: {
          status: "not_connected",
          sessionRef: null,
          lastCheckedAt: now,
          needsAttentionReason: null,
          updatedAt: now,
        },
      });
    return Response.json({ tencent: { status: "not_connected", helperMode: "browser_helper" } });
  }

  if (action !== "begin") return Response.json({ error: "UNKNOWN_TENCENT_ACTION" }, { status: 400 });

  const existing = await db
    .select()
    .from(tencentConnections)
    .where(eq(tencentConnections.userId, user.id))
    .limit(1);
  const sessionRef = existing[0]?.sessionRef || crypto.randomUUID();
  await db
    .insert(tencentConnections)
    .values({
      userId: user.id,
      status: "pending_login",
      sessionRef,
      helperMode: "browser_helper",
      lastCheckedAt: now,
      needsAttentionReason: "Open Tencent in the browser helper and complete Tencent's own email verification if requested.",
      createdAt: existing[0]?.createdAt || now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: tencentConnections.userId,
      set: {
        status: "pending_login",
        sessionRef,
        helperMode: "browser_helper",
        lastCheckedAt: now,
        needsAttentionReason: "Open Tencent in the browser helper and complete Tencent's own email verification if requested.",
        updatedAt: now,
      },
    });

  return Response.json({
    tencent: {
      status: "pending_login",
      sessionRef,
      helperMode: "browser_helper",
      storesCredentials: false,
    },
  });
}
