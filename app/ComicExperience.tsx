"use client";

import { useCallback, useState } from "react";
import { ComicReader } from "./ComicReader";

const LULU_URL =
  "https://www.lulu.com/shop/adam-holmes/the-last-party-of-1999/paperback/product-dy4wmeq.html";

export function ComicExperience() {
  const [readerOpen, setReaderOpen] = useState(false);

  const openReader = useCallback(() => {
    setReaderOpen(true);
  }, []);

  const closeReader = useCallback(() => setReaderOpen(false), []);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="OGB Originals home">
          <span className="brand-mark">OGB</span>
          <span className="brand-copy">Original Green Bean Gangstas</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#bookshelf">Bookshelf</a>
          <a href="#story">The story</a>
          <a className="nav-buy" href={LULU_URL} target="_blank" rel="noreferrer">
            Buy the comic
          </a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span>Issue #1</span> OGB Originals / New Albany, Indiana</p>
          <h1>The Last Party of <strong>1999</strong></h1>
          <p className="subtitle">The Night We Don&apos;t Talk About</p>
          <p className="hero-description">
            One last summer night. A chain of bad decisions. Old friends, close calls,
            and something impossible waiting beyond the edge of town.
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={openReader}>
              <span className="play-icon" aria-hidden="true">▶</span>
              Open deluxe reader
            </button>
            <a className="secondary-action" href={LULU_URL} target="_blank" rel="noreferrer">
              Get the print edition <span>↗</span>
            </a>
          </div>
          <dl className="quick-facts">
            <div><dt>24</dt><dd>full-color pages</dd></div>
            <div><dt>1999</dt><dd>New Albany, IN</dd></div>
            <div><dt>$16.09</dt><dd>paperback at Lulu</dd></div>
          </dl>
        </div>
        <div className="hero-cover-wrap" aria-label="Cover of The Last Party of 1999">
          <div className="cover-shadow" />
          <img className="hero-cover" src="/comic/issue-1/cover.jpg" alt="The Last Party of 1999 Issue 1 comic book cover" />
          <span className="first-printing">First printing</span>
        </div>
        <div className="hero-tagline" aria-hidden="true">
          <span>Some nights do not end.</span>
          <strong>They wait.</strong>
        </div>
      </section>

      <section className="bookshelf-section" id="bookshelf">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OGB archive</p>
            <h2>The bookshelf</h2>
          </div>
          <p>Stories built from real memories, real places, and the details friends keep alive for decades.</p>
        </div>

        <div className="shelf">
          <article className="book-card available">
            <button className="book-cover-button" onClick={openReader} aria-label="Read The Last Party of 1999 Issue 1">
              <img src="/comic/issue-1/cover.jpg" alt="The Last Party of 1999 Issue 1 cover" />
              <span className="read-ribbon">Read now</span>
            </button>
            <div className="book-meta">
              <span className="issue-label">Issue #1 · Available now</span>
              <h3>The Night We Don&apos;t Talk About</h3>
              <p>August 1999. The St. Joe&apos;s picnic, Momma Meena&apos;s basement, a police escape, Dairy Queen—and a game that changes everything.</p>
              <div className="book-actions">
                <button onClick={openReader}>Open reader</button>
                <a href={LULU_URL} target="_blank" rel="noreferrer">Buy print ↗</a>
              </div>
            </div>
          </article>

          <article className="book-card coming-soon">
            <div className="teaser-cover">
              <img src="/comic/issue-1/page-24.jpg" alt="Teaser art for Issue 2" />
              <span className="coming-stamp">Coming next</span>
            </div>
            <div className="book-meta">
              <span className="issue-label">Issue #2 · In development</span>
              <h3>The Place Where Windows Used to Be</h3>
              <p>Twenty years later, George opens another door—and the city remembers more than it should.</p>
              <span className="quiet-link">A new chapter is taking shape.</span>
            </div>
          </article>
          <div className="shelf-board" aria-hidden="true" />
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="story-art">
          <img src="/comic/issue-1/page-18.jpg" alt="Friends talking late at night in a basement, from The Last Party of 1999" />
        </div>
        <div className="story-copy">
          <p className="eyebrow">About the series</p>
          <h2>Memory gets the last word.</h2>
          <p className="story-lead">
            <em>The Last Party of 1999</em> is a darkly funny, nostalgic comic about friendship,
            bad judgment, and the strange way one summer night can follow you for decades.
          </p>
          <p>
            Adam, Sully, Streepy, Indo Lindo, and George—the biggest Labrador anyone has ever seen—move through a New Albany that feels exactly remembered and just slightly impossible.
          </p>
          <blockquote>“I used to think memory was like a filing cabinet.”</blockquote>
          <button className="text-action" onClick={openReader}>Start from page one <span>→</span></button>
        </div>
      </section>

      <section className="print-cta">
        <div>
          <p className="eyebrow">Hold the story</p>
          <h2>Own the first printing.</h2>
          <p>24 full-color pages. Glossy saddle-stitched paperback, printed to order by Lulu.</p>
        </div>
        <a href={LULU_URL} target="_blank" rel="noreferrer">
          Buy at Lulu <strong>$16.09</strong> <span>↗</span>
        </a>
      </section>

      <footer>
        <div className="footer-brand"><strong>OGB</strong><span>Original Green Bean Gangstas</span></div>
        <p>Created by Adam Holmes · New Albany, Indiana</p>
        <p>© 2026 OGB Originals. All rights reserved.</p>
      </footer>

      {readerOpen && <ComicReader onClose={closeReader} />}
    </main>
  );
}
