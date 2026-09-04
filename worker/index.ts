/** Cloudflare Worker entry point for Spartaneo / OGB. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
  PRINTIFY_API_TOKEN?: string;
  PRINTIFY_SHOP_ID?: string;
  SETUP_ADMIN_TOKEN?: string;
  MERCH_STORE_URL?: string;
  PRINTIFY_WEBHOOK_SECRET?: string;
  PRINTIFY_EVENTS?: KVNamespace;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type StorefrontProduct = {
  id: string;
  title: string;
  image: string;
  price: number;
  buy_url: string;
  product_type: "t-shirt" | "hoodie" | "sweatshirt" | "wall-art" | "hat" | "other";
};

const printifyStorefrontUrl = "https://spartaneo.printify.me/products";

// Public checkout listings used only if Printify's public collection page is temporarily unavailable.
// These contain no account credentials and every URL is an already-published product.
const storefrontFallback: StorefrontProduct[] = [
  { id: "31633214", title: "Her Light Still Shines Memorial Poster", image: "https://images-api.printify.com/mockup/6a9a7e0126ca2a0ca1012f74/114557/106501/her-light-still-shines-memorial-poster.jpg?camera_label=front", price: 1799, buy_url: "https://spartaneo.printify.me/product/31633214", product_type: "wall-art" },
  { id: "31633037", title: "Same Soul, Better View Memorial Hoodie | Angel Tribute Pullover", image: "https://images-api.printify.com/mockup/6a99e0b6420d45a6370bef02/32912/98424/same-soul-better-view-memorial-hoodie-angel-tribute-pullover.jpg?camera_label=front", price: 3597, buy_url: "https://spartaneo.printify.me/product/31633037", product_type: "hoodie" },
  { id: "31633029", title: "Memorial Acrylic Wall Art Panel — Personalized Angel Tribute with Name & Dates", image: "https://images-api.printify.com/mockup/6a9a76dc5d46b4504b0e1774/82057/110751/memorial-acrylic-wall-art-panel-personalized-angel-tribute-with-name-dates.jpg?camera_label=front", price: 2365, buy_url: "https://spartaneo.printify.me/product/31633029", product_type: "wall-art" },
  { id: "31615561", title: "Same Soul Better View Matte Canvas Wall Art — Inspirational Christian Memorial Print", image: "https://images-api.printify.com/mockup/6a99e16a420d45a6370bef59/101413/95788/same-soul-better-view-matte-canvas-wall-art-inspirational-christian-memorial-print.jpg?camera_label=front", price: 2499, buy_url: "https://spartaneo.printify.me/product/31615561", product_type: "wall-art" },
  { id: "31615546", title: "SULLIVAN Classic Dad Cap | Family Name Hat", image: "https://images-api.printify.com/mockup/6a99e1dd71912d77ed0a0622/105381/135042/sullivan-classic-dad-cap-family-name-hat.jpg?camera_label=front", price: 2999, buy_url: "https://spartaneo.printify.me/product/31615546", product_type: "hat" },
  { id: "31608157", title: "Same Soul Better View sweatshirt | Angel wings memorial artwork", image: "https://images-api.printify.com/mockup/6a9953b4be182bd8450de122/25459/98502/same-soul-better-view-sweatshirt-angel-wings-memorial-artwork.jpg?camera_label=front", price: 4028, buy_url: "https://spartaneo.printify.me/product/31608157", product_type: "sweatshirt" },
  { id: "31608156", title: "The Sullivan Name Crest T-Shirt | Family Coat of Arms Tee", image: "https://images-api.printify.com/mockup/6a9953b9be182bd8450de124/12124/92570/the-sullivan-name-crest-t-shirt-family-coat-of-arms-tee.jpg?camera_label=front", price: 2637, buy_url: "https://spartaneo.printify.me/product/31608156", product_type: "t-shirt" },
  { id: "31608153", title: "Her Light Still Shines Angel Memorial T-Shirt | The Sullivan Name Backprint", image: "https://images-api.printify.com/mockup/6a9953bfbe182bd8450de126/105601/102287/her-light-still-shines-angel-memorial-t-shirt-the-sullivan-name-backprint.jpg?camera_label=front", price: 3052, buy_url: "https://spartaneo.printify.me/product/31608153", product_type: "t-shirt" },
  { id: "31608150", title: "Celebrating Name Memorial Photo T-Shirt | Personalized Funeral Tribute", image: "https://images-api.printify.com/mockup/6a9953c2be182bd8450de128/105553/102287/celebrating-name-memorial-photo-t-shirt-personalized-funeral-tribute.jpg?camera_label=front", price: 1957, buy_url: "https://spartaneo.printify.me/product/31608150", product_type: "t-shirt" },
  { id: "31608149", title: "Soul Lovin' Sullivan band artwork T-Shirt | rock tour poster", image: "https://images-api.printify.com/mockup/6a9953c4be182bd8450de12a/105553/102287/soul-lovin-sullivan-band-artwork-t-shirt-rock-tour-poster.jpg?camera_label=front", price: 3052, buy_url: "https://spartaneo.printify.me/product/31608149", product_type: "t-shirt" },
  { id: "31608147", title: "Soul Lovin' Sullivan T-Shirt | Angel Wings Cross Spiritual Design", image: "https://images-api.printify.com/mockup/6a9953c5be182bd8450de12c/105553/102287/soul-lovin-sullivan-t-shirt-angel-wings-cross-spiritual-design.jpg?camera_label=front", price: 1957, buy_url: "https://spartaneo.printify.me/product/31608147", product_type: "t-shirt" },
  { id: "31600549", title: "Same Soul. Better View. — Hannah Memorial Tribute Tee", image: "https://images-api.printify.com/mockup/6a9953c8be182bd8450de132/83024/108041/same-soul-better-view-hannah-memorial-tribute-tee.jpg?camera_label=front", price: 2999, buy_url: "https://spartaneo.printify.me/product/31600549", product_type: "t-shirt" },
];

function htmlDecode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function storefrontType(title: string): StorefrontProduct["product_type"] {
  if (/hoodie|hooded/i.test(title)) return "hoodie";
  if (/sweatshirt|crewneck/i.test(title)) return "sweatshirt";
  if (/poster|canvas|wall art|acrylic/i.test(title)) return "wall-art";
  if (/cap|hat|beanie/i.test(title)) return "hat";
  if (/t-?shirt|\btee\b/i.test(title)) return "t-shirt";
  return "other";
}

function parseStorefront(html: string): StorefrontProduct[] {
  const pattern = /<a class="block w-full overflow-hidden" href="\/product\/(\d+)">[\s\S]*?<img src="([^"]+)" alt="([^"]+)"[\s\S]*?data-testid="variantPrice">\$([0-9.]+)/g;
  const products: StorefrontProduct[] = [];
  for (const match of html.matchAll(pattern)) {
    if (products.some((product) => product.id === match[1])) continue;
    const image = htmlDecode(match[2]);
    const title = htmlDecode(match[3]);
    if (!/^https:\/\/images-api\.printify\.com\//.test(image)) continue;
    products.push({
      id: match[1],
      title,
      image,
      price: Math.round(Number(match[4]) * 100),
      buy_url: `https://spartaneo.printify.me/product/${match[1]}`,
      product_type: storefrontType(title),
    });
  }
  return products;
}

async function publicStorefront() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(printifyStorefrontUrl, {
      signal: controller.signal,
      headers: { Accept: "text/html", "User-Agent": "SpartaneoStorefront/1.0" },
    });
    if (!response.ok) return storefrontFallback;
    const products = parseStorefront(await response.text());
    return products.length ? products : storefrontFallback;
  } catch {
    return storefrontFallback;
  } finally {
    clearTimeout(timer);
  }
}

const allowedOrigins = new Set([
  "https://spartaneo.com",
  "https://www.spartaneo.com",
  "https://comics.spartaneo.com",
]);
const encoder = new TextEncoder();

class Failure extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function jsonReply(body: unknown, status = 200, origin?: string | null) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    Vary: "Origin",
  });
  if (origin && allowedOrigins.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}

async function equalSecret(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(b),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(b));
  return crypto.subtle.verify("HMAC", key, sig, encoder.encode(a));
}

async function boundedBody(request: Request, limit = 32768) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) throw new Failure(413, "body_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new Failure(400, "body_required");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new Failure(413, "body_too_large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function parseJson(bytes: Uint8Array) {
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Failure(400, "invalid_json");
  }
}

async function printify(env: Env, path: string, data?: unknown) {
  if (!env.PRINTIFY_API_TOKEN) throw new Failure(503, "printify_token_not_configured");
  const token = String(env.PRINTIFY_API_TOKEN).trim();
  if (!/^[\x21-\x7e]+$/.test(token) || token.startsWith("Bearer ")) {
    throw new Failure(503, "printify_token_format_invalid");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    let response: Response;
    try {
      response = await fetch(`https://api.printify.com/v1${path}`, {
        method: data === undefined ? "GET" : "POST",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "SpartaneoMerch/1.1",
          Accept: "application/json",
          ...(data === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      });
    } catch {
      throw new Failure(502, controller.signal.aborted ? "printify_timeout" : "printify_connection_failed");
    }

    if (!response.ok) {
      if (response.status === 401) throw new Failure(502, "printify_token_rejected");
      if (response.status === 403) throw new Failure(502, "printify_access_denied");
      if (response.status === 404) throw new Failure(404, "not_found");
      if (response.status === 429) throw new Failure(429, "printify_rate_limited");
      if (response.status >= 300 && response.status < 400) throw new Failure(502, "printify_unexpected_redirect");
      throw new Failure(502, `printify_http_${response.status}`);
    }

    try {
      return await response.json();
    } catch {
      throw new Failure(502, "printify_invalid_json");
    }
  } finally {
    clearTimeout(timer);
  }
}

async function shopPath(env: Env) {
  if (/^\d+$/.test(env.PRINTIFY_SHOP_ID || "")) return `/shops/${env.PRINTIFY_SHOP_ID}`;

  const shops = await printify(env, "/shops.json");
  if (!Array.isArray(shops)) throw new Failure(502, "invalid_shop_response");
  const valid = shops.filter((shop) => /^\d+$/.test(String(shop?.id)));
  const named = valid.filter((shop) => /\bspartaneo\b/i.test(String(shop?.title || "")));
  const selected = named.length === 1 ? named[0] : valid.length === 1 ? valid[0] : null;
  if (!selected) throw new Failure(503, "printify_shop_selection_required");
  return `/shops/${selected.id}`;
}

function merchBuyUrl(env: Env, p: any) {
  const handle = String(p?.external?.handle || "").trim();
  if (/^https:\/\//i.test(handle)) return handle;
  const base = String(env.MERCH_STORE_URL || "").trim().replace(/\/+$/, "");
  if (!base || !/^https:\/\//i.test(base) || !handle) return null;
  return `${base}/products/${encodeURIComponent(handle)}`;
}

function sanitizeProduct(env: Env, p: any) {
  // Critical storefront rule: unavailable variants never leave this API.
  const variants = (Array.isArray(p?.variants) ? p.variants : [])
    .filter((v: any) => v?.is_enabled && v?.is_available)
    .map((v: any) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      is_available: true,
      is_enabled: true,
      options: Array.isArray(v.options) ? v.options : [],
    }));

  return {
    id: p.id,
    title: p.title,
    description: p.description,
    tags: Array.isArray(p.tags) ? p.tags : [],
    options: Array.isArray(p.options) ? p.options : [],
    images: (Array.isArray(p.images) ? p.images : []).map((image: any) => ({
      src: image.src,
      variant_ids: image.variant_ids,
      position: image.position,
      is_default: image.is_default,
    })),
    variants,
    buy_url: merchBuyUrl(env, p),
  };
}

function shippingInput(data: any) {
  if (!Array.isArray(data?.line_items) || data.line_items.length < 1 || data.line_items.length > 20) {
    throw new Failure(400, "invalid_line_items");
  }
  const line_items = data.line_items.map((item: any) => {
    if (
      !/^[a-f0-9]{24}$/i.test(item.product_id || "") ||
      !Number.isSafeInteger(item.variant_id) ||
      item.variant_id < 1 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    ) {
      throw new Failure(400, "invalid_line_item");
    }
    return { product_id: item.product_id, variant_id: item.variant_id, quantity: item.quantity };
  });

  const address_to: Record<string, string> = {};
  for (const key of ["first_name", "last_name", "email", "phone", "country", "region", "address1", "address2", "city", "zip"]) {
    const value = data.address_to?.[key];
    if (value !== undefined) {
      if (typeof value !== "string" || value.length > 254) throw new Failure(400, "invalid_address");
      address_to[key] = value.trim();
    }
  }
  if (!/^[A-Z]{2}$/.test(address_to.country || "") || !address_to.zip || !address_to.address1 || !address_to.city) {
    throw new Failure(400, "incomplete_address");
  }
  return { line_items, address_to };
}

async function merchApi(request: Request, env: Env) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  try {
    if (origin && !allowedOrigins.has(origin)) throw new Failure(403, "origin_not_allowed");

    if (url.pathname === "/api/merch/health" && request.method === "GET") {
      return jsonReply({ status: "online", orders_enabled: false }, 200, origin);
    }

    if (url.pathname === "/_setup/shops") {
      if (request.method !== "GET") throw new Failure(405, "method_not_allowed");
      const expected = `Bearer ${env.SETUP_ADMIN_TOKEN || ""}`;
      if (!env.SETUP_ADMIN_TOKEN || !(await equalSecret(request.headers.get("Authorization"), expected))) {
        throw new Failure(401, "unauthorized");
      }
      const shops = await printify(env, "/shops.json");
      return jsonReply({
        shops: Array.isArray(shops)
          ? shops.map((shop: any) => ({ id: shop.id, title: shop.title, sales_channel: shop.sales_channel }))
          : [],
      }, 200, origin);
    }

    const isProduct = /^\/api\/merch\/product\/[a-f0-9]{24}$/i.test(url.pathname);
    const known = isProduct || [
      "/api/merch/products",
      "/api/merch/shipping",
      "/api/merch/order",
      "/api/printify/webhook",
    ].includes(url.pathname);
    if (!known) throw new Failure(404, "not_found");

    const expectedMethod = isProduct || url.pathname === "/api/merch/products" ? "GET" : "POST";
    if (request.method === "OPTIONS") {
      const response = jsonReply(null, 204, origin);
      response.headers.set("Access-Control-Allow-Methods", `${expectedMethod}, OPTIONS`);
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
      return response;
    }
    if (request.method !== expectedMethod) throw new Failure(405, "method_not_allowed");

    // Safety lock: storefront browsing and shipping quotes are allowed; actual order creation is not.
    if (url.pathname === "/api/merch/order") {
      throw new Failure(403, "orders_locked_pending_owner_approval");
    }

    if (url.pathname === "/api/printify/webhook") {
      if (!env.PRINTIFY_WEBHOOK_SECRET || !env.PRINTIFY_EVENTS) throw new Failure(503, "webhook_not_configured");
      const header = request.headers.get("X-Pfy-Signature") || "";
      if (!/^sha256=[a-f0-9]{64}$/i.test(header)) throw new Failure(401, "invalid_webhook_signature");
      const bytes = await boundedBody(request, 262144);
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(env.PRINTIFY_WEBHOOK_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"],
      );
      const hex = header.slice(7).match(/.{2}/g);
      if (!hex) throw new Failure(401, "invalid_webhook_signature");
      const signature = Uint8Array.from(hex, (part) => parseInt(part, 16));
      if (!(await crypto.subtle.verify("HMAC", key, signature, bytes))) throw new Failure(401, "invalid_webhook_signature");
      const event = parseJson(bytes);
      if (typeof event.id !== "string" || !/^[\w-]{1,128}$/.test(event.id) || typeof event.type !== "string") {
        throw new Failure(400, "invalid_webhook_event");
      }
      if (String(event.resource?.data?.shop_id || "") !== String(env.PRINTIFY_SHOP_ID || "")) {
        throw new Failure(400, "webhook_shop_mismatch");
      }
      await env.PRINTIFY_EVENTS.put(
        `event:${event.id}`,
        JSON.stringify({ id: event.id, type: event.type, resource_id: event.resource?.id, received_at: new Date().toISOString() }),
        { expirationTtl: 604800 },
      );
      return jsonReply({ received: true }, 200, origin);
    }

    const base = await shopPath(env);

    if (url.pathname === "/api/merch/products") {
      const page = url.searchParams.get("page") || "1";
      const limit = url.searchParams.get("limit") || "20";
      if (!/^[1-9]\d{0,4}$/.test(page) || !/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 50) {
        throw new Failure(400, "invalid_pagination");
      }
      const result = await printify(env, `${base}/products.json?page=${page}&limit=${limit}`);
      if (!result || !Array.isArray((result as any).data)) throw new Failure(502, "printify_product_response_invalid");
      const data = (result as any).data
        .map((item: any) => sanitizeProduct(env, item))
        .filter((item: any) => item.variants.length > 0);
      return jsonReply({
        shop_id: base.split("/").pop(),
        data,
        current_page: (result as any).current_page,
        last_page: (result as any).last_page,
        total: data.length,
      }, 200, origin);
    }

    if (isProduct) {
      const id = url.pathname.split("/").pop();
      const item = sanitizeProduct(env, await printify(env, `${base}/products/${id}.json`));
      if (!item.variants.length) throw new Failure(404, "no_available_variants");
      return jsonReply(item, 200, origin);
    }

    if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
      throw new Failure(415, "json_required");
    }
    const data = shippingInput(parseJson(await boundedBody(request)));
    const loaded = new Map<string, any>();
    for (const item of data.line_items) {
      if (!loaded.has(item.product_id)) {
        loaded.set(item.product_id, await printify(env, `${base}/products/${item.product_id}.json`));
      }
      const valid = (loaded.get(item.product_id)?.variants || []).some(
        (variant: any) => variant.id === item.variant_id && variant.is_enabled && variant.is_available,
      );
      if (!valid) throw new Failure(400, "variant_unavailable");
    }
    return jsonReply(await printify(env, `${base}/orders/shipping.json`, data), 200, origin);
  } catch (error) {
    return jsonReply(
      { error: error instanceof Failure ? error.code : "backend_unavailable" },
      error instanceof Failure ? error.status : 502,
      origin,
    );
  }
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/izzy-products") {
      if (request.method !== "GET") return jsonReply({ error: "method_not_allowed" }, 405);
      const products = (await publicStorefront()).filter(
        (product) => !/leprechaun|st\. patrick/i.test(product.title),
      );
      const response = jsonReply({ data: products, total: products.length });
      response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
      return response;
    }

    if (
      url.pathname.startsWith("/api/merch/") ||
      url.pathname === "/api/printify/webhook" ||
      url.pathname === "/_setup/shops"
    ) {
      return merchApi(request, env);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(
        request,
        {
          fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
          transformImage: async (body, { width, format, quality }) => {
            const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
            return result.response();
          },
        },
        allowedWidths,
      );
    }

    // Preserve the existing Highscool Musical static game route.
    if (url.pathname === "/highscool-musical" || url.pathname === "/highscool-musical/") {
      const gameIndexUrl = new URL(request.url);
      gameIndexUrl.pathname = "/highscool-musical/index.html";
      return env.ASSETS.fetch(new Request(gameIndexUrl.toString(), request));
    }
    if (url.pathname.startsWith("/highscool-musical/")) {
      const gameAsset = await env.ASSETS.fetch(request);
      if (gameAsset.status !== 404) return gameAsset;
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
