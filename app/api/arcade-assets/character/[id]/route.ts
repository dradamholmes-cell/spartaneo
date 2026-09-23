const CHARACTER_IDS = new Set([
  "adam", "sully", "streepy", "bueno", "kp", "bubba", "jubilee",
  "king_sully", "waylon", "brianna", "mikey", "mr_meena", "mystery_guest", "kars",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!CHARACTER_IDS.has(id)) {
    return new Response("Unknown arcade character", { status: 404 });
  }

  const upstream = `https://game.spartaneo.com/game-character-glb/${encodeURIComponent(id)}.game.glb`;
  try {
    const response = await fetch(upstream, {
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok || !response.body) {
      return new Response(`Character asset unavailable: ${id}`, { status: 502 });
    }
    return new Response(response.body, {
      status: 200,
      headers: {
        "content-type": response.headers.get("content-type") || "model/gltf-binary",
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
        "x-spartaneo-asset": id,
      },
    });
  } catch (error) {
    console.error("Arcade character proxy failed", id, error);
    return new Response(`Character asset load failed: ${id}`, { status: 502 });
  }
}
