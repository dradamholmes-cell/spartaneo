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
    backend_ready: bindings.d1,
    bindings: {
      d1_database: bindings.d1 ? "connected" : "not_configured",
      private_asset_bucket: bindings.r2 ? "connected" : "deferred",
    },
    required_binding_names: {
      d1: "DB",
    },
    optional_binding_names: {
      r2: "STUDIO_ASSETS",
    },
    asset_storage_mode: bindings.r2 ? "private_r2" : "external_or_legacy_refs_only",
    production_writes_enabled: false,
    codex_required: false,
  });
}
