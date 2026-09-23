import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { characterForgeJobs } from "../../../../db/schema";
import { getSessionUser } from "../../../lib/arcade-auth";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });
  const db = getDb();
  const jobs = await db
    .select()
    .from(characterForgeJobs)
    .where(eq(characterForgeJobs.userId, user.id))
    .orderBy(desc(characterForgeJobs.updatedAt))
    .limit(50);
  return Response.json({ jobs });
}

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 });
  if (user.isGuest) return Response.json({ error: "ACCOUNT_REQUIRED_FOR_FORGE" }, { status: 403 });

  let body: { sourceImageKey?: string } = {};
  try {
    body = await request.json();
  } catch {
    // A draft job can be created before the upload key exists.
  }
  const now = new Date();
  const job = {
    id: crypto.randomUUID(),
    userId: user.id,
    characterId: null,
    provider: "tencent-hunyuan",
    providerJobId: null,
    status: "draft",
    faceTarget: 50000,
    sourceImageKey: body.sourceImageKey ? String(body.sourceImageKey).slice(0, 1024) : null,
    outputGlbKey: null,
    errorCode: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().insert(characterForgeJobs).values(job);
  return Response.json({ job }, { status: 201 });
}
