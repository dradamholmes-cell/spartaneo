import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const studioProjects = sqliteTable("studio_projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  isolationKey: text("isolation_key").notNull().unique(),
  state: text("state").notNull().default("active"),
  sourceSnapshotSha256: text("source_snapshot_sha256"),
  sourceSnapshotLabel: text("source_snapshot_label"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const studioCharacters = sqliteTable("studio_characters", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  lockState: text("lock_state").notNull().default("locked"),
  notes: text("notes").notNull().default(""),
  approvedAssetIdsJson: text("approved_asset_ids_json").notNull().default("[]"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const studioPages = sqliteTable("studio_pages", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  pageKey: text("page_key").notNull(),
  pageNumber: integer("page_number"),
  title: text("title"),
  status: text("status").notNull().default("not-started"),
  brief: text("brief").notNull().default(""),
  requiredCharacterIdsJson: text("required_character_ids_json").notNull().default("[]"),
  allowedReferenceAssetIdsJson: text("allowed_reference_asset_ids_json").notNull().default("[]"),
  lockedAssetId: text("locked_asset_id"),
  letteringState: text("lettering_state").notNull().default("unknown"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const studioAssets = sqliteTable("studio_assets", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  pageId: text("page_id"),
  characterId: text("character_id"),
  category: text("category").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  originalName: text("original_name").notNull(),
  sha256: text("sha256").notNull(),
  mimeType: text("mime_type"),
  byteLength: integer("byte_length"),
  referenceAllowed: integer("reference_allowed").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const studioEvents = sqliteTable("studio_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: text("project_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  dataJson: text("data_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
