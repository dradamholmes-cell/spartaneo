const MOVES_URL = "https://game.spartaneo.com/games/ogb-wrestling/animations/moves-v1.json?v=26";

export async function GET() {
  try {
    const response = await fetch(MOVES_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok || !response.body) {
      return new Response("Ring Riot animation pack unavailable", { status: 502 });
    }
    return new Response(response.body, {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Ring Riot animation proxy failed", error);
    return new Response("Ring Riot animation pack load failed", { status: 502 });
  }
}
