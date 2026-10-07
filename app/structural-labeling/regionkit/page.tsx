import StructuralLabelingWorkflowGuide from "../StructuralLabelingWorkflowGuide";
import RegionKitWorkspace from "./RegionKitWorkspace";

export default function RegionKitPage() {
  return (
    <>
      <StructuralLabelingWorkflowGuide active="labeling" />
      <RegionKitWorkspace />
    </>
  );
}
