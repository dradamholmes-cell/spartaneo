import { and, eq, gt, or } from "drizzle-orm";
import { getDb } from "../../db";
import { arcadeSessions, arcadeUsers } from "../../db/schema";

const SESSION_COOKIE = "ogb_arcade_session";
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 210_000;
const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false;
  const [scheme, iterationText, saltText, hashText] = stored.split("$");
  if (scheme !== "pbkdf2-sha256" || !iterationText || !saltText || !hashText) return false;
  const iterations = Number(iterationText);
  if (!Number.isFinite(iterations) || iterations < 100_000) return false;
  const expected = base64ToBytes(hashText);
  const actual = await pbkdf2(password, base64ToBytes(saltText), iterations);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < actual.length; i += 1) difference |= actual[i] ^ expected[i];
  return difference === 0;
}

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  for (const part of cookies.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function makeCookie(token: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function clearSessionCookie() {
  return makeCookie("", 0);
}

export async function createSession(userId: string) {
  const db = getDb();
  const token = bytesToBase64(randomBytes(32)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  const tokenHash = await sha256(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(arcadeSessions).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash,
    createdAt: now,
    expiresAt,
  });
  return { token, cookie: makeCookie(token, SESSION_DAYS * 24 * 60 * 60) };
}

export async function destroySession(request: Request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return;
  const db = getDb();
  const tokenHash = await sha256(token);
  await db.delete(arcadeSessions).where(eq(arcadeSessions.tokenHash, tokenHash));
}

export async function getSessionUser(request: Request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const db = getDb();
  const tokenHash = await sha256(token);
  const now = new Date();
  const rows = await db
    .select({
      id: arcadeUsers.id,
      email: arcadeUsers.email,
      username: arcadeUsers.username,
      displayName: arcadeUsers.displayName,
      isGuest: arcadeUsers.isGuest,
      activeCharacterId: arcadeUsers.activeCharacterId,
    })
    .from(arcadeSessions)
    .innerJoin(arcadeUsers, eq(arcadeSessions.userId, arcadeUsers.id))
    .where(and(eq(arcadeSessions.tokenHash, tokenHash), gt(arcadeSessions.expiresAt, now)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findUserForLogin(identity: string) {
  const db = getDb();
  const normalized = identity.trim().toLowerCase();
  const rows = await db
    .select()
    .from(arcadeUsers)
    .where(or(eq(arcadeUsers.email, normalized), eq(arcadeUsers.username, normalized)))
    .limit(1);
  return rows[0] ?? null;
}

export function publicUser(user: {
  id: string;
  email: string | null;
  username: string;
  displayName: string | null;
  isGuest: boolean;
  activeCharacterId: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    isGuest: user.isGuest,
    activeCharacterId: user.activeCharacterId,
  };
}
