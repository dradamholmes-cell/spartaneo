import type { Metadata } from "next";
import Link from "next/link";
import MerchDesignWorkbench from "./MerchDesignWorkbench";

export const metadata: Metadata = {
  title: "Merch Tools | Spartaneo",
  robots: { index: false, follow: false },
};

export default function MerchToolsPage() {
  return (
    <main className="merch-tools-page">
      <style>{`
        .merch-tools-page { min-height: 100vh; padding: 42px clamp(20px,5vw,72px) 80px; background: #0b0b0a; color: #ece0c8; }
        .tool-top { max-width: 1280px; margin: 0 auto 36px; }
        .tool-back { color: #a99e8d; font-size: 12px; font-weight: 900; letter-spacing: .1em; }
        .tool-top h1 { margin: 18px 0 8px; font-family: Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif; font-size: clamp(54px,8vw,96px); line-height: .9; }
        .tool-top p { max-width: 780px; color: #a99e8d; line-height: 1.65; }
        .merch-tool-grid { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: minmax(0,.9fr) minmax(360px,1.1fr); gap: 32px; }
        .merch-tool-controls,.merch-tool-preview { border: 1px solid rgba(236,224,200,.16); background: #141412; padding: clamp(22px,4vw,38px); }
        .tool-step { margin: 0 0 14px; color: #f1963a; font-size: 11px; font-weight: 900; letter-spacing: .16em; }
        .tool-upload { min-height: 148px; border: 1px dashed rgba(236,224,200,.35); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; cursor: pointer; background: #0e0e0d; }
        .tool-upload input { position: absolute; opacity: 0; pointer-events: none; }
        .tool-upload strong { font-size: 14px; letter-spacing: .08em; }
        .tool-upload span { color: #8d867a; font-size: 12px; }
        .tool-product-buttons { display: grid; grid-template-columns: repeat(2,1fr); gap: 9px; margin-bottom: 30px; }
        .tool-product-buttons button,.tool-links a { min-height: 48px; border: 1px solid rgba(236,224,200,.2); background: #0e0e0d; color: #ece0c8; font-weight: 900; font-size: 11px; letter-spacing: .07em; cursor: pointer; display: flex; align-items: center; justify-content: center; text-align: center; padding: 8px 12px; }
        .tool-product-buttons button.is-active { background: #d27b2c; color: #120d08; border-color: #d27b2c; }
        .tool-links { display: grid; gap: 9px; }
        .tool-links a:first-child { background: #ece0c8; color: #17130f; }
        .tool-checklist { margin-top: 28px; display: grid; gap: 8px; color: #aaa194; font-size: 13px; line-height: 1.5; }
        .tool-checklist strong { color: #ece0c8; margin-bottom: 3px; }
        .merch-tool-preview { min-height: 630px; }
        .product-mockup { min-height: 500px; display: grid; place-items: center; background: radial-gradient(circle,#2b2925,#10100f 65%); overflow: hidden; }
        .mockup-shape { position: relative; background: #f7f5ef; box-shadow: 0 30px 70px rgba(0,0,0,.45); display: grid; place-items: center; overflow: hidden; }
        .product-shirt .mockup-shape { width: 330px; height: 410px; border-radius: 45px 45px 18px 18px; clip-path: polygon(25% 0,75% 0,100% 15%,86% 34%,76% 25%,76% 100%,24% 100%,24% 25%,14% 34%,0 15%); }
        .product-hoodie .mockup-shape { width: 340px; height: 430px; border-radius: 70px 70px 18px 18px; clip-path: polygon(31% 0,69% 0,80% 7%,100% 18%,88% 39%,78% 31%,76% 100%,24% 100%,22% 31%,12% 39%,0 18%,20% 7%); }
        .product-cap .mockup-shape { width: 390px; height: 220px; border-radius: 55% 55% 35% 35% / 70% 70% 30% 30%; }
        .product-canvas .mockup-shape { width: 380px; height: 310px; border: 14px solid #e8e4da; box-shadow: 0 30px 70px rgba(0,0,0,.45), inset 0 0 0 1px #cfc9bb; }
        .mockup-shape img { width: 62%; height: 62%; object-fit: contain; }
        .product-cap .mockup-shape img { width: 42%; height: 42%; }
        .product-canvas .mockup-shape img { width: 100%; height: 100%; object-fit: contain; }
        .mockup-shape span { color: #bdb7aa; font-weight: 900; letter-spacing: .15em; }
        .preview-note { color: #847d72; font-size: 12px; line-height: 1.6; }
        @media (max-width: 850px) { .merch-tool-grid { grid-template-columns: 1fr; } .merch-tool-preview { min-height: auto; } .product-mockup { min-height: 420px; } }
      `}</style>

      <section className="tool-top">
        <Link className="tool-back" href="/">← SPARTANEO HOME</Link>
        <h1>MERCH TOOLS</h1>
        <p>
          Drop in a design, pick what you're making, sanity-check the placement, then jump straight into Printify. Published products automatically flow into the existing storefront without putting your Printify token in the browser.
        </p>
      </section>

      <MerchDesignWorkbench />
    </main>
  );
}
