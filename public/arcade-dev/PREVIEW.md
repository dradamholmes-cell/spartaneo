# Spartaneo Arcade public dev preview

Current preview: **BUILD 20260924.07c — CUSTOM CHARACTER LAB + GAME HANDOFF**

Pinned build:

https://raw.githack.com/dradamholmes-cell/spartaneo/fb6b093e4231448131223ae1897b90de2f29d118/public/arcade-dev/v10.html

## What BUILD .07c adds

BUILD .07c wraps the existing .07b Character Forge instead of changing the approved lightweight room renderer.

- Generated-character library with active-character state.
- 3D GLB preview viewer with drag/orbit controls and mesh/triangle count.
- Forge job history with status/error display.
- Retry action for `daily_limit`, `needs_attention`, failed/error, and cancelled jobs.
- Cancel + source-photo cleanup for unfinished jobs.
- Deleting a generated character cleans its GLB/source objects, Forge job records, launch tickets, and active-character pointer.
- Short-lived custom-character launch tickets keep generated GLBs private instead of exposing permanent public asset URLs.
- Custom game handoff uses `character=custom:<id>`, `characterName=<name>`, and `characterModel=<ticketed GLB URL>`.
- Shared game helper: `public/arcade-dev/arcade-character-runtime.js`.
- Ring Riot dev shim now accepts a custom character as a real roster/fighter model when a valid Character Forge handoff is present.
- Dev-only Ring Riot test launcher: `public/arcade-dev/ring-riot-custom-test.html`.

## Character model endpoints

Signed-in account preview:

- `GET /api/arcade-account/characters/:id/model`

Game handoff:

- `POST /api/arcade-account/characters/:id/launch`
- `GET /api/arcade-character/:id/model?ticket=<short-lived-ticket>`

Game tickets are random, stored hashed in D1, expire after 30 minutes, and old expired tickets are pruned when new tickets are created.

## Existing .07b Character Forge

The underlying Forge remains locked to the observed Tencent flow:

- Hunyuan V3.1
- Image to 3D
- Single Image
- 50K
- GLB

Source photos use private `ARCADE_FILES` R2 storage. A successful GLB finalization clears the stored source-photo key and attempts to delete the source object immediately. Tencent passwords and email verification codes stay on Tencent.

Desktop helper lives at `tools/tencent-forge-helper/`. Android/mobile still has the manual GLB-import fallback.

## Hosting bindings

The dev branch declares:

- D1: `DB`
- R2: `ARCADE_FILES`

No production deployment or merge has been performed.

## Migration note

The Drizzle schema is the source of truth and now includes account/session data, Forge jobs, Tencent state, and custom-character launch tickets. `npm run db:generate` still needs to be run in the real project environment before the first persisted D1 dev deployment.

## Public preview limitations

RawGitHack cannot provide D1/R2 or first-party HttpOnly cookies, so the public build uses local preview account state. The GLB preview and real ticketed model handoff require the D1/R2 dev host because there is no real generated model file on RawGitHack.

The Social Lobby, parties, game floor and no-lag mobile renderer remain underneath from BUILD .06/.05.

This branch is development-only. PR #1 stays draft and unmerged.
