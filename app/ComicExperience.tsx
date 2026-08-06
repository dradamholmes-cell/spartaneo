"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_COUNT = 24;
const LULU_URL =
  "https://www.lulu.com/shop/adam-holmes/the-last-party-of-1999/paperback/product-dy4wmeq.html";

function pageImage(page: number) {
  return `/comic/issue-1/page-${String(page).padStart(2, "0")}.jpg`;
}

export function ComicExperience() {
  const [readerOpen, setReaderOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [spread, setSpread] = useState(false);
  const [zoom, setZoom] = useState(1);
  const touchStart = useRef<number | null>(null);

  const step = spread ? 2 : 1;
  const lastStartPage = spread ? PAGE_COUNT - 1 : PAGE_COUNT;

  const openReader = useCallback(() => {
    const saved = Number(window.localStorage.getItem("last-party-page"));
    setPage(saved >= 1 && saved <= PAGE_COUNT ? saved : 1);
    setReaderOpen(true);
  }, []);

  const closeReader = useCallback(() => setReaderOpen(false), []);

  const nextPage = useCallback(() => {
    setPage((current) => Math.min(lastStartPage, current + step));
  }, [lastStartPage, step]);

  const previousPage = useCallback(() => {
    setPage((current) => Math.max(1, current - step));
  }, [step]);

  useEffect(() => {
    if (!readerOpen) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown") nextPage();
      if (event.key === "ArrowLeft" || event.key === "PageUp") previousPage();
      if (event.key === "Escape") closeReader();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeReader, nextPage, previousPage, readerOpen]);

  useEffect(() => {
    if (readerOpen) window.localStorage.setItem("last-party-page", String(page));
  }, [page, readerOpen]);

  useEffect(() => {
    if (!readerOpen) return;
    [page + step, page + step + 1]
      .filter((candidate) => candidate <= PAGE_COUNT)
      .forEach((candidate) => {
        const image = new Image();
        image.src = pageImage(candidate);
      });
  }, [page, readerOpen, step]);

  const toggleSpread = () => {
    setSpread((current) => {
      const next = !current;
      if (next && page % 2 === 0) setPage(Math.max(1, page - 1));
      return next;
    });
    setZoom(1);
  };

  const enterFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (distance < -55) nextPage();
    if (distance > 55) previousPage();
    touchStart.current = null;
  };

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
              Read issue #1
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

      {readerOpen && (
        <section className="reader" role="dialog" aria-modal="true" aria-label="Comic book reader">
          <header className="reader-header">
            <div className="reader-title">
              <span className="reader-ogb">OGB</span>
              <div><strong>The Last Party of 1999</strong><span>Issue #1 · The Night We Don&apos;t Talk About</span></div>
            </div>
            <div className="reader-header-actions">
              <a href={LULU_URL} target="_blank" rel="noreferrer">Buy print ↗</a>
              <button onClick={closeReader} aria-label="Close comic reader">×</button>
            </div>
          </header>

          <div
            className={`reader-stage ${spread ? "spread" : "single"}`}
            onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
            onTouchEnd={onTouchEnd}
          >
            <button className="reader-arrow previous" onClick={previousPage} disabled={page === 1} aria-label="Previous page">‹</button>
            <div className="page-viewport">
              <div className="page-pair" style={{ transform: `scale(${zoom})` }}>
                <img src={pageImage(page)} alt={`Comic page ${page}`} />
                {spread && page + 1 <= PAGE_COUNT && <img src={pageImage(page + 1)} alt={`Comic page ${page + 1}`} />}
              </div>
            </div>
            <button className="reader-arrow next" onClick={nextPage} disabled={page >= lastStartPage} aria-label="Next page">›</button>
          </div>

          <footer className="reader-controls">
            <div className="page-status">
              <strong>{spread && page + 1 <= PAGE_COUNT ? `${page}–${page + 1}` : page}</strong>
              <span>of {PAGE_COUNT}</span>
            </div>
            <input
              className="page-slider"
              type="range"
              min="1"
              max={lastStartPage}
              value={page}
              aria-label="Jump to page"
              onChange={(event) => setPage(Number(event.target.value))}
            />
            <div className="reader-tools">
              <button onClick={() => setZoom((value) => Math.max(0.8, Number((value - 0.2).toFixed(1))))} aria-label="Zoom out">−</button>
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.2).toFixed(1))))} aria-label="Zoom in">+</button>
              <button className={spread ? "active" : ""} onClick={toggleSpread} aria-label="Toggle two-page view">▣</button>
              <button onClick={enterFullscreen} aria-label="Toggle fullscreen">⛶</button>
            </div>
          </footer>
        </section>
      )}
    </main>
  );
}
