import Link from "next/link";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { STUDIO_PROJECTS, STUDIO_RULES } from "../../studio-registry";

export const metadata = {
  title: "OGB Studio | Spartaneo",
  robots: { index: false, follow: false },
};

export default async function OgbStudioPage() {
  const user = await requireChatGPTUser("/tools/studio");
  const allowed = (process.env.SPARTANEO_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase());
  if (!allowed.includes(user.email.toLowerCase())) notFound();

  const connected = STUDIO_PROJECTS.filter((project) => project.migrationState === "connected").length;
  const imported = STUDIO_PROJECTS.filter((project) => project.migrationState === "metadata-imported").length;
  const needsImport = STUDIO_PROJECTS.filter((project) => project.migrationState === "needs-import").length;

  return (
    <main className="studio-shell">
      <style>{`
        .studio-shell{min-height:100vh;padding:34px clamp(18px,4vw,58px) 72px;background:#090a09;color:#eee4cf;font-family:Arial,sans-serif}
        .studio-top{display:flex;justify-content:space-between;gap:20px;align-items:center}.studio-top a{color:#a9a093;font-size:12px;font-weight:900;letter-spacing:.1em}.pill{border:1px solid #2d6f47;background:#102219;color:#8de8ab;padding:8px 12px;font-size:11px;font-weight:900;letter-spacing:.08em}
        h1{margin:28px 0 8px;font-family:Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif;font-size:clamp(56px,9vw,112px);line-height:.86;letter-spacing:.01em}.dek{max-width:880px;color:#aaa194;font-size:17px;line-height:1.6}
        .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:28px 0}.stat{padding:18px;border:1px solid #2a2a27;background:#111210}.stat b{display:block;font-size:28px}.stat span{color:#9b9387;font-size:11px;font-weight:900;letter-spacing:.12em}
        h2{margin:38px 0 14px;font-size:16px;letter-spacing:.12em}.project-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.project{padding:22px;border:1px solid #2c2d29;background:#131411}.project.connected{border-color:#2f7d4c}.project.imported{border-color:#a8772b}.project small{color:#f1963a;font-weight:900;letter-spacing:.12em}.project h3{margin:10px 0 8px;font-size:26px}.project p{margin:0;color:#aaa194;line-height:1.5}.status{display:inline-block;margin-top:18px;padding:7px 9px;border:1px solid #3a3b36;color:#bbb2a5;font-size:11px;font-weight:900}.status.ok{border-color:#2f7d4c;color:#8de8ab}.status.imported{border-color:#a8772b;color:#f0b45c}.room-link{display:block;margin-top:18px;color:#8de8ab;font-size:12px;font-weight:900;letter-spacing:.08em}
        .workflow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.step{padding:18px;border:1px solid #2a2a27;background:#0f100e}.step b{display:block;color:#f1963a;margin-bottom:8px}.step span{color:#aaa194;font-size:13px;line-height:1.45}
        .rules{margin-top:24px;padding:22px;border:1px solid #2a2a27;background:#10110f}.rules ul{margin:10px 0 0;padding-left:20px;color:#bbb2a5;line-height:1.8}.next{margin-top:28px;padding:24px;border:2px solid #f1963a;background:#16120d;box-shadow:7px 7px 0 #000}.next strong{display:block;font-size:22px}.next p{margin-bottom:0;color:#c4b9a9}
        @media(max-width:860px){.stats{grid-template-columns:repeat(2,1fr)}.project-grid{grid-template-columns:1fr}.workflow{grid-template-columns:1fr}.studio-top{align-items:flex-start;flex-direction:column}}
      `}</style>

      <div className="studio-top">
        <Link href="/tools">← CREATOR TOOLS</Link>
        <span className="pill">CODEX NOT REQUIRED</span>
      </div>

      <h1>OGB STUDIO</h1>
      <p className="dek">
        One owner-only control room for comics, site work, publishing, and future ChatGPT actions.
        Project rooms are isolated by design so one book cannot contaminate another book&apos;s canon or references.
      </p>

      <section className="stats">
        <div className="stat"><b>{STUDIO_PROJECTS.length}</b><span>PROJECT ROOMS</span></div>
        <div className="stat"><b>{connected}</b><span>FULLY CONNECTED</span></div>
        <div className="stat"><b>{imported}</b><span>METADATA IMPORTED</span></div>
        <div className="stat"><b>{needsImport}</b><span>NEED IMPORT</span></div>
      </section>

      <h2>PROJECT ROOMS</h2>
      <section className="project-grid">
        {STUDIO_PROJECTS.map((project) => {
          const stateClass = project.migrationState === "connected" ? "connected" : project.migrationState === "metadata-imported" ? "imported" : "";
          const statusClass = project.migrationState === "connected" ? "ok" : project.migrationState === "metadata-imported" ? "imported" : "";
          const statusText = project.migrationState === "connected" ? "CONNECTED" : project.migrationState === "metadata-imported" ? "METADATA IMPORTED" : "IMPORT NEEDED";
          return (
            <article className={`project ${stateClass}`} key={project.id}>
              <small>{project.kind.toUpperCase()}</small>
              <h3>{project.name}</h3>
              <p>{project.note}</p>
              <span className={`status ${statusClass}`}>{statusText}</span>
              {project.id === "mostly-empty-somewhat-divine" ? <Link className="room-link" href="/tools/studio/mostly-empty-somewhat-divine">OPEN ROOM →</Link> : null}
            </article>
          );
        })}
      </section>

      <h2>COMIC PAGE WORKFLOW</h2>
      <section className="workflow">
        <div className="step"><b>1 · BRIEF</b><span>Load only the current page card and project canon.</span></div>
        <div className="step"><b>2 · REFERENCES</b><span>Attach only locked characters and approved continuity.</span></div>
        <div className="step"><b>3 · GENERATE</b><span>Create a draft without promoting it to canon.</span></div>
        <div className="step"><b>4 · REVIEW</b><span>Reject, keep, or lock. Rejected art is never reused as reference.</span></div>
        <div className="step"><b>5 · EXPORT</b><span>Build web, shareable, and print packages from locked assets.</span></div>
      </section>

      <section className="rules">
        <strong>HARD RULES</strong>
        <ul>
          <li>Codex required: {String(STUDIO_RULES.codexRequired)}</li>
          <li>Cross-project retrieval allowed: {String(STUDIO_RULES.crossProjectRetrievalAllowed)}</li>
          <li>Rejected art may become a reference: {String(STUDIO_RULES.rejectedArtCanBecomeReference)}</li>
          <li>Production writes require approval: {String(STUDIO_RULES.productionWritesRequireApproval)}</li>
          <li>Charges require explicit approval: {String(STUDIO_RULES.chargesRequireExplicitApproval)}</li>
        </ul>
      </section>

      <section className="next">
        <strong>NEXT BUILD TARGET</strong>
        <p>
          Persist Mostly Empty&apos;s trusted binary assets privately, then expose keeper/reference/page-state write actions for normal ChatGPT conversations.
        </p>
      </section>
    </main>
  );
}
