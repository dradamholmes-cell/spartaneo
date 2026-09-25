import { getChatGPTUser } from "../../../chatgpt-auth";
import { STUDIO_PROJECTS, STUDIO_RULES } from "../../../studio-registry";

function isAllowed(email: string) {
  const allowed = (process.env.SPARTANEO_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  if (!isAllowed(user.email)) return Response.json({ error: "not_found" }, { status: 404 });

  return Response.json({
    name: "OGB Studio",
    version: "0.1.0",
    codex_required: STUDIO_RULES.codexRequired,
    production_writes_require_approval: STUDIO_RULES.productionWritesRequireApproval,
    cross_project_retrieval_allowed: STUDIO_RULES.crossProjectRetrievalAllowed,
    rejected_art_can_be_reference: STUDIO_RULES.rejectedArtCanBecomeReference,
    charges_require_explicit_approval: STUDIO_RULES.chargesRequireExplicitApproval,
    projects: STUDIO_PROJECTS.map((project) => ({
      id: project.id,
      name: project.name,
      kind: project.kind,
      isolation_key: project.isolationKey,
      migration_state: project.migrationState,
    })),
  });
}
