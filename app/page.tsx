import type { Metadata } from "next";
import Link from "next/link";
import MerchStore from "./components/MerchStore";

export const metadata: Metadata = {
  title: "The Last Party of 1999 | OGB Originals",
  description:
    "Read The Last Party of 1999, an OGB Originals comic by Adam Holmes, free online.",
};

const issues = [
  {
    number: "BOOK",
    title: "Jubilee & Briana: Sleepy Star Sisters",
    copy: "Two sisters, one tiny fallen star, and a dreamy bilingual bedtime journey about kindness, courage, and one heart.",
    href: "/read/sleepy-star-sisters",
    cover: "/books/sleepy-star-sisters/cover.jpg",
    pages: 24,
    status: "NEW BOOK",
    buyUrl: "https://www.lulu.com/shop/adam-holmes/project-title-jubilee-briana-sleepy-star-sisters/paperback/product-zmngpdm.html",
  },
  {
    number: "#4",
    title: "Hazelwood Trails",
    copy: "The buses leave. Adam and the crew head for the trails, where the clubhouse, the jokes, and the trouble all start to blur together.",
    href: "/read/issue-4",
    cover: "/comics/issue-4/hazelwood-trails-cover.jpg",
    pages: 30,
    status: "COMING SOON",
    buyUrl: "https://www.lulu.com/shop/adam-holmes/the-last-party-of-1999-hazelwood-trails/paperback/product-zmngpy7.html",
  },
  {
    number: "#3",
    title: "Murky Clearwater",
    copy: "A Florida vacation, a crew becoming family, and the shadow on the water nobody can explain.",
    href: "/read/issue-3",
    cover: "/comics/issue-3/page-001.webp",
    pages: 32,
    status: "NEW ISSUE",
    buyUrl: "https://www.lulu.com/shop/adam-holmes/ogb-episode-3-murky-clearwater/paperback/product-yve2kgk.html?page=1&pageSize=4",
  },
  {
    number: "#1",
    title: "The Night We Don't Talk About",
    copy: "The party, the crew, and the night that turned into a story nobody could leave alone.",
    href: "/read/issue-1",
    cover: "/comics/issue-1/page-001.webp",
    pages: 23,
    status: "READ FREE",
    buyUrl: null,
  },
  {
    number: "#2",
    title: "The Place Where Windows Used to Be",
    copy: "Twenty-five years later, George leads Adam back downtown - and back to the rooftop memory that came before the light.",
    href: "/read/issue-2",
    cover: "/comics/issue-2/page-001.webp",
    pages: 26,
    status: "NEW ISSUE",
    buyUrl: null,
  },
];

export default function Home() {
  return (
    <main className="site-shell">
      <section className="hero">
        <div className="hero-grain" aria-hidden="true" />
        <div className="brand-row">
          <div className="ogb-stamp" aria-label="OGB Originals">
            <strong>OGB</strong>
            <span>ORIGINALS</span>
          </div>
          <span className="brand-note">A COMIC BY ADAM HOLMES</span>
        </div>

        <div className="hero-copy">
          <p className="eyebrow">NEW ALBANY, INDIANA · THEN &amp; NOW</p>
          <h1>
            THE LAST PARTY
            <span>OF 1999</span>
          </h1>
          <p className="hero-description">
            Bad decisions. Old friends. One impossible memory that refuses to stay in 1999.
          </p>
          <div className="hero-actions">
            <a className="hero-cta" href="#issues">
              Read the comics ↓
            </a>
            <a className="hero-cta merch-hero-cta" href="#merch">
              ORDER SWAG
            </a>
          </div>
        </div>

        <div className="hero-cover-stack" aria-hidden="true">
          <img className="stack-cover stack-one" src="/comics/issue-1/page-001.webp" alt="" />
          <img className="stack-cover stack-two" src="/comics/issue-2/page-001.webp" alt="" />
        </div>
      </section>

      <section className="izzy-support" aria-labelledby="izzy-support-title">
        <div>
          <p className="eyebrow">HELP THE SULLIVAN FAMILY</p>
          <h2 id="izzy-support-title">SUPPORT IZZY</h2>
          <p>Help Izzy after Hannah’s loss. The fundraiser is separate from merch purchases.</p>
        </div>
        <a
          className="izzy-support-button"
          href="https://www.gofundme.com/f/support-izzy-after-hannahs-loss?attribution_id=sl:7d8cce97-2b98-49aa-bc4c-7855601c33d9&lang=en_US&ts=1788364188&utm_campaign=fp_sharesheet&utm_content=amp30-treatment-3&utm_medium=customer&utm_source=facebook_reel"
          target="_blank"
          rel="noopener noreferrer"
        >
          SUPPORT IZZY NOW <span aria-hidden="true">↗</span>
        </a>
      </section>

      <MerchStore />

      <section className="issues-section" id="issues">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OGB ORIGINALS</p>
            <h2>THE ISSUES</h2>
          </div>
          <p>Free digital editions. Best experienced one page at a time.</p>
        </div>

        <div className="issue-grid">
          {issues.map((issue) => (
            <article className="issue-card" key={issue.number}>
              {issue.href ? (
                <Link className="issue-cover-link" href={issue.href} aria-label={`Read Issue ${issue.number}`}>
                  <img className="issue-cover" src={issue.cover} alt={`The Last Party of 1999 Issue ${issue.number} cover`} />
                  <span className={`issue-badge ${issue.status === "NEW ISSUE" ? "is-new" : ""}`}>{issue.status}</span>
                </Link>
              ) : (
                <div className="issue-cover-link" aria-label={`Issue ${issue.number} coming soon`}>
                  <img className="issue-cover" src={issue.cover} alt={`The Last Party of 1999 Issue ${issue.number} cover`} />
                  <span className="issue-badge is-coming">{issue.status}</span>
                </div>
              )}
              <div className="issue-info">
                <p className="issue-number">{issue.number === "BOOK" ? "NEW STORYBOOK" : `ISSUE ${issue.number}`}</p>
                <h3>{issue.title}</h3>
                <p>{issue.copy}</p>
                <div className="issue-meta">
                  <span>{issue.pages} digital pages</span>
                  <span>Mature language</span>
                </div>
                {issue.href ? <Link className="read-button" href={issue.href}>
                  READ ISSUE {issue.number} <span aria-hidden="true">→</span>
                </Link> : issue.buyUrl ? null : <span className="read-button is-disabled">BUY NOW LINK COMING SOON</span>}
                {issue.buyUrl ? (
                  <a className="buy-button" href={issue.buyUrl} target="_blank" rel="noopener noreferrer">
                    BUY NOW <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
                <a
                  className="share-button"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(issue.href ? `https://comics.spartaneo.com${issue.href}` : issue.buyUrl ?? "https://comics.spartaneo.com/")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SHARE TO FACEBOOK
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-strip">
        <p className="eyebrow">ABOUT THE SERIES</p>
        <p className="about-copy">
          A memory-driven comic about the people, places, stupid ideas, and unexplained moments that survive long after the party ends.
        </p>
      </section>

      <footer className="site-footer">
        <div className="ogb-stamp small" aria-hidden="true">
          <strong>OGB</strong>
          <span>ORIGINALS</span>
        </div>
        <p>THE LAST PARTY OF 1999 · OGB ORIGINALS</p>
        <p>Created by Adam Holmes</p>
      </footer>
    </main>
  );
}
