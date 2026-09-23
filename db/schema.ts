import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const arcadeUsers = sqliteTable(
  "arcade_users",
  {
    id: text("id").primaryKey(),
    email: text("email"),
    username: text("username").notNull(),
    displayName: text("display_name"),
    passwordHash: text("password_hash"),
    isGuest: integer("is_guest", { mode: "boolean" }).notNull().default(false),
    activeCharacterId: text("active_character_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("arcade_users_username_uq").on(table.username),
    uniqueIndex("arcade_users_email_uq").on(table.email),
  ],
);

export const arcadeSessions = sqliteTable(
  "arcade_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => arcadeUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("arcade_sessions_token_uq").on(table.tokenHash),
    index("arcade_sessions_user_idx").on(table.userId),
  ],
);

export const arcadeCharacters = sqliteTable(
  "arcade_characters",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => arcadeUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    source: text("source").notNull().default("preset"),
    status: text("status").notNull().default("ready"),
    presetKey: text("preset_key"),
    glbUrl: text("glb_url"),
    previewUrl: text("preview_url"),
    providerJobId: text("provider_job_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("arcade_characters_user_idx").on(table.userId)],
);

export const characterForgeJobs = sqliteTable(
  "character_forge_jobs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => arcadeUsers.id, { onDelete: "cascade" }),
    characterId: text("character_id").references(() => arcadeCharacters.id, {
      onDelete: "set null",
    }),
    requestedName: text("requested_name").notNull().default("New Character"),
    provider: text("provider").notNull().default("tencent-hunyuan"),
    providerModel: text("provider_model").notNull().default("v3.1"),
    inputMode: text("input_mode").notNull().default("single_image"),
    outputFormat: text("output_format").notNull().default("glb"),
    providerJobId: text("provider_job_id"),
    status: text("status").notNull().default("draft"),
    faceTarget: integer("face_target").notNull().default(50000),
    sourceImageKey: text("source_image_key"),
    outputGlbKey: text("output_glb_key"),
    bridgeTokenHash: text("bridge_token_hash"),
    bridgeTokenExpiresAt: integer("bridge_token_expires_at", { mode: "timestamp_ms" }),
    claimedAt: integer("claimed_at", { mode: "timestamp_ms" }),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("character_forge_jobs_user_idx").on(table.userId),
    index("character_forge_jobs_status_idx").on(table.status),
  ],
);

export const tencentConnections = sqliteTable("tencent_connections", {
  userId: text("user_id")
    .primaryKey()
    .references(() => arcadeUsers.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("not_connected"),
  sessionRef: text("session_ref"),
  helperMode: text("helper_mode").notNull().default("browser_helper"),
  lastCheckedAt: integer("last_checked_at", { mode: "timestamp_ms" }),
  needsAttentionReason: text("needs_attention_reason"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
