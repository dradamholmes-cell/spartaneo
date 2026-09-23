# Spartaneo Arcade public dev preview

Current mobile preview: **BUILD 20260923.03**

Pinned build:

https://raw.githack.com/dradamholmes-cell/spartaneo/58e00f273cc76b761786b426d0375716a651fb10/public/arcade-dev/v4.html

Branch-latest build:

https://raw.githack.com/dradamholmes-cell/spartaneo/arcade-n64-core/public/arcade-dev/v4.html

## Build 20260923.03 changes

- mobile-first performance pass after V3 proved too laggy on Android
- 480×270 internal render on phones; 640×360 on desktop
- phone render capped around 30 FPS
- removed dynamic point lights, tone mapping, animated cabinet screens, and most decorative 3D geometry on mobile
- kept patterned arcade carpet, main cabinets, wall branding and neon accents with much cheaper materials
- first-person movement with one translucent thumbstick + A button
- visible build number in the HUD
- local cabinet sheet with BACK TO ROOM and X controls
- Ring Riot link corrected to the route used by the live Spartaneo arcade: https://spartaneo.com/games/ogb-wrestling/
- Cart League remains marked coming soon until its Godot web build is connected

## What to test next

1. Confirm walking is smooth enough to use on the phone.
2. Approach RING RIOT and press A.
3. Confirm BACK TO ROOM and X both work.
4. Press PLAY RING RIOT and confirm the game route opens instead of returning a 404.
5. Try FULL and HOME.

This branch is development-only. PR #1 stays draft and unmerged until the mobile build is tested.
