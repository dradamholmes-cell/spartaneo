const STATIC_PREVIEW = ['raw.githack.com', 'cdn.jsdelivr.net'].includes(globalThis.location?.hostname || '');

export const GAMES = [
  {
    id: "ring-riot",
    title: "RING RIOT",
    subtitle: "OGB WRESTLING",
    engine: "threejs",
    status: STATIC_PREVIEW ? "PLAYABLE PREVIEW" : "PLAYABLE DEV",
    color: 0xff3b55,
    position: [-4.2, 0, -5.5],
    copy: STATIC_PREVIEW
      ? "Public branch preview: this cabinet launches the existing live Ring Riot game inside the new Spartaneo Arcade shell. Use this to test the room, cabinet interaction, game launch, fullscreen and return-to-arcade flow before the full embedded dev build is hosted."
      : "The real Ring Riot game is wired into the Spartaneo Arcade shell for development testing. Solo play uses the existing combat, roster and animation systems. Online rooms remain on the live host until the shell is promoted.",
    launch: STATIC_PREVIEW
      ? "https://game.spartaneo.com/games/ogb-wrestling/"
      : "./games/ring-riot/index.html?arcade=1",
    externalPreview: STATIC_PREVIEW
  },
  {
    id: "cart-league",
    title: "CART LEAGUE",
    subtitle: "GOLF CART CHAOS",
    engine: "godot",
    status: "SOURCE FOUND",
    color: 0x38ff82,
    position: [4.2, 0, -5.5],
    copy: "Godot source located in CART_LEAGUE_WORKING, including the real golf-cart GLB. It stays Godot for now and will use the same Spartaneo shell.",
    launch: null,
    externalPreview: false
  }
];

if (typeof window !== "undefined") {
  window.addEventListener("load", () => import("./launcher.js"), { once: true });
}
