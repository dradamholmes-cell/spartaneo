import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "../../db";
import { arcadeCharacterLaunchTokens } from "../../db/schema";

const encoder = new TextEncoder();
const TTL_MINUTES = 30;

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function mintCharacterLaunchTicket(userId: string, characterId: string) {
  const token = randomToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MINUTES * 60 * 1000);
  const db = getDb();
  await db
    .delete(arcadeCharacterLaunchTokens)
    .where(and(eq(arcadeCharacterLaunchTokens.userId, userId), lt(arcadeCharacterLaunchTokens.expiresAt, now)));
  await db.insert(arcadeCharacterLaunchTokens).values({
    id: crypto.randomUUID(),
    userId,
    characterId,
    tokenHash: await tokenHash(token),
    expiresAt,
    createdAt: now,
  });
  return { token, expiresAt };
}

export async function verifyCharacterLaunchTicket(characterId: string, token: string | null) {
  if (!token) return null;
  const rows = await getDb()
    .select()
    .from(arcadeCharacterLaunchTokens)
    .where(
      and(
        eq(arcadeCharacterLaunchTokens.characterId, characterId),
        eq(arcadeCharacterLaunchTokens.tokenHash, await tokenHash(token)),
        gt(arcadeCharacterLaunchTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
