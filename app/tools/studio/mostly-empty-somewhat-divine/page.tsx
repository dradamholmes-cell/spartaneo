import Link from "next/link";
import { notFound } from "next/navigation";
import manifest from "@/data/studio/mostly-empty-somewhat-divine.json";
import { requireChatGPTUser } from "../../../chatgpt-auth";

export const metadata = {
  title: "Mostly Empty | OGB Studio",
  robots: { index: false, follow: false },
};

function shortPath(path: string) {
  return path.split("/").pop() || path;
}

export default async function MostlyEmptyStudioRoom() {
  const user = await requireChatGPTUser("/tools/studio/mostly-empty-somewhat-divine");
  const allowed = (process.env.SPARTANEO_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase());
  if (!allowed.includes(user.email.toLowerCase())) notFound();

  return (
    <main className="room">
      <style>{`
        .room{min-height:100vh;padding:30px clamp(18px,4vw,58px) 72px;background:#090a09;color:#eee4cf;font-family:Arial,sans-serif}.top{display:flex;justify-content:space-between;gap:18px;align-items:center}.top a{color:#aaa194;font-size:12px;font-weight:900;letter-spacing:.1em}.trusted{padding:8px 11px;border:1px solid #2f7d4c;background:#102219;color:#8de8ab;font-size:11px;font-weight:900;letter-spacing:.08em}
        h1{margin:28px 0 8px;font-family:Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif;font-size:clamp(48px,8vw,94px);line-height:.9}.sub{max-width:850px;color:#aaa194;line-height:1.6}.warning{margin:22px 0;padding:18px;border:2px solid #f1963a;background:#1c140c;font-weight:900}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:22px 0 34px}.metric{padding:18px;border:1px solid #2b2c28;background:#121310}.metric b{display:block;font-size:30px}.metric span{font-size:10px;color:#9f978b;font-weight:900;letter-spacing:.12em}
        h2{margin:34px 0 12px;font-size:15px;letter-spacing:.12em}.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}.panel{padding:20px;border:1px solid #2b2c28;background:#11120f}.panel h3{margin:0 0 12px}.panel ul,.panel ol{margin:0;padding-left:20px;color:#b6ada0;line-height:1.7}.keepers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.file{padding:10px 12px;border:1px solid #262723;background:#0d0e0c;color:#c9c0b4;font-size:12px;overflow-wrap:anywhere}.hash{font-family:monospace;font-size:11px;color:#958d81;overflow-wrap:anywhere}.next{margin-top:28px;padding:22px;border:2px solid #52b875;background:#0d1811}.next li{margin:8px 0}.footer-note{margin-top:22px;color:#8f887e;font-size:12px;line-height:1.55}
        @media(max-width:900px){.grid{grid-template-columns:repeat(2,1fr)}.two,.keepers{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column}}
      `}</style>

      <div className="top">
        <Link href="/tools/studio">← OGB STUDIO</Link>
        <span className="trusted">TRUSTED IMPORT · {manifest.package_date}</span>
      </div>

      <h1>{manifest.title}</h1>
      <p className="sub">First real OGB Studio comic room. This screen reflects the authoritative 2026-09-25 import package and intentionally does not infer missing final pagination.</p>

      <div className="warning">201-PAGE WORKING COMPILATION = RECOVERY PARTS BIN. DO NOT EXPORT IT AS THE FINAL BOOK.</div>

      <section className="grid">
        <div className="metric"><b>{manifest.character_locks.count}</b><span>CHARACTER LOCKS</span></div>
        <div className="metric"><b>{manifest.approved_keepers.count}</b><span>APPROVED KEEPERS</span></div>
        <div className="metric"><b>{manifest.provisional_reference.count}</b><span>PROVISIONAL ONLY</span></div>
        <div className="metric"><b>{manifest.source_package.verified_files}</b><span>HASH-VERIFIED FILES</span></div>
      </section>

      <section className="two">
        <div className="panel">
          <h3>CURRENT STATE</h3>
          <ul>
            <li>Status: {manifest.current_status.replaceAll("_", " ")}</li>
            <li>Final page count: not frozen</li>
            <li>Final cover/spine: blocked until page count is frozen</li>
            <li>Binary asset storage: {manifest.source_package.asset_storage.replaceAll("_", " ")}</li>
            <li>Cross-project retrieval: disabled</li>
          </ul>
        </div>
        <div className="panel">
          <h3>PRINT LOCK</h3>
          <ul>
            <li>Trim: {manifest.print.trim_inches[0]} × {manifest.print.trim_inches[1]} in</li>
            <li>Full bleed: {manifest.print.full_bleed_inches[0]} × {manifest.print.full_bleed_inches[1]} in</li>
            <li>One portrait page per generation unless centerfold is explicit</li>
            <li>No stretching to repair crop/safe-area problems</li>
          </ul>
        </div>
      </section>

      <h2>NEXT WORK</h2>
      <section className="next">
        <ol>{manifest.next_work.map((item) => <li key={item}>{item}</li>)}</ol>
      </section>

      <h2>EDITORIAL OPEN ITEMS</h2>
      <section className="panel">
        <ul>{manifest.editorial_open_items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <h2>OPEN REPAIRS</h2>
      <section className="panel">
        <ul>{manifest.open_repairs.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <h2>STORY / ENDING LOCKS</h2>
      <section className="two">
        <div className="panel"><ul>{manifest.story_locks.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="panel">
          <h3>FINAL THOUGHT</h3>
          <ol>{manifest.ending_lock.final_lines.map((line) => <li key={line}>{line}</li>)}</ol>
        </div>
      </section>

      <h2>APPROVED KEEPERS</h2>
      <section className="keepers">{manifest.approved_keepers.paths.map((path) => <div className="file" key={path}>{shortPath(path)}</div>)}</section>

      <h2>LOCKED CHARACTER REFERENCES</h2>
      <section className="keepers">{manifest.character_locks.paths.map((path) => <div className="file" key={path}>{shortPath(path)}</div>)}</section>

      <h2>IMPORT FINGERPRINT</h2>
      <section className="panel">
        <div>{manifest.source_package.filename}</div>
        <div className="hash">SHA-256: {manifest.source_package.sha256}</div>
      </section>

      <p className="footer-note">The actual binary art/PDF files remain outside this public GitHub repository until private asset storage is connected. This room stores only the trusted production metadata and rules needed to prevent drift and cross-project contamination.</p>
    </main>
  );
}
