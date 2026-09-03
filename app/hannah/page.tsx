import type { Metadata } from "next";
import Link from "next/link";
import MerchStore from "../components/MerchStore";
import HannahShareButtons from "./HannahShareButtons";

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
            <a className="hannah-shop-button" href="#memorial-collection">
              SHOP THE MEMORIAL COLLECTION ↓
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

      <div id="memorial-collection">
        <MerchStore
          filter="hannah"
          eyebrow="HANNAH SULLIVAN MEMORIAL COLLECTION"
          heading="YOUR LIGHT STILL SHINES"
          intro="Only currently available Printify options are shown. Shirts keep size/color choices, caps use color/style, and wall art uses size."
          memorialMode
        />
      </div>

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
