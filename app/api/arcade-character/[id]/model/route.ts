import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { characterForgeJobs } from "../../../../../db/schema";
import { getArcadeFile } from "../../../../lib/arcade-files";
import { verifyCharacterLaunchTicket } from "../../../../lib/character-launch";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cross-Origin-Resource-Policy": "cross-origin",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const ticket = new URL(request.url).searchParams.get("ticket");
  const grant = await verifyCharacterLaunchTicket(id, ticket);
  if (!grant) return Response.json({ error: "INVALID_OR_EXPIRED_CHARACTER_TICKET" }, { status: 401, headers: cors });

  const jobs = await getDb()
    .select({ outputGlbKey: characterForgeJobs.outputGlbKey })
    .from(characterForgeJobs)
    .where(eq(characterForgeJobs.characterId, id))
    .limit(1);
  const key = jobs[0]?.outputGlbKey;
  if (!key) return Response.json({ error: "CHARACTER_MODEL_NOT_FOUND" }, { status: 404, headers: cors });

  try {
    const file = await getArcadeFile(key);
    if (!file) return Response.json({ error: "CHARACTER_MODEL_NOT_FOUND" }, { status: 404, headers: cors });
    return new Response(file.body, {
      headers: {
        ...cors,
        "Content-Type": "model/gltf-binary",
        "Content-Disposition": `inline; filename="character-${id}.glb"`,
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    return Response.json(
      { error: "STORAGE_NOT_CONFIGURED", message: error instanceof Error ? error.message : "R2 unavailable" },
      { status: 503, headers: cors },
    );
  }
}
