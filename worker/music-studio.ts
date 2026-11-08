interface Env { ASSETS: { fetch(request: Request): Promise<Response> } }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/studio\/?/, "/");
    const asset = path === "/" || path === "/index.html" ? "/" : path;
    if (!["/", "/studio.css", "/studio.js", "/zombies-in-america-demo.mp3", "/zombies-in-america-lyrics.txt"].includes(asset)) {
      return new Response("Not found", { status: 404 });
    }
    const response = await env.ASSETS.fetch(new Request(new URL(asset, request.url), request));
    const headers = new Headers(response.headers);
    headers.set("Permissions-Policy", "microphone=(self)");
    headers.set("X-Content-Type-Options", "nosniff");
    if (asset === "/") headers.set("Cache-Control", "no-store");
    return new Response(response.body, { status: response.status, headers });
  },
};
