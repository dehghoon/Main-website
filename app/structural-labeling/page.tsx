import Link from "next/link";
import { GPT7_BOUNDARY, LABEL_CLASSES, MANUAL_LABELING_CONTRACT, WORKFLOW_STATES } from "../../lib/structural-labeling";

const cards = [
  ["Candidate Queue", "Imported and uploaded drawing pages enter here as candidates and require renewed suitability review."],
  ["Upload New Drawing", "PDF/image intake preserves the source artifact, provenance and stable content identity. Upload does not create training data."],
  ["Suitability Triage", "Authorized operators classify each candidate as suitable-for-labeling or unsuitable-for-labeling; unsuitable records are preserved with a reason."],
  ["Manual Labeling", `Only ${LABEL_CLASSES.join(", ")} are permitted. Drafts remain resumable and source-page PDF-point coordinates are authoritative.`],
  ["Owner QA", "Owner/reviewer authority is separate from Employee permissions. Corrections remain traceable; rejection and revision require reasons."],
  ["GPT-7 Handoff", "Only Owner Approved packages with validated reversible coordinate transforms may be exported. Export remains pending GPT-7 dataset admission."],
] as const;

export default function StructuralLabelingPage() {
  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 24px 80px" }}>
      <p style={{ textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700 }}>Employee Workspace</p>
      <h1>Structural Labeling</h1>
      <p style={{ maxWidth: 860, lineHeight: 1.7 }}>
        Candidate Intake → Suitability Triage → Manual Labeling → Submitted for Owner QA → Owner Approved / Owner Rejected / Revision Required.
        Owner approval is not dataset admission and is not training readiness.
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginTop: 32 }}>
        {cards.map(([title, body]) => (
          <article key={title} style={{ border: "1px solid #d8dde6", borderRadius: 14, padding: 20 }}>
            <h2 style={{ fontSize: 20 }}>{title}</h2>
            <p style={{ lineHeight: 1.6 }}>{body}</p>
          </article>
        ))}
      </section>

      <section style={{ marginTop: 36, borderTop: "1px solid #d8dde6", paddingTop: 24 }}>
        <h2>Workflow states</h2>
        <p>{WORKFLOW_STATES.join(" → ")}</p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>External contract boundary</h2>
        <ul>
          <li>Repository: <code>{MANUAL_LABELING_CONTRACT.repository}</code></li>
          <li>Activation commit: <code>{MANUAL_LABELING_CONTRACT.activationCommit}</code></li>
          <li>Schema: <code>{MANUAL_LABELING_CONTRACT.schemaVersion}</code></li>
          <li>Training enabled: <strong>{String(GPT7_BOUNDARY.enablesTraining)}</strong></li>
        </ul>
      </section>

      <p style={{ marginTop: 32 }}><Link href="/">Back to LinkoTech</Link></p>
    </main>
  );
}
