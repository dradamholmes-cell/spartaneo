"use client";

import { ChangeEvent, useEffect, useState } from "react";

type ProductType = "shirt" | "hoodie" | "cap" | "canvas";

const productNames: Record<ProductType, string> = {
  shirt: "T-SHIRT",
  hoodie: "HOODIE",
  cap: "MEN'S CAP",
  canvas: "SMALL WALL CANVAS",
};

export default function MerchDesignWorkbench() {
  const [product, setProduct] = useState<ProductType>("shirt");
  const [artUrl, setArtUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    return () => {
      if (artUrl) URL.revokeObjectURL(artUrl);
    };
  }, [artUrl]);

  function chooseArt(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (artUrl) URL.revokeObjectURL(artUrl);
    setArtUrl(URL.createObjectURL(file));
    setFileName(file.name);
  }

  return (
    <div className="merch-tool-grid">
      <section className="merch-tool-controls">
        <p className="tool-step">1 · CHOOSE YOUR ART</p>
        <label className="tool-upload">
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseArt} />
          <strong>{fileName || "DROP / CHOOSE DESIGN IMAGE"}</strong>
          <span>PNG with transparent background works best for apparel.</span>
        </label>

        <p className="tool-step">2 · PICK A PRODUCT</p>
        <div className="tool-product-buttons">
          {(Object.keys(productNames) as ProductType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={product === type ? "is-active" : ""}
              onClick={() => setProduct(type)}
            >
              {productNames[type]}
            </button>
          ))}
        </div>

        <p className="tool-step">3 · BUILD IT IN PRINTIFY</p>
        <div className="tool-links">
          <a href="https://printify.com/app/products" target="_blank" rel="noopener noreferrer">
            OPEN MY PRINTIFY PRODUCTS ↗
          </a>
          <a href="https://printify.com/app/products/create" target="_blank" rel="noopener noreferrer">
            CREATE NEW PRINTIFY PRODUCT ↗
          </a>
        </div>

        <div className="tool-checklist">
          <strong>QUICK CHECK BEFORE PUBLISHING</strong>
          <span>✓ Front / back artwork where wanted</span>
          <span>✓ Only sizes/colors you actually want enabled</span>
          <span>✓ Product title includes “Hannah” for the memorial page</span>
          <span>✓ Publish it in Printify — the site pulls live products automatically</span>
        </div>
      </section>

      <section className="merch-tool-preview">
        <p className="tool-step">LIVE ROUGH PREVIEW · {productNames[product]}</p>
        <div className={`product-mockup product-${product}`}>
          <div className="mockup-shape">
            {artUrl ? <img src={artUrl} alt="Your uploaded design preview" /> : <span>YOUR ART</span>}
          </div>
        </div>
        <p className="preview-note">This is only a placement sanity-check. Use Printify's mockup editor for final positioning and print-area limits.</p>
      </section>
    </div>
  );
}
