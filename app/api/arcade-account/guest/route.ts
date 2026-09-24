import { getDb } from "../../../../db";
import { arcadeUsers, tencentConnections } from "../../../../db/schema";
import { createSession, publicUser } from "../../../lib/arcade-auth";

export async function POST() {
  const db = getDb();
  const now = new Date();
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8);
  const user = {
    id: crypto.randomUUID(),
    email: null,
    username: `guest_${suffix}`,
    displayName: "Guest",
    passwordHash: null,
    isGuest: true,
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
  return Response.json({ user: publicUser(user) }, { status: 201, headers: { "Set-Cookie": session.cookie } });
}
