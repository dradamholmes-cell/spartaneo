# Spartaneo Arcade public dev preview

Current mobile preview: **BUILD 20260923.06 — SOCIAL LOBBY**

Pinned build:

https://raw.githack.com/dradamholmes-cell/spartaneo/4fbfe620ff4c941f78d1b37994d82948e29ee1d5/public/arcade-dev/v7.html

## What BUILD .06 adds

BUILD .06 wraps the proven no-lag BUILD .05 room instead of changing its renderer.

- Character picker before entering the arcade.
- Character choice persists in localStorage.
- Character button lets you switch later without rebuilding the room.
- Party drawer with six-character create/join/share flow.
- Ready toggle and four party slots.
- Party chat drawer with locally persisted messages.
- BroadcastChannel presence/chat across same-origin preview tabs.
- Character and party code are appended to game launch URLs as integration hooks.
- Visible BUILD 20260923.06 tag.
- Existing full floor, catalog, mobile thumbstick, 480×270 phone render, and 30 FPS cap remain underneath from BUILD .05.

## Live backend status

The recovered Social Arcade backend is real and includes authenticated friends/DM routes plus ChatRoom, GameRoom, and PresenceHub Durable Objects. The recovered ChatPage connects to `/ws/chat/<conversationId>` and sends `send_message` packets.

**Cross-device party/chat sync is NOT claimed connected in this preview yet.** BUILD .06 deliberately labels its party/chat sync as local/tabs while the existing authenticated Social Arcade identity/conversation model is bridged into this room.

## Game launch contract

Playable game URLs receive:

- `arcade=1`
- `character=<selected_character_id>`
- `party=<party_code>` when a party exists

Games that do not yet consume these query parameters simply ignore them. The parameters establish one shared integration contract for future upgrades.

This branch is development-only. PR #1 stays draft and unmerged until the social-lobby build is tested.
