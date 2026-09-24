# Spartaneo Arcade Core (development only)

This folder is an isolated prototype for the shared Spartaneo arcade shell. It is intentionally kept off the main site flow until it is tested and approved.

## Locked rules

- Render internally at low resolution and scale with `image-rendering: pixelated`.
- Keyboard, arrow keys, touch controls and Gamepad API all feed one input layer.
- Third-person camera follows player heading instead of a fixed world axis.
- Real assets fail loudly. Missing GLB/GLTF files never silently become cubes or placeholder characters.
- Simple primitive geometry is allowed only for explicitly labeled DEV/test-room scenery.
- Shared shell owns fullscreen, pause, sound, navigation and interaction prompts.
- Individual games keep their own gameplay logic.

## Source authority discovered

- Ring Riot source: Google Drive folder `ogb-wrestling` (Three.js).
- Cart League source: Google Drive folder `CART_LEAGUE_WORKING` (Godot 4).
- Ring Riot should be integrated first because it already uses Three.js/GLTF.
- Cart League stays Godot initially and will be wrapped by the same arcade shell instead of rewritten.

## Current prototype

Open `/arcade-dev/` on a branch preview. The room uses an explicit `DEV AVATAR` and simple test geometry. It verifies the shared renderer/input/camera/interaction layer before any real character model is copied in.
