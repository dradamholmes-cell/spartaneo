"use client";

import { useState } from "react";

const PAGE_URL = "https://comics.spartaneo.com/hannah";
const SHARE_TEXT = "Hannah Sullivan — Your Light Still Shines. Memorial shirts, a men's cap, wall canvas, and support for Izzy.";

export default function HannahShareButtons() {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hannah Sullivan — Your Light Still Shines",
          text: SHARE_TEXT,
          url: PAGE_URL,
        });
        return;
      } catch {
        // User cancelled or native sharing is unavailable; fall through to copy.
      }
    }

    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(PAGE_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy Hannah's memorial page link:", PAGE_URL);
    }
  }

  return (
    <div className="hannah-share-row">
      <button className="hannah-share-primary" type="button" onClick={share}>
        SHARE HANNAH'S PAGE
      </button>
      <a
        className="hannah-share-secondary"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(PAGE_URL)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        FACEBOOK SHARE
      </a>
      <button className="hannah-share-secondary" type="button" onClick={copyLink}>
        {copied ? "LINK COPIED ✓" : "COPY LINK"}
      </button>
    </div>
  );
}
