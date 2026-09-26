import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const manifestPath = path.join(ROOT, "data", "studio", "mostly-empty-somewhat-divine.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const projectId = "mostly-empty-somewhat-divine";
const packageName = manifest.source_package.filename;
const packageSha = manifest.source_package.sha256;
const q = (value) => `'${String(value).replaceAll("'", "''")}'`;
const slug = (value) => value.toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const basename = (value) => value.split("/").pop();
const refId = (p) => `me-ref-${slug(basename(p))}`;
const keeperId = (p) => `me-keeper-${slug(basename(p))}`;
const mime = (p) => p.toLowerCase().endsWith(".jpg") || p.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : p.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/png";
const fingerprint = `package-verified:${packageSha};individual-hash=pending`;
const lines = [
  "-- Generated from the authoritative 2026-09-25 Mostly Empty Studio manifest.",
  `UPDATE studio_projects SET state='repair_queue_active_not_final_assembly',updated_at=CURRENT_TIMESTAMP WHERE id=${q(projectId)};`,
];

for (const p of manifest.character_locks.paths) {
  lines.push(`INSERT OR REPLACE INTO studio_assets(id,project_id,page_id,character_id,category,storage_key,original_name,sha256,mime_type,byte_length,reference_allowed,created_at) VALUES(${q(refId(p))},${q(projectId)},NULL,NULL,'character_lock',${q(`libraryzip:${packageName}#${p}`)},${q(basename(p))},${q(fingerprint)},${q(mime(p))},NULL,1,CURRENT_TIMESTAMP);`);
}
for (const p of manifest.approved_keepers.paths) {
  lines.push(`INSERT OR REPLACE INTO studio_assets(id,project_id,page_id,character_id,category,storage_key,original_name,sha256,mime_type,byte_length,reference_allowed,created_at) VALUES(${q(keeperId(p))},${q(projectId)},NULL,NULL,'approved_keeper',${q(`libraryzip:${packageName}#${p}`)},${q(basename(p))},${q(fingerprint)},${q(mime(p))},NULL,1,CURRENT_TIMESTAMP);`);
}
const recovery = manifest.working_compilation.path;
lines.push(`INSERT OR REPLACE INTO studio_assets(id,project_id,page_id,character_id,category,storage_key,original_name,sha256,mime_type,byte_length,reference_allowed,created_at) VALUES('me-recovery-working-compilation',${q(projectId)},NULL,NULL,'working_recovery_pdf',${q(`libraryzip:${packageName}#${recovery}`)},${q(basename(recovery))},${q(fingerprint)},'application/pdf',NULL,0,CURRENT_TIMESTAMP);`);

const characterAssets = {
  "bob-lazar": ["Bob Lazar", ["me-ref-bob-lazar-exact-identity-crop"]],
  "david-meena": ["David Meena", ["me-ref-david-meena-exact-identity-lock"]],
  "bueno": ["Bueno", ["me-ref-bueno-exact-identity-crop", "me-ref-young-bueno-profile"]],
  "jfk": ["JFK", ["me-ref-jfk-exact-identity-crop"]],
  "aaron": ["Aaron", ["me-ref-aaron-exact-identity-crop", "me-ref-young-aaron-profile"]],
  "salma": ["Salma", ["me-ref-salma-brunette-crop", "me-ref-salma-red-crop"]],
  "josh": ["Josh / J Bones", ["me-ref-josh-exact-identity-crop", "me-ref-young-josh-j-bones-profile"]],
  "adam": ["Adam", ["me-ref-adam-exact-identity-crop", "me-ref-young-adam-lock"]],
  "hillori": ["Hillori", ["me-ref-hillori-character-lock-reference-sheet", "me-ref-young-mandy-hillori-profile"]],
  "streepy": ["Streepy", ["me-ref-young-streepy-profile"]],
  "sam": ["Sam", ["me-ref-young-sam-profile"]],
  "mandy": ["Mandy", ["me-ref-young-mandy-hillori-profile"]],
};
const charNote = "Current Studio package identity authority only. Never substitute older OGB continuity or rejected generations.";
for (const [id, [name, assetIds]] of Object.entries(characterAssets)) {
  lines.push(`INSERT OR REPLACE INTO studio_characters(id,project_id,slug,name,lock_state,notes,approved_asset_ids_json,created_at,updated_at) VALUES(${q(id)},${q(projectId)},${q(id)},${q(name)},'locked',${q(charNote)},${q(JSON.stringify(assetIds))},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);`);
}

const accessKeeper = manifest.approved_keepers.paths.find((p) => p.endsWith("KEEPER_ACCESS_PROBLEM.png"));
const davidLock = manifest.character_locks.paths.find((p) => p.endsWith("DAVID_MEENA_EXACT_IDENTITY_LOCK.png"));
if (!accessKeeper || !davidLock) throw new Error("Trusted Access Problem keeper or David Meena lock is missing from the manifest.");
const brief = "TARGETED REPAIR ONLY. Use KEEPER_ACCESS_PROBLEM.png as the exact base page. Replace only the incorrect David Meena portrayal with the exact DAVID_MEENA_EXACT_IDENTITY_LOCK.png identity. Preserve every other panel, face, pose, crop, background, composition, story beat, dialogue, lettering, and page proportions. Do not add or remove text. Do not import any old OGB continuity. Keep the page portrait and trim-safe. If an image edit can isolate David, edit only that region; do not redraw the whole page.";
lines.push(`INSERT OR REPLACE INTO studio_pages(id,project_id,page_key,page_number,title,status,brief,required_character_ids_json,allowed_reference_asset_ids_json,locked_asset_id,lettering_state,created_at,updated_at) VALUES('me-repair-access-problem-david',${q(projectId)},'repair-access-problem-david',NULL,'Access Problem — David Meena identity repair','not-started',${q(brief)},${q(JSON.stringify(["david-meena"]))},${q(JSON.stringify([keeperId(accessKeeper), refId(davidLock)]))},NULL,'preserve-existing',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);`);

lines.push(`DELETE FROM studio_events WHERE project_id=${q(projectId)} AND action IN('editorial_locks_frozen_2026_09_25','trusted_refs_indexed_2026_09_25','repair_page_queued_2026_09_25');`);
lines.push(`INSERT INTO studio_events(project_id,action,entity_type,entity_id,data_json,created_at) VALUES(${q(projectId)},'editorial_locks_frozen_2026_09_25','project',${q(projectId)},${q(JSON.stringify({opening_order:["KEEPER_DALLAS_JFK_SURVIVES.png","KEEPER_TIMELINE_SPLINTERS.png","KEEPER_LOUISVILLE_1995_BRIDGE.png"],opening_placement:"after initial cosmic foundation, before 1995/BABEL settles",reconnect_at:"KEEPER_PAGE38_THE_CALLBACK.png",final_page_numbers_frozen:false}))},CURRENT_TIMESTAMP);`);
lines.push(`INSERT INTO studio_events(project_id,action,entity_type,entity_id,data_json,created_at) VALUES(${q(projectId)},'trusted_refs_indexed_2026_09_25','project',${q(projectId)},${q(JSON.stringify({character_locks:19,approved_keepers:16,working_recovery_pdf_indexed:true,private_binary_storage:"pending",source:"trusted_library_zip"}))},CURRENT_TIMESTAMP);`);
lines.push(`INSERT INTO studio_events(project_id,action,entity_type,entity_id,data_json,created_at) VALUES(${q(projectId)},'repair_page_queued_2026_09_25','page','me-repair-access-problem-david',${q(JSON.stringify({reason:"Current package explicitly flags wrong David Meena in Access Problem; both exact keeper base and exact David identity lock are approved trusted assets.",page_number_intentionally_null:true}))},CURRENT_TIMESTAMP);`);

const tempSql = path.join(ROOT, "db", ".mostly-empty-studio-seed.sql");
fs.writeFileSync(tempSql, lines.join("\n") + "\n", "utf8");
try {
  const quotedSql = tempSql.replaceAll('"', '\\"');
  const command = `npx wrangler d1 execute ogb-studio --remote --file "${quotedSql}"`;
  execSync(command, {
    stdio: "inherit",
    cwd: ROOT,
    shell: process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "/bin/sh",
  });
  console.log("OGB Studio seeded: 19 character locks, 16 keepers, recovery PDF index, editorial locks, and first repair task.");
} finally {
  if (fs.existsSync(tempSql)) fs.unlinkSync(tempSql);
}
