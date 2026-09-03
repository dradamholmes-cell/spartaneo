import assert from "node:assert/strict";
import { access, readdir } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the OGB comic home", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>The Last Party of 1999 \| OGB Originals<\/title>/i);
  assert.match(html, /THE LAST PARTY/);
  assert.match(html, /OF 1999/);
  assert.match(html, /The Night We Don.t Talk About/i);
  assert.match(html, /The Place Where Windows Used to Be/i);
  assert.match(html, /href=["']\/read\/issue-1["']/i);
  assert.match(html, /href=["']\/read\/issue-2["']/i);
  assert.match(html, /href=["']\/read\/issue-3["']/i);
  assert.match(html, /SUPPORT IZZY/i);
  assert.match(html, /support-izzy-after-hannahs-loss/i);
  assert.match(html, /ORDER NOW/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
});

test("server-renders both comic reader routes", async () => {
  const issueOne = await render("/read/issue-1");
  const issueTwo = await render("/read/issue-2");

  assert.equal(issueOne.status, 200);
  assert.equal(issueTwo.status, 200);

  const oneHtml = await issueOne.text();
  const twoHtml = await issueTwo.text();

  assert.match(oneHtml, /Issue #1/i);
  assert.match(oneHtml, /The Night We Don.t Talk About/i);
  assert.match(oneHtml, /page-001\.webp/i);

  assert.match(twoHtml, /Issue #2/i);
  assert.match(twoHtml, /The Place Where Windows Used to Be/i);
  assert.match(twoHtml, /page-001\.webp/i);
});

test("ships complete contiguous comic page assets without Issue 2 trailing blanks", async () => {
  const issueOneRoot = new URL("../public/comics/issue-1/", import.meta.url);
  const issueTwoRoot = new URL("../public/comics/issue-2/", import.meta.url);
  const [issueOne, issueTwo] = await Promise.all([
    readdir(issueOneRoot),
    readdir(issueTwoRoot),
  ]);

  const onePages = issueOne.filter((name) => /^page-\d{3}\.webp$/.test(name)).sort();
  const twoPages = issueTwo.filter((name) => /^page-\d{3}\.webp$/.test(name)).sort();

  assert.equal(onePages.length, 23);
  assert.equal(twoPages.length, 26);
  assert.equal(onePages[0], "page-001.webp");
  assert.equal(onePages.at(-1), "page-023.webp");
  assert.equal(twoPages[0], "page-001.webp");
  assert.equal(twoPages.at(-1), "page-026.webp");

  await assert.rejects(access(new URL("page-027.webp", issueTwoRoot)));
  await assert.rejects(access(new URL("page-028.webp", issueTwoRoot)));
});
