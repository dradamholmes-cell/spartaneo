import manifest from "../data/studio/mostly-empty-somewhat-divine.json";

type D1Prepared = {
  bind(...values: unknown[]): D1Prepared;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
};

type D1Database = { prepare(sql: string): D1Prepared };
type Env = { DB: D1Database; STUDIO_WEB_TOKEN: string };

const PROJECT_ID = "mostly-empty-somewhat-divine";
const LIBRARY_FOLDER = "/BIG EPIC BOOK";
const LIBRARY_PACKAGE = "MOSTLY_EMPTY_STUDIO_MASTER_CORE_2026-09-25.zip";
const LIBRARY_PACKAGE_PATH = `${LIBRARY_FOLDER}/${LIBRARY_PACKAGE}`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

function parseJson(value: unknown, fallback: any) {
  if (typeof value !== "string") return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function pageView(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    project_id: row.project_id,
    page_key: row.page_key,
    page_number: row.page_number ?? null,
    title: row.title ?? null,
    status: row.status,
    brief: row.brief,
    required_character_ids: parseJson(row.required_character_ids_json, []),
    allowed_reference_asset_ids: parseJson(row.allowed_reference_asset_ids_json, []),
    locked_asset_id: row.locked_asset_id ?? null,
    lettering_state: row.lettering_state,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function assetView(row: any) {
  let internalPath: string | null = null;
  if (typeof row.storage_key === "string" && row.storage_key.startsWith("libraryzip:")) {
    const marker = row.storage_key.indexOf("#");
    if (marker >= 0) internalPath = row.storage_key.slice(marker + 1);
  }
  return {
    id: row.id,
    project_id: row.project_id,
    category: row.category,
    original_name: row.original_name,
    sha256: row.sha256,
    mime_type: row.mime_type ?? null,
    reference_allowed: Boolean(row.reference_allowed),
    source: internalPath
      ? {
          type: "chatgpt_library_zip",
          library_folder: LIBRARY_FOLDER,
          library_package: LIBRARY_PACKAGE,
          library_package_path: LIBRARY_PACKAGE_PATH,
          internal_path: internalPath,
          instruction: "Use this exact file from the trusted ZIP. Do not substitute similarly named files.",
        }
      : { type: "chatgpt_library_file", library_path: String(row.storage_key || "").replace(/^library:/, "") },
  };
}

async function nextPageRow(env: Env) {
  return env.DB.prepare(`SELECT * FROM studio_pages
    WHERE project_id = ? AND status NOT IN ('locked','rejected')
    ORDER BY CASE WHEN page_number IS NULL THEN 1 ELSE 0 END,
             page_number ASC,
             created_at ASC
    LIMIT 1`).bind(PROJECT_ID).first<any>();
}

async function generationPacket(env: Env, row: any) {
  if (!row) {
    return {
      ready: false,
      reason: "no_generation_page_queued",
      do_not_invent_page_number: true,
      editorial_open_items: manifest.editorial_open_items,
      next_work: manifest.next_work,
    };
  }

  const page = pageView(row)!;
  const ids = page.allowed_reference_asset_ids as string[];
  const refs: any[] = [];
  for (const id of ids) {
    const asset = await env.DB.prepare(
      "SELECT * FROM studio_assets WHERE project_id = ? AND id = ? AND reference_allowed = 1 LIMIT 1",
    ).bind(PROJECT_ID, id).first<any>();
    if (asset) refs.push(assetView(asset));
  }

  return {
    ready: Boolean(page.brief && refs.length === ids.length),
    page,
    allowed_references: refs,
    missing_reference_ids: ids.filter((id) => !refs.some((r) => r.id === id)),
    source_package: {
      library_folder: LIBRARY_FOLDER,
      library_package: LIBRARY_PACKAGE,
      library_package_path: LIBRARY_PACKAGE_PATH,
      sha256: manifest.source_package.sha256,
    },
    print_lock: manifest.print,
    story_locks: manifest.story_locks,
    ending_lock: manifest.ending_lock,
    qa_rules: manifest.qa_rules,
    generation_rules: [
      "Use only allowed_references plus explicit project-level style locks named by the page task.",
      "Never use rejected or provisional assets as automatic references.",
      "Never retrieve across another OGB project.",
      "Generate one portrait page at a time unless a centerfold is explicitly called.",
      "Readable lettering is part of the finished page.",
    ],
  };
}

async function bundledProject(env: Env) {
  const row = await env.DB.prepare("SELECT * FROM studio_projects WHERE id = ? LIMIT 1")
    .bind(PROJECT_ID).first<any>();
  if (!row) return { error: "studio_project_missing" };

  const persisted = parseJson(row.metadata_json, manifest);
  const nextRow = await nextPageRow(env);
  const nextPage = nextRow
    ? { ready: true, project_id: PROJECT_ID, page: pageView(nextRow) }
    : {
        ready: false,
        project_id: PROJECT_ID,
        reason: "page_sequence_not_frozen_or_no_unfinished_page_is_queued",
        do_not_invent_page_number: true,
        editorial_open_items: manifest.editorial_open_items,
        next_work: manifest.next_work,
      };
  const packet = await generationPacket(env, nextRow);

  return {
    authoritative: true,
    transport: "plugin-free-single-fetch",
    plugin_required: false,
    codex_required: false,
    project_isolation: "strict",
    production_publish_exposed: false,
    charges_or_orders_exposed: false,
    project: {
      id: row.id,
      title: row.name,
      state: row.state,
      isolation_key: row.isolation_key,
      source_snapshot_sha256: row.source_snapshot_sha256,
      source_snapshot_label: row.source_snapshot_label,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    source_package: {
      library_folder: LIBRARY_FOLDER,
      library_package: LIBRARY_PACKAGE,
      library_package_path: LIBRARY_PACKAGE_PATH,
      sha256: manifest.source_package.sha256,
      verified_files: manifest.source_package.verified_files,
    },
    counts: {
      character_locks: manifest.character_locks.count,
      approved_keepers: manifest.approved_keepers.count,
      provisional_reference: manifest.provisional_reference.count,
    },
    print: persisted.print,
    story_locks: persisted.story_locks,
    ending_lock: persisted.ending_lock,
    qa_rules: persisted.qa_rules,
    open_repairs: manifest.open_repairs,
    editorial_locks: manifest.editorial_locks,
    editorial_open_items: manifest.editorial_open_items,
    next_work: manifest.next_work,
    rules: persisted.isolation,
    workflow: {
      next: nextPage,
      packet,
      instruction: nextRow
        ? "The next page and its complete safe generation packet are embedded here. Continue from packet; do not fetch sibling routes and do not use chat memory or the old V9 runner."
        : "No page task is queued. Do not invent pagination. Use the editorial_open_items/next_work above to decide what must be frozen before page generation."
    }
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*" } });
    if (url.pathname === "/health") return json({ ok: true, service: "ogb-studio-web", mode: "plugin-free-single-fetch" });
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

    const prefix = `/v1/${env.STUDIO_WEB_TOKEN || ""}`;
    if (!env.STUDIO_WEB_TOKEN || !url.pathname.startsWith(prefix)) return json({ error: "not_found" }, 404);
    const action = url.pathname.slice(prefix.length) || "/project";

    try {
      if (action === "/project" || action === "/continue" || action === "/status") {
        return json(await bundledProject(env));
      }
      return json({ error: "not_found", hint: "Use /project. It now contains project state, next-page state, and the generation packet in one response." }, 404);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "studio_web_failed" }, 500);
    }
  },
};
