import { env } from "cloudflare:workers";

type Prepared = {
  bind(...values: unknown[]): Prepared;
  run(): Promise<unknown>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
};

type StudioD1 = {
  prepare(sql: string): Prepared;
  batch(statements: Prepared[]): Promise<unknown[]>;
};

export type StudioProjectRow = {
  id: string;
  name: string;
  kind: string;
  isolation_key: string;
  state: string;
  source_snapshot_sha256: string | null;
  source_snapshot_label: string | null;
  metadata_json: string;
  created_at: string;
  updated_at: string;
};

function db(): StudioD1 {
  const binding = (env as unknown as { DB?: StudioD1 }).DB;
  if (!binding) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  return binding;
}

export async function ensureStudioSchema() {
  const database = db();
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS studio_projects (
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
    database.prepare(`CREATE TABLE IF NOT EXISTS studio_characters (
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
    database.prepare(`CREATE TABLE IF NOT EXISTS studio_pages (
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
    database.prepare(`CREATE TABLE IF NOT EXISTS studio_assets (
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
    database.prepare(`CREATE TABLE IF NOT EXISTS studio_events (
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

export async function getOrSeedProject(manifest: any): Promise<StudioProjectRow> {
  await ensureStudioSchema();
  const database = db();
  const id = String(manifest.book_id);
  let row = await database
    .prepare("SELECT * FROM studio_projects WHERE id = ? LIMIT 1")
    .bind(id)
    .first<StudioProjectRow>();

  if (!row) {
    const metadata = JSON.stringify(manifest);
    await database.batch([
      database
        .prepare(`INSERT INTO studio_projects
          (id, name, kind, isolation_key, state, source_snapshot_sha256, source_snapshot_label, metadata_json)
          VALUES (?, ?, 'comic', ?, ?, ?, ?, ?)`)
        .bind(
          id,
          String(manifest.title),
          String(manifest.isolation.key),
          String(manifest.current_status),
          String(manifest.source_package.sha256),
          String(manifest.source_package.filename),
          metadata,
        ),
      database
        .prepare(`INSERT INTO studio_events
          (project_id, action, entity_type, entity_id, data_json)
          VALUES (?, 'import_snapshot', 'project', ?, ?)`)
        .bind(
          id,
          id,
          JSON.stringify({
            package_date: manifest.package_date,
            package_sha256: manifest.source_package.sha256,
            integrity_verified: manifest.source_package.integrity_verified,
            verified_files: manifest.source_package.verified_files,
          }),
        ),
    ]);

    row = await database
      .prepare("SELECT * FROM studio_projects WHERE id = ? LIMIT 1")
      .bind(id)
      .first<StudioProjectRow>();
  }

  if (!row) throw new Error("studio_project_seed_failed");
  return row;
}

export async function listStudioProjects(): Promise<StudioProjectRow[]> {
  await ensureStudioSchema();
  const result = await db()
    .prepare("SELECT * FROM studio_projects ORDER BY updated_at DESC, name ASC")
    .all<StudioProjectRow>();
  return result.results || [];
}

export function parseProjectMetadata(row: StudioProjectRow) {
  try {
    return JSON.parse(row.metadata_json || "{}");
  } catch {
    return {};
  }
}
