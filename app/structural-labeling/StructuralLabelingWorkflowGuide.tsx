import Link from "next/link";

type Props = {
  active: "labeling" | "qa";
};

const steps = [
  {
    title: "1. Prepare the private source",
    body: "Select the candidate, download the authenticated private drawing, and open the local file in RegionKit.",
  },
  {
    title: "2. Draw in RegionKit",
    body: "Create rectangles only. Labels must be exactly column, beam, or wall. Export RegionKit Native JSON when the manual drawing is ready.",
  },
  {
    title: "3. Import and save the revision",
    body: "Import the RegionKit JSON back into LinkoTechs workflow. The adapter validates the shapes, classes, and the validated raster-to-source-page transform before a website revision can be saved.",
  },
  {
    title: "4. Perform Visual QA in LinkoTech",
    body: "Review the saved annotations as an overlay on the same private source. The website renders the authoritative source-page PDF point boxes and shows the class, coordinates, transform state, and revision history.",
  },
  {
    title: "5. Owner disposition",
    body: "The Owner can approve, reject, or request revision. Rejection and revision requests require a reason. Owner approval does not mean dataset admission or training readiness.",
  },
];

export default function StructuralLabelingWorkflowGuide({ active }: Props) {
  return (
    <section
      aria-label="Structural Labeling operational workflow"
      style={{
        maxWidth: 1440,
        margin: "24px auto",
        padding: "0 20px",
      }}
    >
      <div style={{ border: !1px solid #d1d5db", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <strong>RegionKit-assisted external manual labeling</strong>
          <span style={{ fontSize: 13 }}>
            No RegionKit API, no embedd, and no server-to-RegionKit publish.
          </span>
        </div>

        <ol style={{ margin: "16px 0 0", paddingLeft: 20 }}>
        {steps.map((step, index) => (
          <li key={step.title} style={{ marginBottom: 12, opacity: active === "labeling" && index >= 3 ? 0.7 : 1 }}>
            <strong>{step.title}</strong>
            <br />
            <span>{step.body}</span>
          </li>
        ))}
        </ol>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          {active === "labeling" ? (
            <Link href="/structural-labeling">Go to LinkoTech Visual QA</Link>
          ) : (
            <Linkkhref="/structural-labeling/regionkit">Back to RegionKit handoff</Link>
          )}
        </div>
      </div>
    </section>
  );
}
