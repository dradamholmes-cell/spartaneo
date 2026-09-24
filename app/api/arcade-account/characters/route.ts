import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { arcadeCharacters, arcadeUsers } from "../../../../db/schema";
import { getSessionUser } from "../../../lib/arcade-auth";

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });

  let body: { name?: string; source?: string; presetKey?: string; glbUrl?: string; previewUrl?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 40);
  if (!name) return Response.json({ error: "CHARACTER_NAME_REQUIRED" }, { status: 400 });
  const source = ["preset", "generated", "imported"].includes(String(body.source))
    ? String(body.source)
    : "preset";
  const now = new Date();
  const character = {
    id: crypto.randomUUID(),
    userId: user.id,
    name,
    source,
    status: "ready",
    presetKey: body.presetKey ? String(body.presetKey).slice(0, 80) : null,
    glbUrl: body.glbUrl ? String(body.glbUrl).slice(0, 2048) : null,
    previewUrl: body.previewUrl ? String(body.previewUrl).slice(0, 2048) : null,
    providerJobId: null,
    createdAt: now,
    updatedAt: now,
  };

  const db = getDb();
  await db.insert(arcadeCharacters).values(character);
  if (!user.activeCharacterId) {
    await db
      .update(arcadeUsers)
      .set({ activeCharacterId: character.id, updatedAt: now })
      .where(eq(arcadeUsers.id, user.id));
  }
  return Response.json({ character }, { status: 201 });
}
