import manifest from "@/data/studio/mostly-empty-somewhat-divine.json";
import { getOrSeedProject, parseProjectMetadata } from "@/db/studio-runtime";
import { getChatGPTUser } from "../../../../chatgpt-auth";

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

  const row = await getOrSeedProject(manifest);
  const persisted = parseProjectMetadata(row) as typeof manifest;

  return Response.json({
    storage: "d1",
    project: {
      id: row.id,
      title: row.name,
      isolation_key: row.isolation_key,
      status: row.state,
      package_date: persisted.package_date,
      package_sha256: row.source_snapshot_sha256,
      package_label: row.source_snapshot_label,
      integrity_verified: persisted.source_package.integrity_verified,
      final_page_count: null,
      final_page_count_reason: "Sequence integration and pagination are not frozen.",
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    counts: {
      character_locks: persisted.character_locks.count,
      approved_keepers: persisted.approved_keepers.count,
      provisional_reference: persisted.provisional_reference.count,
      hash_verified_files: persisted.source_package.verified_files,
    },
    print: persisted.print,
    story_locks: persisted.story_locks,
    ending_lock: persisted.ending_lock,
    open_repairs: persisted.open_repairs,
    editorial_open_items: persisted.editorial_open_items,
    next_work: persisted.next_work,
    rules: {
      cross_project_retrieval_allowed: persisted.isolation.cross_project_retrieval_allowed,
      rejected_generations_may_be_reference: persisted.isolation.rejected_generations_may_be_reference,
      working_compilation_may_export_as_final: persisted.working_compilation.may_export_as_final,
      provisional_reference_may_auto_promote: persisted.provisional_reference.may_auto_promote,
    },
  });
}
