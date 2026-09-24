import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { arcadeCharacters, characterForgeJobs, tencentConnections } from "../../../../db/schema";
import { getSessionUser } from "../../../lib/arcade-auth";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });

  const db = getDb();
  const [characters, forgeJobs, connections] = await Promise.all([
    db
      .select()
      .from(arcadeCharacters)
      .where(eq(arcadeCharacters.userId, user.id))
      .orderBy(desc(arcadeCharacters.updatedAt)),
    db
      .select()
      .from(characterForgeJobs)
      .where(eq(characterForgeJobs.userId, user.id))
      .orderBy(desc(characterForgeJobs.updatedAt))
      .limit(20),
    db.select().from(tencentConnections).where(eq(tencentConnections.userId, user.id)).limit(1),
  ]);

  return Response.json({
    user,
    characters,
    forgeJobs,
    tencent: connections[0] ?? { status: "not_connected" },
  });
}
