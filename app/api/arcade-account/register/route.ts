import { eq, or } from "drizzle-orm";
import { getDb } from "../../../../db";
import { arcadeUsers, tencentConnections } from "../../../../db/schema";
import { createSession, hashPassword, publicUser } from "../../../lib/arcade-auth";

function json(body: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(body, { status, headers });
}

function cleanUsername(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

export async function POST(request: Request) {
  let body: { email?: string; username?: string; displayName?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const displayName = String(body.displayName ?? "").trim().slice(0, 40) || null;
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "VALID_EMAIL_REQUIRED" }, 400);
  if (password.length < 8) return json({ error: "PASSWORD_TOO_SHORT" }, 400);

  const db = getDb();
  const requested = cleanUsername(String(body.username ?? ""));
  let username = requested || cleanUsername(email.split("@")[0]) || "player";
  const existing = await db
    .select({ id: arcadeUsers.id, email: arcadeUsers.email, username: arcadeUsers.username })
    .from(arcadeUsers)
    .where(or(eq(arcadeUsers.email, email), eq(arcadeUsers.username, username)))
    .limit(1);
  if (existing[0]?.email === email) return json({ error: "EMAIL_IN_USE" }, 409);
  if (existing[0]?.username === username) {
    username = `${username.slice(0, 18)}_${crypto.randomUUID().slice(0, 5)}`;
  }

  const now = new Date();
  const user = {
    id: crypto.randomUUID(),
    email,
    username,
    displayName,
    passwordHash: await hashPassword(password),
    isGuest: false,
    activeCharacterId: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(arcadeUsers).values(user);
  await db.insert(tencentConnections).values({
    userId: user.id,
    status: "not_connected",
    createdAt: now,
    updatedAt: now,
  });
  const session = await createSession(user.id);
  return json({ user: publicUser(user) }, 201, { "Set-Cookie": session.cookie });
}
