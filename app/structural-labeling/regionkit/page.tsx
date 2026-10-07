import StructuralLabelingWorkflowGuide from "../StructuralLabelingWorkflowGuide";
import RegionKitWorkspace from "./RegionKitWorkspace";
import StructuralLabelingUploadPanel from "./StructuralLabelingUploadPanel";

export default function RegionKitPage() {
  return (
    <>
      <StructuralLabelingWorkflowGuide active="labeling" />
      <StructuralLabelingUploadPanel />
      <RegionKitWorkspace />
    </>
  );
}
