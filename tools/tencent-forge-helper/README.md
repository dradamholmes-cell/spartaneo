# Spartaneo Character Forge Helper

Development-only Chrome/Chromium Manifest V3 helper for BUILD 20260923.07b.

## Purpose

The helper lets a Spartaneo user spend **their own Tencent Hunyuan 3D web generations**. It does not collect or store their Tencent password or email verification code.

Flow:

1. User signs into Spartaneo and creates a Character Forge job.
2. Spartaneo stores the source image in private R2 and mints a short-lived one-time bridge token.
3. The Spartaneo page sends the bridge job to this extension.
4. The extension opens `https://3d.hunyuan.tencent.com/` in the user's own browser.
5. If Tencent asks for login/email verification, automation pauses and the user completes Tencent's own UI directly.
6. The helper selects the observed Character Forge settings: **V3.1 / Image to 3D / Single Image / 50K / GLB**.
7. It uploads the source image, clicks **Generate Now**, waits for a download, and returns the GLB to the bridge endpoint.
8. Spartaneo validates glTF 2.0, stores the GLB in private R2, and registers it in **My Characters**.

If Tencent's free daily allowance is exhausted, the helper marks the connection/job `daily_limit` and stops. It does not rotate accounts or attempt to bypass quotas.

## Security

- No Tencent password or verification code is sent to Spartaneo.
- The extension uses the user's existing Tencent browser session.
- Source/output bridge access requires a random 256-bit token stored hashed in D1.
- Bridge tokens expire after 30 minutes and are cleared when a GLB is finalized.
- The extension only has host access to Spartaneo and `3d.hunyuan.tencent.com`.
- Generated GLBs and source images are intended for the private `ARCADE_FILES` R2 binding.

## Development install

Until this is packaged/published, desktop Chrome/Chromium testing is done with **Load unpacked** pointed at this directory.

Android Chrome does not provide the same extension path. BUILD .07b therefore also supports **manual GLB import** into the same Forge job after a user generates/downloads the model on Tencent themselves.

## Selector resilience

Tencent is a third-party UI and can change. `tencent.js` intentionally relies on visible labels such as `Image to 3D`, `Single Image`, `V3.1`, `50K`, `Generate Now`, and `Download` instead of private Tencent APIs. If a selector stops matching, the helper marks the job `needs_attention` rather than clicking unrelated controls or trying to bypass a challenge.

## Required Spartaneo infrastructure

- D1 binding: `DB`
- R2 binding: `ARCADE_FILES`

The repo currently keeps the Drizzle schema as source of truth. Generate/apply the migration only after the real D1 binding is provisioned.
