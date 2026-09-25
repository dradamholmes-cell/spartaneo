import manifest from "../data/studio/mostly-empty-somewhat-divine.json";

type D1Prepared = {
  bind(...values: unknown[]): D1Prepared;
  run(): Promise<unknown>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
};

type D1Database = {
  prepare(sql: string): D1Prepared;
  batch(statements: D1Prepared[]): Promise<unknown[]>;
};

type Env = {
  DB: D1Database;
  STUDIO_MCP_TOKEN: string;
};

type RpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: any;
};

const PROJECT_ID = "mostly-empty-somewhat-divine";
const LIBRARY_FOLDER = "/BIG EPIC BOOK";
const LIBRARY_PACKAGE = "MOSTLY_EMPTY_STUDIO_MASTER_CORE_2026-09-25.zip";
const LIBRARY_PACKAGE_PATH = `${LIBRARY_FOLDER}/${LIBRARY_PACKAGE}`;
const WRITE_STATUSES = ["not-started", "draft", "revision", "keeper", "locked", "rejected"] as const;

const characterLockPaths = manifest.character_locks.paths as string[];
const keeperPaths = manifest.approved_keepers.paths as string[];
const provisionalPaths = manifest.provisional_reference.paths as string[];

const TOOL_DEFS = [
  {
    name: "studio_status",
    description: "Check OGB Studio health, project isolation, D1 state, and whether the current project is ready for page generation.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_projects",
    description: "List Studio projects persisted in D1. Projects are isolated; never mix references across project IDs.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_project",
    description: "Get the authoritative persisted Studio project state, story locks, QA rules, print rules, and source-package identity.",
    inputSchema: {
      type: "object",
      properties: { projectId: { type: "string", default: PROJECT_ID } },
      additionalProperties: false,
    },
  },
  {
    name: "list_locked_references",
    description: "List exact approved reference metadata for one project. Character locks and approved keepers are reference-allowed; provisional items are returned only when explicitly requested and cannot auto-promote.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", default: PROJECT_ID },
        category: {
          type: "string",
          enum: ["character_lock", "approved_keeper", "provisional_reference", "recovery_pdf", "generated_page"],
        },
        includeNonReference: { type: "boolean", default: false },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_reference",
    description: "Get one exact Studio asset/reference by deterministic asset ID or exact internal package path.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", default: PROJECT_ID },
        assetId: { type: "string" },
        internalPath: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "list_pages",
    description: "List page tasks for one project. Page numbers may be null until final pagination is frozen.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", default: PROJECT_ID },
        status: { type: "string", enum: WRITE_STATUSES },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_page",
    description: "Get one page task by page key.",
    inputSchema: {
      type: "object",
      required: ["pageKey"],
      properties: {
        projectId: { type: "string", default: PROJECT_ID },
        pageKey: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_next_page",
    description: "Return the next unfinished page task. If no page queue has been frozen yet, return the editorial gate instead of inventing a page number.",
    inputSchema: {
      type: "object",
      properties: { projectId: { type: "string", default: PROJECT_ID } },
      additionalProperties: false,
    },
  },
  {
    name: "get_generation_packet",
    description: "Return one safe generation packet: page brief, exact allowed references, print lock, story locks, QA rules, and Library package source. Never pulls unrelated OGB references.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", default: PROJECT_ID },
        pageKey: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "upsert_page",
    description: "Create or update a Studio page task only. This does not publish, charge, order, or export anything. Allowed reference IDs are validated to belong to this project and to be reference-allowed.",
    inputSchema: {
      type: "object",
      required: ["pageKey", "brief"],
      properties: {
        projectId: { type: "string", default: PROJECT_ID },
        pageKey: { type: "string" },
        pageNumber: { type: ["integer", "null"] },
        title: { type: ["string", "null"] },
        brief: { type: "string" },
        requiredCharacterIds: { type: "array", items: { type: "string" }, default: [] },
        allowedReferenceAssetIds: { type: "array", items: { type: "string" }, default: [] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "set_page_status",
    description: "Update only the internal Studio page status and audit log. Rejected pages are quarantined and can never become reference assets. This does not publish externally.",
    inputSchema: {
      type: "object",
      required: ["pageKey", "status"],
      properties: {
        projectId: { type: "string", default: PROJECT_ID },
        pageKey: { type: "string" },
        status: { type: "string", enum: WRITE_STATUSES },
        note: { type: "string" },
        lockedAssetId: { type: ["string", "null"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "register_library_asset",
    description: "Register metadata for a file already stored privately in the user's ChatGPT Library. The MCP server stores only the Library path/metadata in D1, not the binary file.",
    inputSchema: {
      type: "object",
      required: ["projectId", "category", "libraryPath", "originalName"],
      properties: {
        projectId: { type: "string" },
        pageKey: { type: ["string", "null"] },
        category: { type: "string" },
        libraryPath: { type: "string" },
        originalName: { type: "string" },
        sha256: { type: "string", default: "library-managed" },
        mimeType: { type: ["string", "null"] },
        byteLength: { type: ["integer", "null"] },
        referenceAllowed: { type: "boolean", default: false },
      },
      additionalProperties: false,
    },
  },
  {
    name: "list_events",
    description: "List recent audit events for one Studio project.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", default: PROJECT_ID },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
      },
      additionalProperties: false,
    },
  },
];

function slug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function assetId(category: string, path: string) {
  const base = path.split("/").pop() || path;
  return `${category}:${slug(base.replace(/\.[^.]+$/, ""))}`;
}

function projectGuard(projectId?: string) {
  const id = projectId || PROJECT_ID;
  if (id !== PROJECT_ID) throw new Error("unknown_or_isolated_project");
  return id;
}

function textResult(data: unknown, isError = false) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
    ...(isError ? { isError: true } : {}),
  };
}

function rpcResult(id: RpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function rpcError(id: RpcRequest["id"], code: number, message: string, data?: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data === undefined ? {} : { data }) } };
}

