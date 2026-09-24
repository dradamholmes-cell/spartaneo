import { clearSessionCookie, destroySession } from "../../../lib/arcade-auth";

export async function POST(request: Request) {
  await destroySession(request);
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
