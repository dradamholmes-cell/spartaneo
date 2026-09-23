# Spartaneo Arcade integration contract

The shell and games stay separate. Gameplay code remains owned by each game; the shared shell owns navigation, fullscreen, sound state, pause state, loading/errors and cross-game UX.

## Ring Riot

Source authority: Google Drive folder `ogb-wrestling`.

Ring Riot already uses Three.js and GLTFLoader. The first integration should keep `combat.js`, `fighters.js`, `rig-animations.js`, `multiplayer.js`, `presentation.js` and audio logic intact. Add `bridge.js`, report `game-ready`, and map shell pause/sound/exit messages to the existing Ring Riot controls.

Do not replace missing wrestler GLBs with primitive fighters. A required fighter asset should fail with a visible asset error.

## Cart League

Source authority: Google Drive folder `CART_LEAGUE_WORKING`.

Keep the existing Godot project and HTML5/WebGL export. The real cart asset is `ogb-golf-cart.mobile.glb`; primitive carts are not an acceptable production fallback.

The exported page should use a tiny JavaScript bridge around the Godot canvas to relay shell pause/fullscreen/sound/exit events. The Godot driving, ball physics, controller map, boost, drift and camera systems remain in Godot.

## Shared requirements

- keyboard + arrows + gamepad + touch
- 60 degree third-person camera where applicable
- internal low-resolution rendering / pixel scaling where applicable
- no silent primitive fallback for named production assets
- explicit DEV placeholders are allowed only in the isolated test room
- same Spartaneo shell for Back to Arcade, Fullscreen, Sound, Pause, Share
- games expose readiness and errors instead of failing silently