function responseJson(body: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, accept, mcp-session-id",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "cache-control": "no-store",
    },
  });
}

async function ensureSchema(env: Env) {
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS studio_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      isolation_key TEXT NOT NULL UNIQUE,
      state TEXT NOT NULL DEFAULT 'active',
      source_snapshot_sha256 TEXT,
      source_snapshot_label TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS studio_characters (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      lock_state TEXT NOT NULL DEFAULT 'locked',
      notes TEXT NOT NULL DEFAULT '',
      approved_asset_ids_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS studio_pages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      page_key TEXT NOT NULL,
      page_number INTEGER,
      title TEXT,
      status TEXT NOT NULL DEFAULT 'not-started',
      brief TEXT NOT NULL DEFAULT '',
      required_character_ids_json TEXT NOT NULL DEFAULT '[]',
      allowed_reference_asset_ids_json TEXT NOT NULL DEFAULT '[]',
      locked_asset_id TEXT,
      lettering_state TEXT NOT NULL DEFAULT 'unknown',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS studio_pages_project_key
      ON studio_pages(project_id, page_key)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS studio_assets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      page_id TEXT,
      character_id TEXT,
      category TEXT NOT NULL,
      storage_key TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      mime_type TEXT,
      byte_length INTEGER,
      reference_allowed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS studio_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      data_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
  ]);
}

