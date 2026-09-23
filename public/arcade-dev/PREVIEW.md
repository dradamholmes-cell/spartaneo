# Spartaneo Arcade public dev preview

Current mobile preview: **BUILD 20260923.05**

Pinned build:

https://raw.githack.com/dradamholmes-cell/spartaneo/9b13a2f0569873158802cf04375c4fde2a07bd57/public/arcade-dev/v6.html

## Full floor

The phone-safe performance baseline from BUILD 20260923.03 is preserved:

- 480×270 internal render on phones, 640×360 on desktop.
- Mobile render capped around 30 FPS.
- No dynamic point lights, animated cabinet glow, or heavy lobby GLBs.
- First-person mobile thumbstick + A button.
- Visible build number.
- Local cabinet sheet with BACK TO ROOM and X controls.
- Games launch separately so the lightweight arcade remains available underneath.

## Playable cabinets

1. Ring Riot — `https://spartaneo.com/games/ogb-wrestling/`
2. Cart League — `https://comics.spartaneo.com/games/ogb-cart-league`
3. OGB Bowl-O-Rama — `https://spartaneo.com/games/ogb-bowling/`
4. Sully's Soiree — `https://spartaneo.itch.io/sullys-soiree`
5. Bigfoot's Lair — `https://spartaneo.com/bigfoots-lair/`
6. Oh! So You Think You Can Highschool Musical? — `https://spartaneo.com/highschool-musical/`

## Coming-soon cabinets

- Tennis
- Pool
- Mini Golf
- Basketball
- Darts 301
- Werewolf / Mafia

## Catalog

BUILD 20260923.05 adds a **CATALOG** button so every machine can be opened from a lightweight list without walking across the room. Physical cabinets remain in the room as well.

This branch is development-only. PR #1 stays draft and unmerged until the full-floor build is tested.
