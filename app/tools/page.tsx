import { notFound } from "next/navigation";
import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";

export const metadata = { title: "Creator Tools | Spartaneo", robots: { index: false, follow: false } };

export default async function CreatorToolsPage() {
  const user = await requireChatGPTUser("/tools");
  const allowed = (process.env.SPARTANEO_ADMIN_EMAILS || "").split(",").map(value => value.trim().toLowerCase());
  if (!allowed.includes(user.email.toLowerCase())) notFound();
  return (
    <main className="creator-hub">
      <style>{`
        .creator-hub{min-height:100vh;padding:42px clamp(20px,5vw,72px) 80px;background:#0b0b0a;color:#ece0c8}
        .creator-hub>a{color:#a99e8d;font-size:12px;font-weight:900;letter-spacing:.1em}
        .creator-hub h1{margin:24px 0 8px;font-family:Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif;font-size:clamp(54px,8vw,96px);line-height:.9}
        .creator-hub>p{max-width:760px;color:#a99e8d;line-height:1.6}
        .creator-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;max-width:980px;margin-top:30px}
        .creator-card{display:flex;min-height:250px;flex-direction:column;padding:28px;border:1px solid rgba(255,255,255,.2);background:#141412;color:inherit;text-decoration:none}
        .creator-card span{color:#f1963a;font-size:12px;font-weight:900;letter-spacing:.16em}.creator-card h2{margin:16px 0 10px;font-size:clamp(28px,5vw,46px);line-height:.95}.creator-card p{color:#aaa194;line-height:1.55}.creator-card strong{margin-top:auto;padding-top:24px}.creator-primary{border:2px solid #f1963a;box-shadow:7px 7px 0 #000}
        @media(max-width:720px){.creator-grid{grid-template-columns:1fr}.creator-card{min-height:220px}}
      `}</style>
      <Link href="/">← SPARTANEO HOME</Link>
      <h1>CREATOR TOOLS</h1>
      <p>Pick what you are working on. These controls are visible only to the Spartaneo owner account.</p>
      <section className="creator-grid">
        <Link className="creator-card creator-primary" href="/tools/book-runner"><span>COMICS</span><h2>OGB Book Runner</h2><p>Load a whole book, send the correct page and clean references to Gemini, then lock it and move forward.</p><strong>OPEN BOOK RUNNER →</strong></Link>
        <Link className="creator-card" href="/tools/merch"><span>MERCH</span><h2>Merch Control</h2><p>Build product drafts from existing artwork and review them before publishing.</p><strong>OPEN MERCH CONTROL →</strong></Link>
      </section>
    </main>
  );
}