async function ensureProject(env: Env) {
  await ensureSchema(env);
  const db = env.DB;
  const existing = await db.prepare("SELECT id FROM studio_projects WHERE id = ? LIMIT 1").bind(PROJECT_ID).first();
  if (!existing) {
    await db.batch([
      db.prepare(`INSERT INTO studio_projects
        (id, name, kind, isolation_key, state, source_snapshot_sha256, source_snapshot_label, metadata_json)
        VALUES (?, ?, 'comic', ?, ?, ?, ?, ?)`)
        .bind(
          PROJECT_ID,
          manifest.title,
          manifest.isolation.key,
          manifest.current_status,
          manifest.source_package.sha256,
          manifest.source_package.filename,
          JSON.stringify(manifest),
        ),
      db.prepare(`INSERT INTO studio_events
        (project_id, action, entity_type, entity_id, data_json)
        VALUES (?, 'import_snapshot', 'project', ?, ?)`)
        .bind(PROJECT_ID, PROJECT_ID, JSON.stringify({
          package_date: manifest.package_date,
          package_sha256: manifest.source_package.sha256,
          integrity_verified: manifest.source_package.integrity_verified,
          verified_files: manifest.source_package.verified_files,
        })),
    ]);
  }
  await seedManifestAssets(env);
}

async function seedManifestAssets(env: Env) {
  const db = env.DB;
  const rows: Array<{ category: string; path: string; referenceAllowed: boolean }> = [
    ...characterLockPaths.map((path) => ({ category: "character_lock", path, referenceAllowed: true })),
    ...keeperPaths.map((path) => ({ category: "approved_keeper", path, referenceAllowed: true })),
    ...provisionalPaths.map((path) => ({ category: "provisional_reference", path, referenceAllowed: false })),
    { category: "recovery_pdf", path: manifest.working_compilation.path, referenceAllowed: false },
  ];

  const statements = rows.map(({ category, path, referenceAllowed }) => {
    const id = assetId(category, path);
    const originalName = path.split("/").pop() || path;
    const storageKey = `libraryzip:${LIBRARY_PACKAGE_PATH}#${path}`;
    const mime = originalName.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : originalName.toLowerCase().endsWith(".jpg") || originalName.toLowerCase().endsWith(".jpeg")
        ? "image/jpeg"
        : "image/png";
    return db.prepare(`INSERT OR IGNORE INTO studio_assets
      (id, project_id, category, storage_key, original_name, sha256, mime_type, reference_allowed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`) 
      .bind(id, PROJECT_ID, category, storageKey, originalName, "package-hash-verified", mime, referenceAllowed ? 1 : 0);
  });
  if (statements.length) await db.batch(statements);
}

