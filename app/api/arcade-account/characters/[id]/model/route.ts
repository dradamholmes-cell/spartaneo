import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../../db";
import { arcadeCharacters, characterForgeJobs } from "../../../../../../../db/schema";
import { getArcadeFile } from "../../../../../../lib/arcade-files";
import { getSessionUser } from "../../../../../../lib/arcade-auth";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });
  const { id } = await context.params;
  const db = getDb();
  const characters = await db
    .select({ id: arcadeCharacters.id })
    .from(arcadeCharacters)
    .where(and(eq(arcadeCharacters.id, id), eq(arcadeCharacters.userId, user.id)))
    .limit(1);
  if (!characters[0]) return Response.json({ error: "CHARACTER_NOT_FOUND" }, { status: 404 });

  const jobs = await db
    .select({ outputGlbKey: characterForgeJobs.outputGlbKey })
    .from(characterForgeJobs)
    .where(and(eq(characterForgeJobs.characterId, id), eq(characterForgeJobs.userId, user.id)))
    .limit(1);
  const key = jobs[0]?.outputGlbKey;
  if (!key) return Response.json({ error: "CHARACTER_MODEL_NOT_FOUND" }, { status: 404 });

  try {
    const file = await getArcadeFile(key);
    if (!file) return Response.json({ error: "CHARACTER_MODEL_NOT_FOUND" }, { status: 404 });
    return new Response(file.body, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Disposition": `inline; filename="character-${id}.glb"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return Response.json(
      { error: "STORAGE_NOT_CONFIGURED", message: error instanceof Error ? error.message : "R2 unavailable" },
      { status: 503 },
    );
  }
}
