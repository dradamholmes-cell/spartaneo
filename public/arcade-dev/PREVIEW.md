# Spartaneo Arcade public dev preview

Open this development-only branch build:

https://raw.githack.com/dradamholmes-cell/spartaneo/arcade-n64-core/public/arcade-dev/index.html

## What to test

1. Enter the test room.
2. Move with WASD / arrow keys, gamepad, or the on-screen mobile controls.
3. Walk to the **RING RIOT** cabinet and interact with it.
4. Press **PLAY RING RIOT**.
5. In this public static preview only, the cabinet embeds the existing live Ring Riot game so its real models/assets stay on the live game host.
6. Test a match, then use **BACK TO ARCADE** to return to the room.
7. Test **FULLSCREEN** from the arcade shell.

The public static preview intentionally hides the shell-level Pause and Sound controls while the cross-site live Ring Riot iframe is open. Those controls are part of the same-origin embedded dev integration and are not being faked here.

Cart League is not launchable in this preview yet.

This branch is development-only. PR #1 stays draft and unmerged until the preview is tested in a normal browser.
