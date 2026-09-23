export const GAMES = [
  {
    id: "ring-riot",
    title: "RING RIOT",
    subtitle: "OGB WRESTLING",
    engine: "threejs",
    status: "PLAYABLE DEV",
    color: 0xff3b55,
    position: [-4.2, 0, -5.5],
    copy: "The real Ring Riot game is wired into the Spartaneo Arcade shell for development testing. Solo play uses the existing combat, roster and animation systems. Online rooms remain on the live host until the shell is promoted.",
    launch: "./games/ring-riot/index.html?arcade=1"
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
    launch: null
  }
];

if (typeof window !== "undefined") {
  window.addEventListener("load", () => import("./launcher.js"), { once: true });
}
