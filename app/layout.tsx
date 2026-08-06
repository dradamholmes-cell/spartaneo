import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050606",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "comics.spartaneo.com";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const title = "The Last Party of 1999 | OGB Originals";
  const description = "Read Issue #1 online and get the full-color print edition of The Last Party of 1999.";

  return {
    metadataBase: base,
    title,
    description,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: "Last Party 1999",
      statusBarStyle: "black-translucent",
    },
    other: { "mobile-web-app-capable": "yes" },
    icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
    openGraph: {
      title,
      description,
      type: "website",
      url: base,
      images: [{ url: new URL("/og.png?v=20260806", base).toString(), width: 1536, height: 1024, alt: "The Last Party of 1999 Issue 1" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [new URL("/og.png?v=20260806", base).toString()] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
