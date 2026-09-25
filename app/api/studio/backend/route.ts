import { getChatGPTUser } from "../../../chatgpt-auth";
import { studioBindingStatus } from "../../../studio-cloudflare";

function ownerAllowed(email: string) {
  return (process.env.SPARTANEO_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  if (!ownerAllowed(user.email)) return Response.json({ error: "not_found" }, { status: 404 });

  const bindings = studioBindingStatus();
  return Response.json({
    studio: "OGB Studio",
    backend_ready: bindings.d1 && bindings.r2,
    bindings: {
      d1_database: bindings.d1 ? "connected" : "not_configured",
      private_asset_bucket: bindings.r2 ? "connected" : "not_configured",
    },
    required_binding_names: {
      d1: "DB",
      r2: "STUDIO_ASSETS",
    },
    production_writes_enabled: false,
    codex_required: false,
  });
}
