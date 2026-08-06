"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, TouchEvent } from "react";
import type { PageFlip } from "page-flip";
import { FACEBOOK_SHARE_URL } from "./social";

const PAGE_COUNT = 24;
const COVER_IMAGE = "/comic/issue-1/cover-hq.jpg";
const BACK_COVER_IMAGE = "/comic/issue-1/back-cover-hq.jpg";

type ReaderMode = "book" | "single" | "spread" | "scroll";
type BookOrientation = "portrait" | "landscape";

interface BookController {
  next: () => void;
  previous: () => void;
  turnTo: (bookPage: number) => void;
}

interface BookViewProps {
  page: number;
  controllerRef: MutableRefObject<BookController | null>;
  onPageChange: (page: number, bookPage: number) => void;
  onOrientationChange: (orientation: BookOrientation) => void;
}

interface ComicReaderProps {
  onClose: () => void;
}

const MODES: Array<{ value: ReaderMode; label: string; description: string }> = [
  { value: "book", label: "Book", description: "Turn pages like a physical comic" },
  { value: "single", label: "Page", description: "Focus on one page" },
  { value: "spread", label: "Spread", description: "Read facing pages together" },
  { value: "scroll", label: "Scroll", description: "Read continuously from top to bottom" },
];

function interiorImage(page: number) {
  return `/comic/issue-1/page-hq-${String(page).padStart(2, "0")}.jpg`;
}

function readerImage(page: number) {
  return page === 0 ? COVER_IMAGE : interiorImage(page);
}

function pageToBookPage(page: number) {
  return page === 0 ? 0 : page + 1;
}

function bookPageToPage(bookPage: number) {
  if (bookPage === 0) return 0;
  return Math.min(PAGE_COUNT, Math.max(1, bookPage - 1));
}

function pageLabel(page: number) {
  return page === 0 ? "Cover" : `Page ${page}`;
}

function savedReaderPage() {
  if (typeof window === "undefined") return 0;
  const saved = Number(window.localStorage.getItem("last-party-page"));
  return saved >= 1 && saved <= PAGE_COUNT ? saved : 0;
}

function savedReaderMode(): ReaderMode {
  if (typeof window === "undefined") return "book";
  const saved = window.localStorage.getItem("last-party-reader-mode") as ReaderMode | null;
  return saved && MODES.some((candidate) => candidate.value === saved) ? saved : "book";
}

function createImagePage(src: string, alt: string, className = "") {
  const page = document.createElement("div");
  page.className = `flip-page ${className}`.trim();
  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;
  image.draggable = false;
  image.decoding = "async";
  page.appendChild(image);
  return page;
}

function createInsideCover(position: "front" | "back") {
  const page = document.createElement("div");
  page.className = `flip-page inside-cover inside-cover-${position}`;

  const mark = document.createElement("strong");
  mark.textContent = "OGB";
  const kicker = document.createElement("span");
  kicker.textContent = position === "front" ? "Original Green Bean Gangstas" : "Issue #1 / First printing";
  const title = document.createElement("p");
  title.textContent = position === "front" ? "The Last Party of 1999" : "Some nights do not end. They wait.";
  const note = document.createElement("small");
  note.textContent = position === "front" ? "New Albany, Indiana / August 1999" : "OGB Originals / 2026";

  page.append(mark, kicker, title, note);
  return page;
}

