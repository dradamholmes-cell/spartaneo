import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../../db";
import { arcadeCharacters, characterForgeJobs } from "../../../../../../../db/schema";
import { getSessionUser } from "../../../../../../lib/arcade-auth";
import { mintCharacterLaunchTicket } from "../../../../../../lib/character-launch";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });

  const { id } = await context.params;
  const db = getDb();
  const characters = await db
    .select()
    .from(arcadeCharacters)
    .where(and(eq(arcadeCharacters.id, id), eq(arcadeCharacters.userId, user.id)))
    .limit(1);
  const character = characters[0];
  if (!character) return Response.json({ error: "CHARACTER_NOT_FOUND" }, { status: 404 });
  if (character.status !== "ready" || !character.glbUrl) {
    return Response.json({ error: "CHARACTER_MODEL_NOT_READY" }, { status: 409 });
  }

  const jobs = await db
    .select({ outputGlbKey: characterForgeJobs.outputGlbKey })
    .from(characterForgeJobs)
    .where(and(eq(characterForgeJobs.characterId, id), eq(characterForgeJobs.userId, user.id)))
    .limit(1);
  if (!jobs[0]?.outputGlbKey) return Response.json({ error: "CHARACTER_MODEL_NOT_FOUND" }, { status: 404 });

  const ticket = await mintCharacterLaunchTicket(user.id, id);
  const origin = new URL(request.url).origin;
  const modelUrl = `${origin}/api/arcade-character/${encodeURIComponent(id)}/model?ticket=${encodeURIComponent(ticket.token)}`;

  return Response.json({
    character: {
      id: character.id,
      name: character.name,
      source: character.source,
      status: character.status,
    },
    handoff: {
      version: 1,
      character: `custom:${character.id}`,
      characterId: character.id,
      characterName: character.name,
      modelUrl,
      expiresAt: ticket.expiresAt.toISOString(),
    },
  });
}
