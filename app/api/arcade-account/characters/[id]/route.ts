import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { arcadeCharacters, arcadeUsers } from "../../../../../db/schema";
import { getSessionUser } from "../../../../lib/arcade-auth";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });
  const { id } = await context.params;
  const db = getDb();
  const rows = await db
    .select({ id: arcadeCharacters.id })
    .from(arcadeCharacters)
    .where(and(eq(arcadeCharacters.id, id), eq(arcadeCharacters.userId, user.id)))
    .limit(1);
  if (!rows[0]) return Response.json({ error: "CHARACTER_NOT_FOUND" }, { status: 404 });

  await db.delete(arcadeCharacters).where(and(eq(arcadeCharacters.id, id), eq(arcadeCharacters.userId, user.id)));
  if (user.activeCharacterId === id) {
    await db
      .update(arcadeUsers)
      .set({ activeCharacterId: null, updatedAt: new Date() })
      .where(eq(arcadeUsers.id, user.id));
  }
  return Response.json({ ok: true });
}