async function getProjectRow(env: Env) {
  await ensureProject(env);
  const row = await env.DB.prepare("SELECT * FROM studio_projects WHERE id = ? LIMIT 1").bind(PROJECT_ID).first<any>();
  if (!row) throw new Error("studio_project_missing");
  return row;
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
    source: internalPath ? {
      type: "chatgpt_library_zip",
      library_folder: LIBRARY_FOLDER,
      library_package: LIBRARY_PACKAGE,
      library_package_path: LIBRARY_PACKAGE_PATH,
      internal_path: internalPath,
      instruction: "Locate the exact ZIP in ChatGPT Library, materialize the ZIP, and extract only this internal path. Do not substitute a similarly named file.",
    } : {
      type: "chatgpt_library_file",
      library_path: row.storage_key.replace(/^library:/, ""),
    },
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

async function listAssets(env: Env, projectId: string, category?: string, includeNonReference = false) {
  projectGuard(projectId);
  await ensureProject(env);
  let sql = "SELECT * FROM studio_assets WHERE project_id = ?";
  const binds: unknown[] = [projectId];
  if (category) {
    sql += " AND category = ?";
    binds.push(category);
  }
  if (!includeNonReference) sql += " AND reference_allowed = 1";
  sql += " ORDER BY category ASC, original_name ASC";
  const result = await env.DB.prepare(sql).bind(...binds).all<any>();
  return (result.results || []).map(assetView);
}

async function getPageRow(env: Env, projectId: string, pageKey: string) {
  projectGuard(projectId);
  await ensureProject(env);
  return env.DB.prepare("SELECT * FROM studio_pages WHERE project_id = ? AND page_key = ? LIMIT 1")
    .bind(projectId, pageKey)
    .first<any>();
}

async function nextPageRow(env: Env, projectId: string) {
  projectGuard(projectId);
  await ensureProject(env);
  return env.DB.prepare(`SELECT * FROM studio_pages
      WHERE project_id = ? AND status NOT IN ('locked','rejected')
      ORDER BY CASE WHEN page_number IS NULL THEN 1 ELSE 0 END,
               page_number ASC,
               created_at ASC
      LIMIT 1`)
    .bind(projectId)
    .first<any>();
}

async function callTool(env: Env, name: string, args: any) {
  await ensureProject(env);

  if (name === "studio_status") {
    const [projects, pages, assets, events] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS n FROM studio_projects").first<any>(),
      env.DB.prepare("SELECT COUNT(*) AS n FROM studio_pages WHERE project_id = ?").bind(PROJECT_ID).first<any>(),
      env.DB.prepare("SELECT COUNT(*) AS n FROM studio_assets WHERE project_id = ?").bind(PROJECT_ID).first<any>(),
      env.DB.prepare("SELECT COUNT(*) AS n FROM studio_events WHERE project_id = ?").bind(PROJECT_ID).first<any>(),
    ]);
    const next = await nextPageRow(env, PROJECT_ID);
    return textResult({
      ok: true,
      codex_required: false,
      project_isolation: "strict",
      production_publish_exposed: false,
      charges_or_orders_exposed: false,
      d1: true,
      counts: {
        projects: Number(projects?.n || 0),
        pages: Number(pages?.n || 0),
        assets: Number(assets?.n || 0),
        events: Number(events?.n || 0),
      },
      current_project: PROJECT_ID,
      source_package: LIBRARY_PACKAGE_PATH,
      generation_ready: Boolean(next),
      generation_blocker: next ? null : "No page task is queued yet; freeze/create the next page task instead of inventing pagination.",
    });
  }

  if (name === "list_projects") {
    const result = await env.DB.prepare("SELECT * FROM studio_projects ORDER BY updated_at DESC, name ASC").all<any>();
    return textResult({ projects: result.results || [] });
  }

  if (name === "get_project") {
    const projectId = projectGuard(args?.projectId);
    const row = await getProjectRow(env);
    const persisted = parseJson(row.metadata_json, manifest);
    return textResult({
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
      projectId,
    });
  }

  if (name === "list_locked_references") {
    const projectId = projectGuard(args?.projectId);
    const includeNonReference = Boolean(args?.includeNonReference);
    const refs = await listAssets(env, projectId, args?.category, includeNonReference);
    return textResult({
      project_id: projectId,
      references: refs,
      count: refs.length,
      warning: includeNonReference
        ? "Non-reference/provisional assets are visible for inspection only. They may not auto-promote."
        : null,
    });
  }

  if (name === "get_reference") {
    const projectId = projectGuard(args?.projectId);
    if (!args?.assetId && !args?.internalPath) {
      return textResult({ error: "assetId_or_internalPath_required" }, true);
    }
    let row: any = null;
    if (args?.assetId) {
      row = await env.DB.prepare("SELECT * FROM studio_assets WHERE project_id = ? AND id = ? LIMIT 1")
        .bind(projectId, String(args.assetId)).first<any>();
    } else {
      const storageKey = `libraryzip:${LIBRARY_PACKAGE_PATH}#${String(args.internalPath)}`;
      row = await env.DB.prepare("SELECT * FROM studio_assets WHERE project_id = ? AND storage_key = ? LIMIT 1")
        .bind(projectId, storageKey).first<any>();
    }
    return row ? textResult({ reference: assetView(row) }) : textResult({ error: "reference_not_found" }, true);
  }

  if (name === "list_pages") {
    const projectId = projectGuard(args?.projectId);
    let sql = "SELECT * FROM studio_pages WHERE project_id = ?";
    const binds: unknown[] = [projectId];
    if (args?.status) {
      sql += " AND status = ?";
      binds.push(args.status);
    }
    sql += " ORDER BY CASE WHEN page_number IS NULL THEN 1 ELSE 0 END, page_number ASC, created_at ASC";
    const result = await env.DB.prepare(sql).bind(...binds).all<any>();
    return textResult({ project_id: projectId, pages: (result.results || []).map(pageView) });
  }

  if (name === "get_page") {
    const projectId = projectGuard(args?.projectId);
    const row = await getPageRow(env, projectId, String(args?.pageKey || ""));
    return row ? textResult({ page: pageView(row) }) : textResult({ error: "page_not_found" }, true);
  }

  if (name === "get_next_page") {
    const projectId = projectGuard(args?.projectId);
    const row = await nextPageRow(env, projectId);
    if (!row) {
      return textResult({
        ready: false,
        project_id: projectId,
        reason: "page_sequence_not_frozen_or_no_unfinished_page_is_queued",
        do_not_invent_page_number: true,
        editorial_open_items: manifest.editorial_open_items,
        next_work: manifest.next_work,
      });
    }
    return textResult({ ready: true, project_id: projectId, page: pageView(row) });
  }

  if (name === "get_generation_packet") {
    const projectId = projectGuard(args?.projectId);
    let row: any = null;
    if (args?.pageKey) row = await getPageRow(env, projectId, String(args.pageKey));
    else row = await nextPageRow(env, projectId);

    if (!row) {
      return textResult({
        ready: false,
        project_id: projectId,
        reason: "no_generation_page_queued",
        do_not_invent_page_number: true,
        editorial_open_items: manifest.editorial_open_items,
        next_work: manifest.next_work,
      });
    }

    const page = pageView(row);
    const ids = page.allowed_reference_asset_ids as string[];
    const refs: any[] = [];
    for (const id of ids) {
      const asset = await env.DB.prepare(
        "SELECT * FROM studio_assets WHERE project_id = ? AND id = ? AND reference_allowed = 1 LIMIT 1",
      ).bind(projectId, id).first<any>();
      if (asset) refs.push(assetView(asset));
    }

    const ready = Boolean(page.brief && refs.length === ids.length);
    return textResult({
      ready,
      project_id: projectId,
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
        "Use only the references listed in allowed_references for this page plus explicit project-level style locks if the page task names them.",
        "Never use rejected or provisional assets as automatic reference.",
        "Never retrieve across another OGB project.",
        "Generate one portrait page at a time unless a centerfold is explicitly called.",
        "Readable lettering is part of the finished page.",
      ],
    });
  }

  if (name === "upsert_page") {
    const projectId = projectGuard(args?.projectId);
    const pageKey = String(args?.pageKey || "").trim();
    const brief = String(args?.brief || "").trim();
    if (!pageKey || !brief) return textResult({ error: "pageKey_and_brief_required" }, true);

    const allowedIds = Array.isArray(args?.allowedReferenceAssetIds)
      ? args.allowedReferenceAssetIds.map(String)
      : [];
    for (const refId of allowedIds) {
      const ref = await env.DB.prepare(
        "SELECT id FROM studio_assets WHERE project_id = ? AND id = ? AND reference_allowed = 1 LIMIT 1",
      ).bind(projectId, refId).first<any>();
      if (!ref) return textResult({ error: "invalid_or_cross_project_reference", asset_id: refId }, true);
    }

    const requiredCharacterIds = Array.isArray(args?.requiredCharacterIds)
      ? args.requiredCharacterIds.map(String)
      : [];
    const id = `page:${projectId}:${slug(pageKey)}`;
    const current = await getPageRow(env, projectId, pageKey);
    if (current) {
      await env.DB.prepare(`UPDATE studio_pages
        SET page_number = ?, title = ?, brief = ?, required_character_ids_json = ?,
            allowed_reference_asset_ids_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND page_key = ?`)
        .bind(
          args?.pageNumber ?? null,
          args?.title ?? null,
          brief,
          JSON.stringify(requiredCharacterIds),
          JSON.stringify(allowedIds),
          projectId,
          pageKey,
        ).run();
    } else {
      await env.DB.prepare(`INSERT INTO studio_pages
        (id, project_id, page_key, page_number, title, status, brief,
         required_character_ids_json, allowed_reference_asset_ids_json)
        VALUES (?, ?, ?, ?, ?, 'not-started', ?, ?, ?)`) 
        .bind(
          id,
          projectId,
          pageKey,
          args?.pageNumber ?? null,
          args?.title ?? null,
          brief,
          JSON.stringify(requiredCharacterIds),
          JSON.stringify(allowedIds),
        ).run();
    }
    await env.DB.prepare(`INSERT INTO studio_events
      (project_id, action, entity_type, entity_id, data_json)
      VALUES (?, ?, 'page', ?, ?)`) 
      .bind(projectId, current ? "update_page_task" : "create_page_task", pageKey, JSON.stringify({
        page_number: args?.pageNumber ?? null,
        title: args?.title ?? null,
        allowed_reference_asset_ids: allowedIds,
      })).run();

    const saved = await getPageRow(env, projectId, pageKey);
    return textResult({ ok: true, page: pageView(saved) });
  }

  if (name === "set_page_status") {
    const projectId = projectGuard(args?.projectId);
    const pageKey = String(args?.pageKey || "").trim();
    const status = String(args?.status || "");
    if (!WRITE_STATUSES.includes(status as any)) return textResult({ error: "invalid_status" }, true);
    const page = await getPageRow(env, projectId, pageKey);
    if (!page) return textResult({ error: "page_not_found" }, true);

    let lockedAssetId = args?.lockedAssetId ?? page.locked_asset_id ?? null;
    if (lockedAssetId) {
      const asset = await env.DB.prepare(
        "SELECT * FROM studio_assets WHERE project_id = ? AND id = ? LIMIT 1",
      ).bind(projectId, String(lockedAssetId)).first<any>();
      if (!asset) return textResult({ error: "locked_asset_not_found_or_cross_project" }, true);
      if (status === "rejected") lockedAssetId = null;
    }

    await env.DB.prepare(`UPDATE studio_pages
      SET status = ?, locked_asset_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ? AND page_key = ?`)
      .bind(status, lockedAssetId, projectId, pageKey).run();

    if (status === "rejected") {
      await env.DB.prepare(`UPDATE studio_assets
        SET reference_allowed = 0
        WHERE project_id = ? AND page_id = ?`)
        .bind(projectId, page.id).run();
    }

    await env.DB.prepare(`INSERT INTO studio_events
      (project_id, action, entity_type, entity_id, data_json)
      VALUES (?, 'set_page_status', 'page', ?, ?)`) 
      .bind(projectId, pageKey, JSON.stringify({ status, note: args?.note || "", locked_asset_id: lockedAssetId })).run();

    const saved = await getPageRow(env, projectId, pageKey);
    return textResult({ ok: true, page: pageView(saved) });
  }

  if (name === "register_library_asset") {
    const projectId = projectGuard(args?.projectId);
    const category = String(args?.category || "").trim();
    const libraryPath = String(args?.libraryPath || "").trim();
    const originalName = String(args?.originalName || "").trim();
    if (!category || !libraryPath || !originalName) {
      return textResult({ error: "category_libraryPath_originalName_required" }, true);
    }
    const pageKey = args?.pageKey ? String(args.pageKey) : null;
    let pageId: string | null = null;
    if (pageKey) {
      const page = await getPageRow(env, projectId, pageKey);
      if (!page) return textResult({ error: "page_not_found" }, true);
      pageId = page.id;
    }

    const id = `library:${category}:${slug(originalName)}:${slug(libraryPath).slice(-24)}`;
    const isRejectedCategory = category.toLowerCase().includes("reject");
    const referenceAllowed = isRejectedCategory ? false : Boolean(args?.referenceAllowed);
    const storageKey = `library:${libraryPath}`;
    await env.DB.prepare(`INSERT OR REPLACE INTO studio_assets
      (id, project_id, page_id, category, storage_key, original_name, sha256, mime_type, byte_length, reference_allowed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`) 
      .bind(
        id,
        projectId,
        pageId,
        category,
        storageKey,
        originalName,
        String(args?.sha256 || "library-managed"),
        args?.mimeType ?? null,
        args?.byteLength ?? null,
        referenceAllowed ? 1 : 0,
      ).run();

    await env.DB.prepare(`INSERT INTO studio_events
      (project_id, action, entity_type, entity_id, data_json)
      VALUES (?, 'register_library_asset', 'asset', ?, ?)`) 
      .bind(projectId, id, JSON.stringify({
        category, library_path: libraryPath, page_key: pageKey, reference_allowed: referenceAllowed,
      })).run();

    const row = await env.DB.prepare("SELECT * FROM studio_assets WHERE id = ? LIMIT 1").bind(id).first<any>();
    return textResult({ ok: true, asset: assetView(row) });
  }

  if (name === "list_events") {
    const projectId = projectGuard(args?.projectId);
    const limit = Math.max(1, Math.min(100, Number(args?.limit || 25)));
    const result = await env.DB.prepare(
      "SELECT * FROM studio_events WHERE project_id = ? ORDER BY id DESC LIMIT ?",
    ).bind(projectId, limit).all<any>();
    return textResult({
      project_id: projectId,
      events: (result.results || []).map((row) => ({
        ...row,
        data: parseJson(row.data_json, {}),
      })),
    });
  }

  return textResult({ error: "unknown_tool", tool: name }, true);
}

