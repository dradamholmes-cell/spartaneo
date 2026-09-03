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

function ProductCard({ product }: { product: MerchProduct }) {
  const variants = useMemo(
    () => (product.variants ?? []).filter((variant) => variant.is_enabled && variant.is_available),
    [product.variants],
  );
  const [variantId, setVariantId] = useState<number | null>(variants[0]?.id ?? null);
  const selected = variants.find((variant) => variant.id === variantId) ?? variants[0];
  const image = product.images?.find((candidate) => candidate.is_default)?.src ?? product.images?.[0]?.src;
  const description = cleanText(product.description).slice(0, 190);

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
          SIZE / COLOR
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

export default function MerchStore() {
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
        const available = (payload.data ?? []).filter((product) =>
          (product.variants ?? []).some((variant) => variant.is_enabled && variant.is_available),
        );
        setProducts(available);
        setState(available.length ? "ready" : "empty");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setState("error");
      }
    }

    load();
    return () => controller.abort();
  }, []);

  return (
    <section className="merch-section" id="merch">
      <div className="merch-heading">
        <div>
          <p className="eyebrow">SPARTANEO SWAG</p>
          <h2>ORDER NOW</h2>
        </div>
        <p>
          Hannah memorial designs and Spartaneo gear. Only currently available sizes and colors are shown.
        </p>
      </div>

      {state === "loading" ? <div className="merch-message">Loading the shirts…</div> : null}
      {state === "error" ? (
        <div className="merch-message merch-error">
          The merch rack is temporarily offline. The comics and games are still here.
        </div>
      ) : null}
      {state === "empty" ? <div className="merch-message">No in-stock merch is published right now.</div> : null}
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
