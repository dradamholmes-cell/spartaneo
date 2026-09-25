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
        .creator-card span{color:#f1963a;font-size:12px;font-weight:900;letter-spacing:.16em}.creator-card h2{margin:16px 0 10px;font-size:clamp(28px,5vw,46px);line-height:.95}.creator-card p{color:#aaa194;line-height:1.55}.creator-card strong{margin-top:auto;padding-top:24px}.creator-primary{grid-column:1/-1;border:2px solid #52b875;box-shadow:7px 7px 0 #000}.creator-primary span{color:#8de8ab}
        @media(max-width:720px){.creator-grid{grid-template-columns:1fr}.creator-card{min-height:220px}.creator-primary{grid-column:auto}}
      `}</style>
      <Link href="/">← SPARTANEO HOME</Link>
      <h1>CREATOR TOOLS</h1>
      <p>Owner-only controls for Spartaneo. OGB Studio is becoming the single home for project state, comic production, publishing, site work, and ChatGPT-driven actions.</p>
      <section className="creator-grid">
        <Link className="creator-card creator-primary" href="/tools/studio"><span>CONTROL ROOM · NO CODEX REQUIRED</span><h2>OGB Studio</h2><p>Project-isolated comic rooms, publishing state, safe site operations, previews, approval gates, and future normal-ChatGPT tool actions.</p><strong>OPEN OGB STUDIO →</strong></Link>
        <Link className="creator-card" href="/tools/book-runner"><span>LEGACY COMIC TOOL</span><h2>OGB Book Runner</h2><p>Open the existing book runner while its useful pieces are migrated into OGB Studio.</p><strong>OPEN BOOK RUNNER →</strong></Link>
        <Link className="creator-card" href="/tools/merch"><span>MERCH</span><h2>Merch Control</h2><p>Build product drafts from existing artwork and review them before publishing.</p><strong>OPEN MERCH CONTROL →</strong></Link>
      </section>
    </main>
  );
}
