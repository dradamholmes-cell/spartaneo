CREATE TABLE `arcade_users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text,
  `username` text NOT NULL,
  `display_name` text,
  `password_hash` text,
  `is_guest` integer DEFAULT false NOT NULL,
  `active_character_id` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `arcade_users_username_uq` ON `arcade_users` (`username`);
--> statement-breakpoint
CREATE UNIQUE INDEX `arcade_users_email_uq` ON `arcade_users` (`email`);
--> statement-breakpoint
CREATE TABLE `arcade_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `arcade_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `arcade_sessions_token_uq` ON `arcade_sessions` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `arcade_sessions_user_idx` ON `arcade_sessions` (`user_id`);
--> statement-breakpoint
CREATE TABLE `arcade_characters` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `name` text NOT NULL,
  `source` text DEFAULT 'preset' NOT NULL,
  `status` text DEFAULT 'ready' NOT NULL,
  `preset_key` text,
  `glb_url` text,
  `preview_url` text,
  `provider_job_id` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `arcade_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `arcade_characters_user_idx` ON `arcade_characters` (`user_id`);
--> statement-breakpoint
CREATE TABLE `character_forge_jobs` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `character_id` text,
  `provider` text DEFAULT 'tencent-hunyuan' NOT NULL,
  `provider_job_id` text,
  `status` text DEFAULT 'draft' NOT NULL,
  `face_target` integer DEFAULT 50000 NOT NULL,
  `source_image_key` text,
  `output_glb_key` text,
  `error_code` text,
  `error_message` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `arcade_users`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`character_id`) REFERENCES `arcade_characters`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `character_forge_jobs_user_idx` ON `character_forge_jobs` (`user_id`);
--> statement-breakpoint
CREATE INDEX `character_forge_jobs_status_idx` ON `character_forge_jobs` (`status`);
--> statement-breakpoint
CREATE TABLE `tencent_connections` (
  `user_id` text PRIMARY KEY NOT NULL,
  `status` text DEFAULT 'not_connected' NOT NULL,
  `session_ref` text,
  `last_checked_at` integer,
  `needs_attention_reason` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `arcade_users`(`id`) ON UPDATE no action ON DELETE cascade
);
