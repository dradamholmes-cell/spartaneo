# Spartaneo Arcade public dev preview

Current preview: **BUILD 20260923.07a — ACCOUNTS + CHARACTER LIBRARY**

Pinned build:

https://raw.githack.com/dradamholmes-cell/spartaneo/4e2dc855cd6e76528337e5025718afea4a175d70/public/arcade-dev/v8.html

## What BUILD .07a adds

BUILD .07a wraps the existing Social Lobby and starts the real Character Forge account foundation without changing the proven lightweight 3D renderer.

- Spartaneo account screen: create account, log in, or continue as guest.
- Email-first registration while preserving Social Arcade username/password and guest semantics.
- Secure PBKDF2-SHA256 password hashing and HttpOnly session-cookie helpers in the server implementation.
- `arcade_users`, `arcade_sessions`, `arcade_characters`, `character_forge_jobs`, and `tencent_connections` Drizzle schema.
- My Characters library.
- Active/default character per account.
- Add the current stock arcade character to My Characters.
- Use/delete saved character controls.
- Character Forge panel with photo selection, Tencent provider status, Single Image mode, and **50K face target locked in**.
- Create a 50K Forge draft job for signed-in non-guest accounts.
- Account `/me` response includes saved characters, recent Forge jobs, and Tencent connection state.

## Account API added

- `POST /api/arcade-account/register`
- `POST /api/arcade-account/login`
- `POST /api/arcade-account/guest`
- `POST /api/arcade-account/logout`
- `GET /api/arcade-account/me`
- `POST /api/arcade-account/characters`
- `POST /api/arcade-account/characters/:id/active`
- `DELETE /api/arcade-account/characters/:id`
- `GET|POST /api/arcade-account/forge-jobs`

## Public preview mode

RawGitHack cannot host Spartaneo's D1 API or first-party HttpOnly cookie, so the pinned public preview intentionally uses **LOCAL PREVIEW** account storage while demonstrating the exact UI flow. When served from Spartaneo with D1 bound, it attempts the real account API instead.

## Infrastructure blocker before real account persistence

`.openai/hosting.json` currently has `"d1": null`. The Drizzle schema is now the source of truth; create/bind the D1 database and run `npm run db:generate` before deploying the account backend. A premature hand-written migration was deliberately removed so Drizzle migration metadata cannot silently drift.

## Tencent status

`.07a` does **not** collect Tencent credentials and does not send the selected photo anywhere. Per-user Tencent connection/session automation is the `.07b` step.

The full Social Lobby, party UI, game floor and no-lag mobile renderer remain underneath from BUILD .06/.05.

This branch is development-only. PR #1 stays draft and unmerged.