function BookView({ page, controllerRef, onPageChange, onOrientationChange }: BookViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialPageRef = useRef(page);
  const callbacksRef = useRef({ onPageChange, onOrientationChange });

  useEffect(() => {
    callbacksRef.current = { onPageChange, onOrientationChange };
  }, [onOrientationChange, onPageChange]);

  useEffect(() => {
    let active = true;
    let instance: PageFlip | null = null;
    const container = containerRef.current;
    if (!container) return;

    const mount = document.createElement("div");
    mount.className = "book-flip";
    container.appendChild(mount);

    const build = async () => {
      const { PageFlip: PageFlipConstructor } = await import("page-flip");
      if (!active) return;

      const pages: HTMLElement[] = [
        createImagePage(COVER_IMAGE, "The Last Party of 1999 front cover", "hard-cover"),
        createInsideCover("front"),
        ...Array.from({ length: PAGE_COUNT }, (_, index) =>
          createImagePage(interiorImage(index + 1), `Comic page ${index + 1}`),
        ),
        createInsideCover("back"),
        createImagePage(BACK_COVER_IMAGE, "The Last Party of 1999 back cover", "hard-cover"),
      ];

      pages[0].dataset.density = "hard";
      pages[pages.length - 1].dataset.density = "hard";
      pages.forEach((bookPage) => mount.appendChild(bookPage));

      instance = new PageFlipConstructor(mount, {
        width: 656,
        height: 1000,
        size: "stretch",
        minWidth: 158,
        maxWidth: 720,
        minHeight: 240,
        maxHeight: 1098,
        drawShadow: true,
        flippingTime: 820,
        usePortrait: true,
        autoSize: true,
        maxShadowOpacity: 0.72,
        showCover: true,
        mobileScrollSupport: false,
        swipeDistance: 28,
        clickEventForward: false,
        useMouseEvents: true,
        showPageCorners: true,
        startPage: pageToBookPage(initialPageRef.current),
      });

      instance.loadFromHTML(pages);
      instance.on<number>("flip", (event) => {
        callbacksRef.current.onPageChange(bookPageToPage(event.data), event.data);
      });
      instance.on<BookOrientation>("changeOrientation", (event) => {
        callbacksRef.current.onOrientationChange(event.data);
      });

      controllerRef.current = {
        next: () => instance?.flipNext("top"),
        previous: () => instance?.flipPrev("top"),
        turnTo: (bookPage) => instance?.turnToPage(bookPage),
      };
      callbacksRef.current.onOrientationChange(instance.getOrientation());
    };

    void build();
    return () => {
      active = false;
      controllerRef.current = null;
      if (instance) instance.destroy();
      else mount.remove();
    };
  }, [controllerRef]);

  useEffect(() => {
    controllerRef.current?.turnTo(pageToBookPage(page));
  }, [controllerRef, page]);

  return (
    <div className="book-view">
      <div className="book-glow" aria-hidden="true" />
      <div className="book-mount" ref={containerRef} aria-label="Interactive page-turning comic" />
      <p className="book-hint"><span aria-hidden="true">↗</span> Drag a corner or swipe to turn the page</p>
    </div>
  );
}