async function handleRpc(env: Env, req: RpcRequest) {
  const method = req.method || "";
  if (method === "initialize") {
    return rpcResult(req.id, {
      protocolVersion: req.params?.protocolVersion || "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "OGB Studio", version: "1.0.0" },
      instructions: "Strict project isolation. Mostly Empty uses only its trusted Studio package and D1 state. No production publishing, charges, or orders are exposed.",
    });
  }
  if (method === "ping") return rpcResult(req.id, {});
  if (method === "tools/list") return rpcResult(req.id, { tools: TOOL_DEFS });
  if (method === "tools/call") {
    const toolName = String(req.params?.name || "");
    try {
      const result = await callTool(env, toolName, req.params?.arguments || {});
      return rpcResult(req.id, result);
    } catch (error) {
      return rpcResult(req.id, textResult({
        error: error instanceof Error ? error.message : "tool_failed",
        tool: toolName,
      }, true));
    }
  }
  if (method === "resources/list") return rpcResult(req.id, { resources: [] });
  if (method === "prompts/list") return rpcResult(req.id, { prompts: [] });
  if (method.startsWith("notifications/")) return null;
  return rpcError(req.id, -32601, "Method not found", { method });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return responseJson({ ok: true }, 204);
    if (url.pathname === "/health") {
      return responseJson({ ok: true, service: "ogb-studio-mcp", mcp: "/mcp/<private-token>" });
    }

    const expectedPath = `/mcp/${env.STUDIO_MCP_TOKEN || ""}`;
    if (!env.STUDIO_MCP_TOKEN || url.pathname !== expectedPath) {
      return responseJson({ error: "not_found" }, 404);
    }

    if (request.method === "GET") {
      return new Response(
        `event: endpoint\ndata: ${JSON.stringify({ ok: true, server: "OGB Studio", transport: "streamable-http" })}\n\n`,
        {
          status: 200,
          headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-store",
            "access-control-allow-origin": "*",
          },
        },
      );
    }

    if (request.method !== "POST") return responseJson({ error: "method_not_allowed" }, 405);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return responseJson(rpcError(null, -32700, "Parse error"), 400);
    }

    if (Array.isArray(body)) {
      const results = (await Promise.all(body.map((item) => handleRpc(env, item)))).filter(Boolean);
      return results.length ? responseJson(results) : new Response(null, { status: 202 });
    }

    const result = await handleRpc(env, body);
    if (!result) return new Response(null, { status: 202 });
    return responseJson(result);
  },
};
