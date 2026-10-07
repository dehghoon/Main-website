import Link from "next/link";
import StructuralLabelingWorkflowGuide from "./StructuralLabelingWorkflowGuide";
import StructuralLabelingWorkspace from "./StructuralLabelingWorkspace";

export default function StructuralLabelingPage() {
  return (
    <>
      <div style={{ maxWidth: 1440, margin: "24px auto 0", padding: "0 20px" }}>
        <Link href="/structural-labeling/regionkit">Open RegionKit manual labeling workflow</Link>
      </div>
      <StructuralLabelingWorkflowGuide active="qa" />
      <StructuralLabelingWorkspace />
    </>
  );
}
