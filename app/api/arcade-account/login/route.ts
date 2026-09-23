import { createSession, findUserForLogin, publicUser, verifyPassword } from "../../../lib/arcade-auth";

function json(body: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(body, { status, headers });
}

export async function POST(request: Request) {
  let body: { identity?: string; email?: string; username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const identity = String(body.identity ?? body.email ?? body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!identity || !password) return json({ error: "LOGIN_REQUIRED" }, 400);

  const user = await findUserForLogin(identity);
  if (!user || user.isGuest || !(await verifyPassword(password, user.passwordHash))) {
    return json({ error: "INVALID_LOGIN" }, 401);
  }

  const session = await createSession(user.id);
  return json({ user: publicUser(user) }, 200, { "Set-Cookie": session.cookie });
}
