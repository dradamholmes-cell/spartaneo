"use client";

import { useEffect, useMemo, useState } from "react";

type ProductType = "t-shirt" | "hoodie" | "sweatshirt" | "wall-art" | "hat";

type Product = {
  id: string;
  title: string;
  image: string;
  price: number;
  buy_url: string;
  product_type: ProductType | "other";
};

const typeLabels: Record<ProductType, string> = {
  "t-shirt": "T-SHIRTS",
  hoodie: "HOODIE",
  sweatshirt: "CREWNECK",
  "wall-art": "WALL ART",
  hat: "HAT",
};

const typeOrder: ProductType[] = ["t-shirt", "hoodie", "sweatshirt", "wall-art", "hat"];

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function IzzyProductBuilder() {
  const [products, setProducts] = useState<Product[]>([]);
  const [type, setType] = useState<ProductType>("t-shirt");
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/izzy-products", { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (response) => {
        const payload = (await response.json()) as { data?: Product[] };
        if (!response.ok || !payload.data?.length) throw new Error("catalog_unavailable");
        setProducts(payload.data);
        setStatus("ready");
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, []);

  const availableTypes = useMemo(
    () => typeOrder.filter((candidate) => products.some((product) => product.product_type === candidate)),
    [products],
  );
  const choices = useMemo(
    () => products.filter((product) => product.product_type === type),
    [products, type],
  );
  const selected = choices.find((product) => product.id === selectedId) ?? choices[0];

  useEffect(() => {
    if (status !== "ready") return;
    if (!availableTypes.includes(type)) setType(availableTypes[0] ?? "t-shirt");
  }, [availableTypes, status, type]);

  useEffect(() => {
    setSelectedId(choices[0]?.id ?? "");
  }, [choices]);

  return (
    <section className="izzy-builder" id="build-izzy-product" aria-labelledby="izzy-builder-title">
      <div className="izzy-builder-heading">
        <p className="eyebrow">BUILD YOUR PRODUCT</p>
        <h2 id="izzy-builder-title">PICK IT. PRINT IT. SUPPORT IZZY.</h2>
        <p>Choose what you want, then pick the design. Size and color are selected securely at checkout.</p>
      </div>

      {status === "loading" ? <div className="builder-status">Loading the available products…</div> : null}
      {status === "error" ? <div className="builder-status">The product builder is temporarily unavailable.</div> : null}

      {status === "ready" && selected ? (
        <div className="builder-layout">
          <div className="builder-steps">
            <div className="builder-step">
              <strong>1</strong>
              <div>
                <h3>SELECT TYPE</h3>
                <div className="builder-type-row" role="list" aria-label="Product types">
                  {availableTypes.map((candidate) => (
                    <button
                      type="button"
                      key={candidate}
                      className={candidate === type ? "is-active" : ""}
                      onClick={() => setType(candidate)}
                    >
                      {typeLabels[candidate]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="builder-step">
              <strong>2</strong>
              <div>
                <h3>SELECT DESIGN</h3>
                <div className="builder-design-grid">
                  {choices.map((product) => (
                    <button
                      type="button"
                      key={product.id}
                      className={product.id === selected.id ? "is-active" : ""}
                      onClick={() => setSelectedId(product.id)}
                      aria-label={`Select ${product.title}`}
                    >
                      <img src={product.image} alt="" loading="lazy" />
                      <span>{product.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="builder-preview" aria-live="polite">
            <p className="builder-preview-label">YOUR PICK</p>
            <img src={selected.image} alt={selected.title} />
            <h3>{selected.title}</h3>
            <div className="builder-price">FROM {money(selected.price)}</div>
            <p>Choose your exact size, color, quantity, and shipping at checkout.</p>
            <a href={selected.buy_url} target="_blank" rel="noopener noreferrer">
              ORDER THIS ONE <span aria-hidden="true">↗</span>
            </a>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
