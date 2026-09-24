import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../../db";
import { characterForgeJobs } from "../../db/schema";

const encoder = new TextEncoder();
const BRIDGE_MINUTES = 30;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toBase64Url(new Uint8Array(digest));
}

export async function mintForgeBridgeToken(jobId: string, userId: string) {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = toBase64Url(bytes);
  const hash = await sha256(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + BRIDGE_MINUTES * 60 * 1000);
  await getDb()
    .update(characterForgeJobs)
    .set({ bridgeTokenHash: hash, bridgeTokenExpiresAt: expiresAt, updatedAt: now })
    .where(and(eq(characterForgeJobs.id, jobId), eq(characterForgeJobs.userId, userId)));
  return { token, expiresAt };
}

export async function verifyForgeBridgeToken(jobId: string, token: string | null) {
  if (!token) return null;
  const hash = await sha256(token);
  const rows = await getDb()
    .select()
    .from(characterForgeJobs)
    .where(
      and(
        eq(characterForgeJobs.id, jobId),
        eq(characterForgeJobs.bridgeTokenHash, hash),
        gt(characterForgeJobs.bridgeTokenExpiresAt, new Date()),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export function bearerToken(request: Request) {
  const value = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match?.[1]?.trim() || null;
}
