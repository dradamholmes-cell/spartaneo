"use client";

import { useEffect, useMemo, useState } from "react";

type MerchVariant = {
  id: number;
  title: string;
  price: number;
  is_available: boolean;
  is_enabled: boolean;
  options?: number[];
};

type MerchImage = {
  src: string;
  variant_ids?: number[];
  position?: string;
  is_default?: boolean;
};

type MerchProduct = {
  id: string;
  title: string;
  description?: string;
  images?: MerchImage[];
  variants?: MerchVariant[];
  buy_url?: string | null;
};

type MerchResponse = {
  data?: MerchProduct[];
  error?: string;
};

type MerchStoreProps = {
  filter?: string;
  eyebrow?: string;
  heading?: string;
  intro?: string;
  memorialMode?: boolean;
};

const checkoutByTitle: Record<string, string> = {
  "same soul better view sweatshirt | angel wings memorial artwork": "https://spartaneo.printify.me/product/31608157",
  "the sullivan name crest t-shirt | family coat of arms tee": "https://spartaneo.printify.me/product/31608156",
  "her light still shines angel memorial t-shirt | the sullivan name backprint": "https://spartaneo.printify.me/product/31608153",
  "celebrating name memorial photo t-shirt | personalized funeral tribute": "https://spartaneo.printify.me/product/31608150",
  "soul lovin' sullivan band artwork t-shirt | rock tour poster": "https://spartaneo.printify.me/product/31608149",
  "soul lovin' sullivan t-shirt | angel wings cross spiritual design": "https://spartaneo.printify.me/product/31608147",
  "same soul. better view. — hannah memorial tribute tee": "https://spartaneo.printify.me/product/31600549",
};

function normalizedTitle(value: string) {
  return value.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function cleanText(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function optionLabel(title: string) {
  if (/canvas|wall art|poster|print/i.test(title)) return "SIZE";
  if (/cap|hat|beanie/i.test(title)) return "COLOR / STYLE";
  return "SIZE / COLOR";
}

function ProductCard({ product }: { product: MerchProduct }) {
  const variants = useMemo(
    () => (product.variants ?? []).filter((variant) => variant.is_enabled && variant.is_available),
    [product.variants],
  );
  const [variantId, setVariantId] = useState<number | null>(variants[0]?.id ?? null);
  const selected = variants.find((variant) => variant.id === variantId) ?? variants[0];
  const image = product.images?.find((candidate) => candidate.is_default)?.src ?? product.images?.[0]?.src;
  const description = cleanText(product.description).slice(0, 190);
  const label = optionLabel(product.title);

  if (!variants.length) return null;

  return (
    <article className="merch-card">
      <div className="merch-image-wrap">
        {image ? <img className="merch-image" src={image} alt={product.title} loading="lazy" /> : null}
        <span className="merch-stock">IN STOCK</span>
      </div>
      <div className="merch-card-body">
        <h3>{product.title}</h3>
        {description ? <p>{description}</p> : null}
        <div className="merch-price-row">
          <strong>{selected ? money(selected.price) : ""}</strong>
          <span>{variants.length} available option{variants.length === 1 ? "" : "s"}</span>
        </div>
        <label className="merch-select-label" htmlFor={`variant-${product.id}`}>
          {label}
        </label>
        <select
          id={`variant-${product.id}`}
          className="merch-select"
          value={variantId ?? ""}
          onChange={(event) => setVariantId(Number(event.target.value))}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.title} — {money(variant.price)}
            </option>
          ))}
        </select>
        {product.buy_url ? (
          <a className="merch-buy" href={product.buy_url} target="_blank" rel="noopener noreferrer">
            ORDER NOW <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <div className="merch-buy is-disabled" aria-disabled="true" title="Checkout link is not published yet">
            ORDER LINK PUBLISHING
          </div>
        )}
      </div>
    </article>
  );
}

export default function MerchStore({
  filter,
  eyebrow = "SPARTANEO SWAG",
  heading = "ORDER NOW",
  intro = "Hannah memorial designs and Spartaneo gear. Only currently available options are shown.",
  memorialMode = false,
}: MerchStoreProps = {}) {
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/merch/products?limit=50", {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const payload = (await response.json()) as MerchResponse;
        if (!response.ok) throw new Error(payload.error || "merch_unavailable");
        const keyed = new Map<string, MerchProduct>();
        for (const product of payload.data ?? []) {
          const key = normalizedTitle(product.title);
          keyed.set(key, { ...product, buy_url: product.buy_url || checkoutByTitle[key] || null });
        }
        const available = [...keyed.values()]
          .filter((product) =>
            (product.variants ?? []).some((variant) => variant.is_enabled && variant.is_available),
          )
          .filter((product) => Boolean(product.buy_url))
          .filter((product) => !filter || `${product.title} ${product.description ?? ""}`.toLowerCase().includes(filter.toLowerCase()));
        setProducts(available);
        setState(available.length ? "ready" : "empty");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setState("error");
      }
    }

    load();
    return () => controller.abort();
  }, [filter]);

  const backdropImages = memorialMode
    ? products
        .map((product) => product.images?.find((candidate) => candidate.is_default)?.src ?? product.images?.[0]?.src)
        .filter((src): src is string => Boolean(src))
        .slice(0, 6)
    : [];

  return (
    <section className="merch-section" id="merch" style={memorialMode ? { position: "relative", overflow: "hidden", isolation: "isolate" } : undefined}>
      {memorialMode && backdropImages.length ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: -2,
            opacity: 0.17,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 18,
            padding: 28,
            transform: "rotate(-2deg) scale(1.08)",
            filter: "saturate(.8) brightness(1.25)",
          }}
        >
          {backdropImages.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt=""
              style={{ width: "100%", height: 290, objectFit: "contain", background: "rgba(255,255,255,.64)", borderRadius: 22 }}
            />
          ))}
        </div>
      ) : null}
      {memorialMode ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: -1,
            background: "linear-gradient(180deg, rgba(246,239,250,.88), rgba(255,250,245,.96) 45%, rgba(235,223,245,.94))",
          }}
        />
      ) : null}

      <div className="merch-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{heading}</h2>
        </div>
        <p>{intro}</p>
      </div>

      {state === "loading" ? <div className="merch-message">Loading the collection…</div> : null}
      {state === "error" ? (
        <div className="merch-message merch-error">
          The merch rack is temporarily offline. The comics and games are still here.
        </div>
      ) : null}
      {state === "empty" ? <div className="merch-message">No matching in-stock merch is published right now.</div> : null}
      {state === "ready" ? (
        <div className="merch-grid">
          {products.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
