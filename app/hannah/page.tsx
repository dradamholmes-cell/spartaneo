import type { Metadata } from "next";
import Link from "next/link";
import HannahShareButtons from "./HannahShareButtons";
import IzzyProductBuilder from "./IzzyProductBuilder";

export const metadata: Metadata = {
  title: "Hannah Sullivan Memorial Collection | Spartaneo",
  description:
    "Hannah Sullivan — Your Light Still Shines. Shop the memorial collection, share Hannah's page, and support Izzy.",
  alternates: {
    canonical: "https://comics.spartaneo.com/hannah",
  },
  openGraph: {
    title: "Hannah Sullivan — Your Light Still Shines",
    description:
      "Memorial shirts, a men's cap, small wall canvas, and a direct way to support Izzy.",
    url: "https://comics.spartaneo.com/hannah",
    siteName: "Spartaneo",
    type: "website",
    images: [
      {
        url: "https://comics.spartaneo.com/og.png",
        width: 1200,
        height: 630,
        alt: "Hannah Sullivan memorial collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hannah Sullivan — Your Light Still Shines",
    description: "Memorial collection and support for Izzy.",
    images: ["https://comics.spartaneo.com/og.png"],
  },
};

const goFundMe =
  "https://www.gofundme.com/f/support-izzy-after-hannahs-loss?attribution_id=sl:7d8cce97-2b98-49aa-bc4c-7855601c33d9&lang=en_US&ts=1788364188&utm_campaign=fp_sharesheet&utm_content=amp30-treatment-3&utm_medium=customer&utm_source=facebook_reel";

export default function HannahPage() {
  return (
    <main className="hannah-page">
      <style>{`
        .hannah-page { min-height: 100vh; background: #f6f0fa; color: #2d1738; }
        .hannah-page .eyebrow { color: #7b4b91; }
        .hannah-hero { position: relative; overflow: hidden; isolation: isolate; min-height: 720px; display: grid; align-items: center; padding: 64px clamp(24px, 7vw, 110px); background: radial-gradient(circle at 75% 22%, rgba(255,255,255,.9), transparent 20rem), linear-gradient(135deg,#f9f4ff 0%,#e9daf4 45%,#fff2dd 100%); border-bottom: 1px solid rgba(88,45,112,.13); }
        .hannah-hero::before, .hannah-hero::after { content: ""; position: absolute; border-radius: 50%; z-index: -2; filter: blur(1px); }
        .hannah-hero::before { width: 650px; height: 650px; right: -180px; top: -100px; background: radial-gradient(circle,rgba(129,72,158,.22),rgba(129,72,158,0)); }
        .hannah-hero::after { width: 780px; height: 780px; left: -270px; bottom: -450px; background: radial-gradient(circle,rgba(255,196,109,.26),rgba(255,196,109,0)); }
        .hannah-hero-glow { position: absolute; inset: 0; z-index: -1; opacity: .55; background-image: radial-gradient(circle at 12% 25%, rgba(255,255,255,.95) 0 2px, transparent 3px), radial-gradient(circle at 72% 18%, rgba(255,255,255,.9) 0 1px, transparent 2px), radial-gradient(circle at 44% 78%, rgba(119,62,149,.22) 0 2px, transparent 3px); background-size: 120px 120px, 160px 160px, 145px 145px; }
        .hannah-hero-inner { width: min(850px,100%); }
        .hannah-back { display: inline-flex; margin-bottom: 70px; font-size: 12px; letter-spacing: .12em; font-weight: 900; color: #6d5279; }
        .hannah-hero h1 { margin: 16px 0 8px; font-family: Georgia,"Times New Roman",serif; font-size: clamp(66px,11vw,142px); line-height: .78; letter-spacing: -.055em; color: #3a1748; text-shadow: 0 6px 24px rgba(77,38,96,.12); }
        .hannah-hero h1 span { display: block; margin-top: .2em; font-family: Arial,Helvetica,sans-serif; font-size: .28em; letter-spacing: .34em; color: #8b5aa0; }
        .hannah-dates { margin: 28px 0 0; font-size: 14px; letter-spacing: .2em; font-weight: 900; color: #6f557c; }
        .hannah-hero-copy { max-width: 660px; margin: 28px 0 34px; font-family: Georgia,"Times New Roman",serif; font-size: clamp(22px,3vw,34px); line-height: 1.35; color: #594061; }
        .hannah-hero-actions,.hannah-share-row { display: flex; flex-wrap: wrap; gap: 12px; }
        .hannah-hero-actions { margin-bottom: 18px; }
        .hannah-shop-button,.hannah-support-button,.hannah-share-primary,.hannah-share-secondary { min-height: 50px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 0 22px; border: 1px solid rgba(84,41,105,.2); font-size: 11px; font-weight: 900; letter-spacing: .08em; cursor: pointer; }
        .hannah-shop-button,.hannah-share-primary { background: #54296a; color: white; border-color: #54296a; }
        .hannah-support-button { background: #fff; color: #54296a; box-shadow: 0 8px 28px rgba(76,38,94,.1); }
        .hannah-support-button.large { min-height: 58px; padding-inline: 30px; }
        .hannah-share-secondary { background: rgba(255,255,255,.72); color: #54296a; }
        .hannah-message,.hannah-share-panel,.hannah-support-panel { display: grid; grid-template-columns: minmax(0,.8fr) minmax(320px,1.2fr); gap: clamp(30px,7vw,100px); align-items: center; padding: 72px clamp(24px,7vw,110px); }
        .hannah-message { background: #fffdfa; }
        .hannah-message h2,.hannah-share-panel h2,.hannah-support-panel h2 { margin: 10px 0 0; font-family: Georgia,"Times New Roman",serif; font-size: clamp(36px,5vw,64px); line-height: 1; color: #3c2147; }
        .hannah-message > p,.hannah-share-panel p,.hannah-support-panel p { margin: 0; color: #786b7b; line-height: 1.75; font-size: 17px; }
        .hannah-share-panel { background: linear-gradient(135deg,#f3e8f8,#fff9ef); border-top: 1px solid rgba(84,41,106,.1); }
        .hannah-support-panel { background: #2f1939; color: white; }
        .hannah-support-panel .eyebrow { color: #d8a7eb; }
        .hannah-support-panel h2 { color: white; }
        .hannah-support-panel p { color: #d8c9dc; }
        .hannah-support-panel .hannah-support-button { justify-self: start; }
        #memorial-collection .merch-section { color: #321b3c; }
        #memorial-collection .merch-heading h2,#memorial-collection .merch-card h3 { color: #321b3c; }
        #memorial-collection .merch-heading p,#memorial-collection .merch-card p,#memorial-collection .merch-price-row span { color: #716379; }
        #memorial-collection .merch-card { background: rgba(255,255,255,.9); border-color: rgba(83,44,103,.14); box-shadow: 0 18px 60px rgba(81,48,97,.1); }
        .izzy-builder { padding: 78px clamp(24px,7vw,110px); background: #fffdfa; border-top: 1px solid rgba(84,41,106,.1); border-bottom: 1px solid rgba(84,41,106,.1); }
        .izzy-builder-heading { max-width: 820px; margin-bottom: 38px; }
        .izzy-builder-heading h2 { margin: 9px 0 14px; font-family: Georgia,"Times New Roman",serif; font-size: clamp(38px,5vw,66px); line-height: .98; color: #3c2147; }
        .izzy-builder-heading > p:last-child { color: #786b7b; font-size: 17px; line-height: 1.6; }
        .builder-layout { display: grid; grid-template-columns: minmax(0,1.35fr) minmax(310px,.65fr); gap: clamp(28px,5vw,70px); align-items: start; }
        .builder-steps { display: grid; gap: 42px; }
        .builder-step { display: grid; grid-template-columns: 44px 1fr; gap: 18px; }
        .builder-step > strong { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: #54296a; color: #fff; font-size: 18px; }
        .builder-step h3,.builder-preview h3 { margin: 8px 0 16px; color: #3c2147; }
        .builder-type-row { display: flex; flex-wrap: wrap; gap: 9px; }
        .builder-type-row button { min-height: 44px; padding: 0 16px; border: 1px solid rgba(84,41,106,.25); border-radius: 999px; background: #fff; color: #54296a; font-weight: 900; font-size: 11px; letter-spacing: .07em; cursor: pointer; }
        .builder-type-row button.is-active { background: #54296a; color: #fff; }
        .builder-design-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 13px; }
        .builder-design-grid button { padding: 0; overflow: hidden; border: 2px solid transparent; border-radius: 16px; background: #f2eaf5; color: #43264e; cursor: pointer; text-align: left; }
        .builder-design-grid button.is-active { border-color: #7d4693; box-shadow: 0 0 0 3px rgba(125,70,147,.13); }
        .builder-design-grid img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: #f1eef1; }
        .builder-design-grid span { min-height: 64px; display: block; padding: 10px; font-size: 12px; font-weight: 800; line-height: 1.35; }
        .builder-preview { position: sticky; top: 24px; padding: 20px; border-radius: 24px; background: linear-gradient(145deg,#efe2f4,#fff7e9); box-shadow: 0 22px 60px rgba(81,48,97,.15); }
        .builder-preview > img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 17px; background: white; }
        .builder-preview-label { color: #7b4b91; font-size: 10px; font-weight: 900; letter-spacing: .16em; }
        .builder-preview h3 { font-size: 22px; line-height: 1.18; }
        .builder-preview > p:not(.builder-preview-label) { color: #75647b; font-size: 13px; line-height: 1.5; }
        .builder-price { color: #54296a; font-size: 24px; font-weight: 950; }
        .builder-preview > a { min-height: 54px; margin-top: 16px; display: flex; align-items: center; justify-content: center; border-radius: 999px; background: #54296a; color: #fff; font-size: 12px; font-weight: 950; letter-spacing: .08em; }
        .builder-status { padding: 28px; border: 1px solid rgba(84,41,106,.15); color: #6f557c; text-align: center; }
        @media (max-width: 760px) {
          .hannah-hero { min-height: auto; padding-top: 36px; }
          .hannah-back { margin-bottom: 52px; }
          .hannah-message,.hannah-share-panel,.hannah-support-panel { grid-template-columns: 1fr; padding-block: 54px; }
          .hannah-share-row > *,.hannah-hero-actions > * { width: 100%; }
          .builder-layout { grid-template-columns: 1fr; }
          .builder-design-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .builder-preview { position: static; }
        }
      `}</style>

      <section className="hannah-hero">
        <div className="hannah-hero-glow" aria-hidden="true" />
        <div className="hannah-hero-inner">
          <Link className="hannah-back" href="/">
            ← SPARTANEO HOME
          </Link>
          <p className="eyebrow">IN LOVING MEMORY</p>
          <h1>
            HANNAH <span>SULLIVAN</span>
          </h1>
          <p className="hannah-dates">DEC 24, 1979 — AUGUST 27, 2026</p>
          <p className="hannah-hero-copy">
            Not gone — just changed form. Part angel, part stardust, forever loved.
          </p>
          <div className="hannah-hero-actions">
            <a className="hannah-shop-button" href="#build-izzy-product">
              BUILD YOUR PRODUCT ↓
            </a>
            <a className="hannah-support-button" href={goFundMe} target="_blank" rel="noopener noreferrer">
              SUPPORT IZZY <span aria-hidden="true">↗</span>
            </a>
          </div>
          <HannahShareButtons />
        </div>
      </section>

      <section className="hannah-message">
        <div>
          <p className="eyebrow">YOUR LIGHT STILL SHINES</p>
          <h2>Wear it. Hang it. Share it.</h2>
        </div>
        <p>
          Hannah's memorial collection is built to be easy to share and easy to shop. Shirts, hoodies, a men's cap, and a small wall canvas can all live together here while Printify keeps the live options current.
        </p>
      </section>

      <IzzyProductBuilder />

      <section className="hannah-share-panel">
        <div>
          <p className="eyebrow">HELP IT TRAVEL</p>
          <h2>SHARE HANNAH'S PAGE</h2>
          <p>
            The Facebook videos are built to catch attention with the sudden movement, then send people here instead of dumping them into a random product link.
          </p>
        </div>
        <HannahShareButtons />
      </section>

      <section className="hannah-support-panel">
        <div>
          <p className="eyebrow">SEPARATE FROM MERCH</p>
          <h2>SUPPORT IZZY DIRECTLY</h2>
          <p>The fundraiser remains a direct way to help Izzy after Hannah's loss.</p>
        </div>
        <a className="hannah-support-button large" href={goFundMe} target="_blank" rel="noopener noreferrer">
          OPEN GOFUNDME <span aria-hidden="true">↗</span>
        </a>
      </section>
    </main>
  );
}
