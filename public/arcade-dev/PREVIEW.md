# Spartaneo Arcade public dev preview

Current preview: **BUILD 20260923.07b — PER-USER TENCENT CHARACTER FORGE**

Pinned build:

https://raw.githack.com/dradamholmes-cell/spartaneo/37fb2a0c809e876a5f233d58c2dcfee0535f3c09/public/arcade-dev/v9.html

## What BUILD .07b adds

BUILD .07b keeps the approved lightweight Social Lobby/arcade renderer underneath and extends .07a into the real Character Forge handoff.

- Spartaneo accounts + My Characters remain the ownership layer.
- Character Forge jobs are locked to the observed Tencent flow: **Hunyuan V3.1 / Image to 3D / Single Image / 50K / GLB**.
- Source photo upload endpoint stores the user's image in the private `ARCADE_FILES` R2 binding.
- One-time 256-bit browser-helper bridge tokens are stored hashed and expire after 30 minutes.
- Per-user Tencent connection state: `not_connected`, `pending_login`, `connected`, `daily_limit`, or `needs_attention`.
- Desktop browser-helper contract opens Tencent in the user's own browser/session; Spartaneo never asks for or stores their Tencent password or email verification code.
- The helper pauses when Tencent login/verification is needed and resumes after the user completes Tencent's own UI.
- Helper automation targets visible UI labels rather than private Tencent endpoints: V3.1, Single Image, 50K, Generate Now, Download.
- When the daily free allowance is exhausted, the job becomes `daily_limit`; the helper stops rather than rotating/bypassing accounts.
- Generated GLB is validated as glTF 2.0, stored in R2, and registered in My Characters.
- Android/mobile fallback lets the user generate/download on Tencent normally and import the GLB into the same Forge job.

## Browser helper

Development helper lives at:

`tools/tencent-forge-helper/`

Files:

- `manifest.json`
- `background.js`
- `spartaneo.js`
- `tencent.js`
- `README.md`

This is desktop Chrome/Chromium development tooling for now. Android Chrome uses the manual GLB-return path.

## Forge API / storage surface

Account-facing:

- `GET|POST /api/arcade-account/forge-jobs`
- `POST /api/arcade-account/forge-jobs/:id/source`
- `POST /api/arcade-account/forge-jobs/:id/bridge`
- `GET /api/arcade-account/forge-jobs/:id/output`
- `POST /api/arcade-account/forge-jobs/:id/manual-output`
- `GET|POST /api/arcade-account/tencent`

Short-lived helper bridge:

- `GET /api/forge-bridge/jobs/:id/source`
- `POST /api/forge-bridge/jobs/:id/status`
- `POST /api/forge-bridge/jobs/:id/output`

## Hosting bindings

The dev branch now declares the bindings expected by the code:

- D1: `DB`
- R2: `ARCADE_FILES`

The repo's Sites/Vite plugin already maps the names declared in `.openai/hosting.json` into local Cloudflare bindings. No production deployment or merge has been performed.

## Migration note

The Drizzle schema is the source of truth. `npm run db:generate` still needs to be run in a real project environment after/before provisioning the deployed D1 schema; the branch intentionally does not carry a guessed hand-written migration.

## Public preview limitations

RawGitHack cannot provide D1/R2 or first-party HttpOnly cookies, so the pinned build uses **LOCAL PREVIEW** account state. It demonstrates the .07b UI, phone/manual return path, and full underlying arcade, but a real Tencent bridge job can only run when the same build is served from the Spartaneo host with D1/R2 available.

The Social Lobby, parties, game floor and no-lag mobile renderer remain underneath from BUILD .06/.05.

This branch is development-only. PR #1 stays draft and unmerged.
