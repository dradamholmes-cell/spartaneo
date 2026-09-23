# Spartaneo Arcade public dev preview

Current visual preview: **BUILD 20260923.02**

Pinned build:

https://raw.githack.com/dradamholmes-cell/spartaneo/ffbfd8c6d215c6c7e9463427cf8063ce9a4bd979/public/arcade-dev/v3.html

Branch-latest build:

https://raw.githack.com/dradamholmes-cell/spartaneo/arcade-n64-core/public/arcade-dev/v3.html

## V3 changes

- first-person arcade exploration; no placeholder block avatar in the middle of the screen
- rebuilt late-90s arcade room with patterned carpet, neon ceiling strips, posters, comic shelving, stools, vending machine and multiple cabinets
- smaller HUD and navigation
- proper translucent mobile thumbstick instead of four giant direction buttons
- visible build number in the lower-right corner
- bottom-sheet cabinet menu that never hands control to an iframe
- Ring Riot launches the existing live game in its own tab so the arcade page remains available underneath
- Back to Room and X both close the cabinet sheet locally
- Cart League remains marked coming soon until its Godot web build is connected

## What to test

1. Enter the arcade.
2. Walk with the mobile thumbstick, WASD/arrows, or a gamepad.
3. Approach **RING RIOT** and press A / E.
4. Confirm the cabinet sheet opens and both **BACK TO ROOM** and **X** work.
5. Press **PLAY RING RIOT** and confirm the live game opens.
6. Return to the arcade tab and continue walking.
7. Try **FULL** and **HOME**.

This branch is development-only. PR #1 stays draft and unmerged until the preview is tested in a normal browser.
