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

function assetView(row: any) {
  let internalPath: string | null = null;
  if (typeof row.storage_key === "string" && row.storage_key.startsWith("libraryzip:")) {
    const marker = row.storage_key.indexOf("#");
    if (marker >= 0) internalPath = row.storage_key.slice(marker + 1);
  }
  return {
    id: row.id,
    project_id: row.project_id,
    page_id: row.page_id ?? null,
    character_id: row.character_id ?? null,
    category: row.category,
    original_name: row.original_name,
    sha256: row.sha256,
    mime_type: row.mime_type ?? null,
    byte_length: row.byte_length ?? null,
    reference_allowed: Boolean(row.reference_allowed),
    source: internalPath
      ? {
          type: "chatgpt_library_zip",
          library_folder: LIBRARY_FOLDER,
          library_package: LIBRARY_PACKAGE,
          library_package_path: LIBRARY_PACKAGE_PATH,
          internal_path: internalPath,
          instruction: "Locate the exact trusted ZIP in ChatGPT Library and extract only this internal path. Do not substitute similarly named files.",
        }
      : { type: "chatgpt_library_file", library_path: String(row.storage_key || "").replace(/^library:/, "") },
    created_at: row.created_at,
  };
}

function pageView(row: any) {
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

async function projectRow(env: Env) {
  return env.DB.prepare("SELECT * FROM studio_projects WHERE id = ? LIMIT 1").bind(PROJECT_ID).first<any>();
}

async function nextPageRow(env: Env) {
  return env.DB.prepare(`SELECT * FROM studio_pages
    WHERE project_id = ? AND status NOT IN ('locked','rejected')
    ORDER BY CASE WHEN page_number IS NULL THEN 1 ELSE 0 END,
             page_number ASC,
             created_at ASC
    LIMIT 1`).bind(PROJECT_ID).first<any>();
}

async function listAssets(env: Env, category: string | null, includeNonReference: boolean) {
  let sql = "SELECT * FROM studio_assets WHERE project_id = ?";
  const binds: unknown[] = [PROJECT_ID];
  if (category) { sql += " AND category = ?"; binds.push(category); }
  if (!includeNonReference) sql += " AND reference_allowed = 1";
  sql += " ORDER BY category ASC, original_name ASC";
  const result = await env.DB.prepare(sql).bind(...binds).all<any>();
  return (result.results || []).map(assetView);
}

async function status(env: Env) {
  const [project, pages, assets, events, next] = await Promise.all([
    projectRow(env),
    env.DB.prepare("SELECT COUNT(*) AS n FROM studio_pages WHERE project_id = ?").bind(PROJECT_ID).first<any>(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM studio_assets WHERE project_id = ?").bind(PROJECT_ID).first<any>(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM studio_events WHERE project_id = ?").bind(PROJECT_ID).first<any>(),
    nextPageRow(env),
  ]);
  return {
    ok: Boolean(project),
    transport: "plugin-free-https",
    codex_required: false,
    plugin_required: false,
    d1: true,
    project_isolation: "strict",
    production_publish_exposed: false,
    charges_or_orders_exposed: false,
    current_project: PROJECT_ID,
    source_package: LIBRARY_PACKAGE_PATH,
    counts: {
      pages: Number(pages?.n || 0),
      assets: Number(assets?.n || 0),
      events: Number(events?.n || 0),
    },
    generation_ready: Boolean(next),
    generation_blocker: next ? null : "No unfinished page task is queued. Do not invent pagination; use the project's editorial next_work to decide the next task.",
  };
}

async function project(env: Env) {
  const row = await projectRow(env);
  if (!row) return { error: "studio_project_missing" };
  const persisted = parseJson(row.metadata_json, manifest);
  return {
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
    open_repairs: persisted.open_repairs,
    editorial_open_items: persisted.editorial_open_items,
    next_work: persisted.next_work,
    rules: persisted.isolation,
  };
}

async function next(env: Env) {
  const row = await nextPageRow(env);
  if (!row) {
    return {
      ready: false,
      project_id: PROJECT_ID,
      reason: "page_sequence_not_frozen_or_no_unfinished_page_is_queued",
      do_not_invent_page_number: true,
      editorial_open_items: manifest.editorial_open_items,
      next_work: manifest.next_work,
    };
  }
  return { ready: true, project_id: PROJECT_ID, page: pageView(row) };
}

async function packet(env: Env, pageKey?: string | null) {
  const row = pageKey
    ? await env.DB.prepare("SELECT * FROM studio_pages WHERE project_id = ? AND page_key = ? LIMIT 1").bind(PROJECT_ID, pageKey).first<any>()
    : await nextPageRow(env);
  if (!row) {
    return {
      ready: false,
      project_id: PROJECT_ID,
      reason: "no_generation_page_queued",
      do_not_invent_page_number: true,
      editorial_open_items: manifest.editorial_open_items,
      next_work: manifest.next_work,
    };
  }
  const page = pageView(row);
  const ids = page.allowed_reference_asset_ids as string[];
  const refs: any[] = [];
  for (const id of ids) {
    const asset = await env.DB.prepare("SELECT * FROM studio_assets WHERE project_id = ? AND id = ? AND reference_allowed = 1 LIMIT 1").bind(PROJECT_ID, id).first<any>();
    if (asset) refs.push(assetView(asset));
  }
  return {
    ready: Boolean(page.brief && refs.length === ids.length),
    project_id: PROJECT_ID,
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*" } });
    if (url.pathname === "/health") return json({ ok: true, service: "ogb-studio-web", mode: "plugin-free-read-fallback" });
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

    const prefix = `/v1/${env.STUDIO_WEB_TOKEN || ""}`;
    if (!env.STUDIO_WEB_TOKEN || !url.pathname.startsWith(prefix)) return json({ error: "not_found" }, 404);
    const action = url.pathname.slice(prefix.length) || "/status";

    try {
      if (action === "/status") return json(await status(env));
      if (action === "/project") return json(await project(env));
      if (action === "/next") return json(await next(env));
      if (action === "/packet") return json(await packet(env, url.searchParams.get("pageKey")));
      if (action === "/refs") {
        const category = url.searchParams.get("category");
        const includeNonReference = url.searchParams.get("includeNonReference") === "true";
        return json({ project_id: PROJECT_ID, references: await listAssets(env, category, includeNonReference) });
      }
      if (action === "/pages") {
        const result = await env.DB.prepare("SELECT * FROM studio_pages WHERE project_id = ? ORDER BY CASE WHEN page_number IS NULL THEN 1 ELSE 0 END, page_number ASC, created_at ASC").bind(PROJECT_ID).all<any>();
        return json({ project_id: PROJECT_ID, pages: (result.results || []).map(pageView) });
      }
      if (action === "/events") {
        const result = await env.DB.prepare("SELECT * FROM studio_events WHERE project_id = ? ORDER BY id DESC LIMIT 50").bind(PROJECT_ID).all<any>();
        return json({ project_id: PROJECT_ID, events: (result.results || []).map((row) => ({ ...row, data: parseJson(row.data_json, {}) })) });
      }
      return json({ error: "not_found" }, 404);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "studio_web_failed" }, 500);
    }
  },
};
