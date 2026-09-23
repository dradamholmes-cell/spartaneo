# Spartaneo Arcade public dev preview

Current mobile preview: **BUILD 20260923.04**

Pinned build:

https://raw.githack.com/dradamholmes-cell/spartaneo/8577f6d4172e2b6aef55840d34ea9c800b69df21/public/arcade-dev/v5.html

## What changed from .03

- Kept the phone-safe 480×270 render and mobile frame cap.
- Kept the cheap lighting/material path that eliminated the walking lag.
- **Ring Riot** remains playable from the left cabinet.
- **Cart League** is now playable from the right cabinet.
- Cart League launches the already-deployed Spartaneo Godot wrapper at `https://comics.spartaneo.com/games/ogb-cart-league` rather than rewriting or re-exporting the game.
- The deployed Cart League wrapper retains its mobile controls/fullscreen shell and real golf-cart GLB.
- Both games open separately so the lightweight arcade room remains available to return to.
- Visible build number remains in the HUD.

## Test order

1. Enter the arcade and confirm walking is still smooth.
2. Open Ring Riot from the left cabinet.
3. Return to the arcade tab.
4. Open Cart League from the right cabinet.
5. In Cart League, verify the game loads, the cart looks like the real cart rather than a primitive, and the phone controls respond.

This branch is development-only. PR #1 stays draft and unmerged until the two-game build is tested.
