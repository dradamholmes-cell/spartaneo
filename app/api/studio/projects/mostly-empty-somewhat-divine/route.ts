import manifest from "@/data/studio/mostly-empty-somewhat-divine.json";
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

  return Response.json({
    project: {
      id: manifest.book_id,
      title: manifest.title,
      isolation_key: manifest.isolation.key,
      status: manifest.current_status,
      package_date: manifest.package_date,
      package_sha256: manifest.source_package.sha256,
      integrity_verified: manifest.source_package.integrity_verified,
      final_page_count: null,
      final_page_count_reason: "Sequence integration and pagination are not frozen.",
    },
    counts: {
      character_locks: manifest.character_locks.count,
      approved_keepers: manifest.approved_keepers.count,
      provisional_reference: manifest.provisional_reference.count,
      hash_verified_files: manifest.source_package.verified_files,
    },
    print: manifest.print,
    story_locks: manifest.story_locks,
    ending_lock: manifest.ending_lock,
    open_repairs: manifest.open_repairs,
    editorial_open_items: manifest.editorial_open_items,
    next_work: manifest.next_work,
    rules: {
      cross_project_retrieval_allowed: manifest.isolation.cross_project_retrieval_allowed,
      rejected_generations_may_be_reference: manifest.isolation.rejected_generations_may_be_reference,
      working_compilation_may_export_as_final: manifest.working_compilation.may_export_as_final,
      provisional_reference_may_auto_promote: manifest.provisional_reference.may_auto_promote,
    },
  });
}
