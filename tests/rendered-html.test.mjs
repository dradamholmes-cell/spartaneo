import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://comics.spartaneo.com/", {
      headers: { accept: "text/html", host: "comics.spartaneo.com" },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the OGB comic storefront", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>The Last Party of 1999 \| OGB Originals<\/title>/i);
  assert.match(html, /Open deluxe reader/i);
  assert.match(html, /The bookshelf/i);
  assert.match(html, /The Place Where Windows Used to Be/i);
  assert.match(html, /product-dy4wmeq\.html/i);
  assert.match(html, /og:image[^>]+comics\.spartaneo\.com\/og\.png/i);
  assert.match(html, /manifest\.webmanifest/i);
  assert.match(html, /apple-mobile-web-app-capable/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships the complete deluxe reader and print-quality assets", async () => {
  const [readerSource, packageJson, pageFiles] = await Promise.all([
    readFile(new URL("../app/ComicReader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readdir(new URL("../public/comic/issue-1/", import.meta.url)),
  ]);

  const pages = pageFiles.filter((name) => /^page-\d{2}\.jpg$/.test(name));
  const highQualityPages = pageFiles.filter((name) => /^page-hq-\d{2}\.jpg$/.test(name));
  assert.equal(pages.length, 24);
  assert.equal(highQualityPages.length, 24);
  assert.ok(pageFiles.includes("cover.jpg"));
  assert.ok(pageFiles.includes("cover-hq.jpg"));
  assert.ok(pageFiles.includes("back-cover-hq.jpg"));
  assert.ok(pageFiles.includes("cover-spread.jpg"));
  assert.match(readerSource, /const PAGE_COUNT = 24/);
  assert.match(readerSource, /last-party-page/);
  assert.match(readerSource, /ArrowRight/);
  assert.match(readerSource, /requestFullscreen/);
  assert.match(readerSource, /reader-immersive/);
  assert.match(readerSource, /visualViewport/);
  assert.match(readerSource, /phonePortrait/);
  assert.match(readerSource, /modeBeforeFullscreen/);
  assert.match(readerSource, /"book" \| "single" \| "spread" \| "scroll"/);
  assert.match(readerSource, /PageFlip/);
  assert.match(readerSource, /HQ · 300 DPI/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/favicon.png", import.meta.url));
  await access(new URL("../public/manifest.webmanifest", import.meta.url));
});
