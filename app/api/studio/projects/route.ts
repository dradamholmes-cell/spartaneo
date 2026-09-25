import manifest from "@/data/studio/mostly-empty-somewhat-divine.json";
import { getOrSeedProject, listStudioProjects, parseProjectMetadata } from "@/db/studio-runtime";
import { getChatGPTUser } from "../../../chatgpt-auth";

function isAllowed(email: string) {
  return (process.env.SPARTANEO_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "authentication_required" }, { status: 401 });
  if (!isAllowed(user.email)) return Response.json({ error: "not_found" }, { status: 404 });

  await getOrSeedProject(manifest);
  const projects = await listStudioProjects();

  return Response.json({
    storage: "d1",
    projects: projects.map((row) => {
      const metadata = parseProjectMetadata(row) as Partial<typeof manifest>;
      return {
        id: row.id,
        name: row.name,
        kind: row.kind,
        isolation_key: row.isolation_key,
        state: row.state,
        package_label: row.source_snapshot_label,
        package_sha256: row.source_snapshot_sha256,
        package_date: metadata.package_date || null,
        updated_at: row.updated_at,
      };
    }),
  });
}