export function ComicReader({ onClose }: ComicReaderProps) {
  const readerRef = useRef<HTMLElement>(null);
  const bookControllerRef = useRef<BookController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);
  const modeBeforeFullscreen = useRef<ReaderMode | null>(null);
  const [page, setPage] = useState(savedReaderPage);
  const [bookPage, setBookPage] = useState(() => pageToBookPage(savedReaderPage()));
  const [mode, setMode] = useState<ReaderMode>(savedReaderMode);
  const [bookOrientation, setBookOrientation] = useState<BookOrientation>("landscape");
  const [zoom, setZoom] = useState(1);
  const [thumbnailsOpen, setThumbnailsOpen] = useState(false);
  const [readingLight, setReadingLight] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [immersive, setImmersive] = useState(false);

  useEffect(() => {
    if (page >= 1) window.localStorage.setItem("last-party-page", String(page));
  }, [page]);

  useEffect(() => {
    window.localStorage.setItem("last-party-reader-mode", mode);
  }, [mode]);

  const changeMode = (nextMode: ReaderMode) => {
    setMode(nextMode);
    setZoom(1);
  };

  const playPageTurn = useCallback(() => {
    if (!soundOn) return;
    const context = new AudioContext();
    const duration = 0.16;
    const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) {
      const fade = 1 - index / channel.length;
      channel[index] = (Math.random() * 2 - 1) * fade * 0.22;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "bandpass";
    filter.frequency.value = 1250;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.11, context.currentTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    source.onended = () => void context.close();
  }, [soundOn]);

  const scrollToPage = useCallback((targetPage: number, behavior: ScrollBehavior = "smooth") => {
    const target = scrollRef.current?.querySelector<HTMLElement>(`[data-reader-page="${targetPage}"]`);
    target?.scrollIntoView({ behavior, block: "start" });
  }, []);

  const goToPage = useCallback((targetPage: number, behavior: ScrollBehavior = "smooth") => {
    const next = Math.min(PAGE_COUNT, Math.max(0, targetPage));
    setPage(next);
    setBookPage(pageToBookPage(next));
    if (mode === "book") bookControllerRef.current?.turnTo(pageToBookPage(next));
    if (mode === "scroll") requestAnimationFrame(() => scrollToPage(next, behavior));
  }, [mode, scrollToPage]);

  const nextPage = useCallback(() => {
    playPageTurn();
    if (mode === "book") {
      bookControllerRef.current?.next();
      return;
    }
    if (mode === "spread") {
      if (page === 0) goToPage(1);
      else if (page === 1) goToPage(2);
      else goToPage((page % 2 === 0 ? page : page - 1) + 2);
      return;
    }
    goToPage(page + 1);
  }, [goToPage, mode, page, playPageTurn]);

  const previousPage = useCallback(() => {
    playPageTurn();
    if (mode === "book") {
      bookControllerRef.current?.previous();
      return;
    }
    if (mode === "spread") {
      if (page <= 1) goToPage(0);
      else if (page <= 3) goToPage(1);
      else goToPage((page % 2 === 0 ? page : page - 1) - 2);
      return;
    }
    goToPage(page - 1);
  }, [goToPage, mode, page, playPageTurn]);

  const leaveFullscreen = useCallback(async () => {
    setImmersive(false);
    const previousMode = modeBeforeFullscreen.current;
    modeBeforeFullscreen.current = null;
    if (previousMode) {
      setMode(previousMode);
      setZoom(1);
    }
    const webkitDocument = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      else if (webkitDocument.webkitFullscreenElement) await webkitDocument.webkitExitFullscreen?.();
    } catch {
      // The CSS immersive layer still exits even when the browser rejects its native API.
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (immersive) {
      await leaveFullscreen();
      return;
    }

    setThumbnailsOpen(false);
    const phonePortrait = window.matchMedia("(max-width: 760px) and (orientation: portrait)").matches
      || (window.innerWidth <= 760 && window.innerHeight >= window.innerWidth);
    if (phonePortrait && (mode === "book" || mode === "spread")) {
      modeBeforeFullscreen.current = mode;
      setMode("single");
      setZoom(1);
    } else {
      modeBeforeFullscreen.current = null;
    }
    setImmersive(true);
    const element = readerRef.current as (HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    }) | null;
    try {
      if (element?.requestFullscreen) await element.requestFullscreen({ navigationUI: "hide" });
      else await element?.webkitRequestFullscreen?.();
    } catch {
      // iPhone browsers do not expose element fullscreen; immersive CSS is the fallback.
    }
  }, [immersive, leaveFullscreen, mode]);

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const webkitDocument = document as Document & { webkitFullscreenElement?: Element | null };
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement ?? webkitDocument.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const syncMobileViewport = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      readerRef.current?.style.setProperty("--reader-viewport-height", `${Math.round(height)}px`);
    };
    syncMobileViewport();
    window.addEventListener("resize", syncMobileViewport);
    window.visualViewport?.addEventListener("resize", syncMobileViewport);
    window.visualViewport?.addEventListener("scroll", syncMobileViewport);
    return () => {
      window.removeEventListener("resize", syncMobileViewport);
      window.visualViewport?.removeEventListener("resize", syncMobileViewport);
      window.visualViewport?.removeEventListener("scroll", syncMobileViewport);
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event("resize"))));
  }, [immersive]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        nextPage();
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        previousPage();
      }
      if (event.key.toLowerCase() === "f") void toggleFullscreen();
      if (event.key.toLowerCase() === "t") setThumbnailsOpen((current) => !current);
      if (event.key === "Escape") {
        if (immersive || document.fullscreenElement) void leaveFullscreen();
        else onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [immersive, leaveFullscreen, nextPage, onClose, previousPage, toggleFullscreen]);

  useEffect(() => {
    if (mode !== "scroll") return;
    requestAnimationFrame(() => scrollToPage(page, "auto"));
  }, [mode, page, scrollToPage]);

  const spreadPages = useMemo<Array<number | null>>(() => {
    if (page === 0) return [0];
    if (page === 1) return [null, 1];
    const start = page % 2 === 0 ? page : page - 1;
    return [start, start + 1 <= PAGE_COUNT ? start + 1 : null];
  }, [page]);

  const canGoBack = mode === "book" ? bookPage > 0 : page > 0;
  const canGoForward = mode === "book" ? bookPage < PAGE_COUNT + 3 : page < PAGE_COUNT;
  const currentLabel = mode === "book" && bookPage === PAGE_COUNT + 3 ? "Back cover" : pageLabel(page);

  const onStaticTouchEnd = (event: TouchEvent) => {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (distance < -55) nextPage();
    if (distance > 55) previousPage();
    touchStart.current = null;
  };

  const updateScrollPage = () => {
    const container = scrollRef.current;
    if (!container) return;
    const center = container.getBoundingClientRect().top + container.clientHeight * 0.42;
    let closestPage = page;
    let closestDistance = Number.POSITIVE_INFINITY;
    container.querySelectorAll<HTMLElement>("[data-reader-page]").forEach((candidate) => {
      const rect = candidate.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = Number(candidate.dataset.readerPage);
      }
    });
    if (closestPage !== page) setPage(closestPage);
  };

  return (
    <section
      ref={readerRef}
      className={`reader reader-${mode} ${readingLight ? "reading-light" : ""} ${immersive ? "reader-immersive" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Deluxe comic book reader"
    >
      <header className="reader-header">
        <div className="reader-title">
          <span className="reader-ogb">OGB</span>
          <div>
            <strong>The Last Party of 1999</strong>
            <span>Issue #1 · The Night We Don&apos;t Talk About</span>
          </div>
        </div>

        <div className="reader-mode-switch" role="group" aria-label="Viewing mode">
          {MODES.map((option) => (
            <button
              key={option.value}
              className={mode === option.value ? "active" : ""}
              onClick={() => changeMode(option.value)}
              aria-pressed={mode === option.value}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="reader-header-actions">
          <span className="quality-badge" title="Rendered from the print-ready master at 300 DPI">HQ · 300 DPI</span>
          <a
            className="reader-facebook"
            href={FACEBOOK_SHARE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share The Last Party of 1999 on Facebook"
            title="Share on Facebook"
          >
            <span aria-hidden="true">f</span> Share
          </a>
          <button onClick={() => setReadingLight((current) => !current)} aria-label="Toggle reading light" title="Reading light">
            {readingLight ? "Night" : "Light"}
          </button>
          <button onClick={toggleFullscreen} aria-label="Toggle fullscreen" title="Fullscreen (F)">
            {immersive || fullscreen ? "Exit full" : "Full screen"}
          </button>
          <button className="reader-close" onClick={onClose} aria-label="Close comic reader">×</button>
        </div>
      </header>

      <div className="reader-workspace">
        <button className="reader-arrow previous" onClick={previousPage} disabled={!canGoBack} aria-label="Previous page">‹</button>

        {mode === "book" && (
          <BookView
            page={page}
            controllerRef={bookControllerRef}
            onPageChange={(nextPageNumber, nextBookPage) => {
              setPage(nextPageNumber);
              setBookPage(nextBookPage);
              playPageTurn();
            }}
            onOrientationChange={setBookOrientation}
          />
        )}

        {mode === "single" && (
          <div
            className="static-page-viewport"
            onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
            onTouchEnd={onStaticTouchEnd}
            onDoubleClick={() => setZoom((current) => current > 1 ? 1 : 1.7)}
          >
            <div className="static-pages single-pages" style={{ transform: `scale(${zoom})` }} key={`single-${page}`}>
              <img src={readerImage(page)} alt={page === 0 ? "Comic front cover" : `Comic page ${page}`} draggable={false} />
            </div>
          </div>
        )}

        {mode === "spread" && (
          <div
            className="static-page-viewport"
            onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
            onTouchEnd={onStaticTouchEnd}
            onDoubleClick={() => setZoom((current) => current > 1 ? 1 : 1.55)}
          >
            <div className="static-pages spread-pages" style={{ transform: `scale(${zoom})` }} key={`spread-${spreadPages.join("-")}`}>
              {spreadPages.map((spreadPage, index) => spreadPage === null ? (
                <div className="blank-static-page" key={`blank-${index}`} aria-hidden="true"><span>OGB</span></div>
              ) : (
                <img key={spreadPage} src={readerImage(spreadPage)} alt={spreadPage === 0 ? "Comic front cover" : `Comic page ${spreadPage}`} draggable={false} />
              ))}
            </div>
          </div>
        )}

        {mode === "scroll" && (
          <div className="scroll-reader" ref={scrollRef} onScroll={updateScrollPage}>
            {Array.from({ length: PAGE_COUNT + 1 }, (_, index) => (
              <figure key={index} data-reader-page={index}>
                <img src={readerImage(index)} alt={index === 0 ? "Comic front cover" : `Comic page ${index}`} loading={index < 3 ? "eager" : "lazy"} />
                <figcaption>{pageLabel(index)}</figcaption>
              </figure>
            ))}
          </div>
        )}

        <button className="reader-arrow next" onClick={nextPage} disabled={!canGoForward} aria-label="Next page">›</button>

        {thumbnailsOpen && (
          <aside className="thumbnail-rail" aria-label="Page thumbnails">
            <button className="thumbnail-close" onClick={() => setThumbnailsOpen(false)} aria-label="Close thumbnails">×</button>
            {Array.from({ length: PAGE_COUNT + 1 }, (_, index) => (
              <button
                key={index}
                className={page === index ? "active" : ""}
                onClick={() => goToPage(index)}
                aria-label={`Go to ${pageLabel(index)}`}
              >
                <img src={index === 0 ? "/comic/issue-1/cover.jpg" : `/comic/issue-1/page-${String(index).padStart(2, "0")}.jpg`} alt="" loading="lazy" />
                <span>{index === 0 ? "C" : index}</span>
              </button>
            ))}
          </aside>
        )}
      </div>

      <footer className="reader-controls">
        <div className="page-status" aria-live="polite">
          <strong>{currentLabel}</strong>
          <span>{mode === "book" ? `${bookOrientation} book` : MODES.find((candidate) => candidate.value === mode)?.label}</span>
        </div>

        <div className="reader-progress">
          <input
            className="page-slider"
            type="range"
            min="0"
            max={PAGE_COUNT}
            value={page}
            aria-label="Jump to page"
            onChange={(event) => goToPage(Number(event.target.value), "auto")}
          />
          <span>{page === 0 ? "Cover" : `${page} / ${PAGE_COUNT}`}</span>
        </div>

        <div className="reader-tools">
          <button className={thumbnailsOpen ? "active" : ""} onClick={() => setThumbnailsOpen((current) => !current)} aria-label="Toggle page thumbnails" title="Thumbnails (T)">Pages</button>
          <button className={soundOn ? "active" : ""} onClick={() => setSoundOn((current) => !current)} aria-label="Toggle page-turn sound" title="Page-turn sound">Sound</button>
          <button onClick={() => setZoom((value) => Math.max(0.8, Number((value - 0.15).toFixed(2))))} disabled={mode === "book" || mode === "scroll"} aria-label="Zoom out">−</button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((value) => Math.min(2.2, Number((value + 0.15).toFixed(2))))} disabled={mode === "book" || mode === "scroll"} aria-label="Zoom in">+</button>
        </div>
      </footer>

      {immersive && (
        <div className="immersive-overlay">
          <span>{currentLabel}</span>
          <button onClick={leaveFullscreen} aria-label="Exit fullscreen reader">Exit full screen</button>
        </div>
      )}
    </section>
  );
}
