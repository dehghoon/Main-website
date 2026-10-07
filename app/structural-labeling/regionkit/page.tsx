import StructuralLabelingWorkflowGuide from "../StructuralLabelingWorkflowGuide";
import RegionKitWorkspace from "./RegionKitWorkspace";
import StructuralLabelingPermissionAdmin from "./StructuralLabelingPermissionAdmin";
import StructuralLabelingUploadPanel from "./StructuralLabelingUploadPanel";

export default function RegionKitPage() {
  return (
    <>
      <StructuralLabelingWorkflowGuide active="labeling" />
      <StructuralLabelingPermissionAdmin />
      <StructuralLabelingUploadPanel />
      <RegionKitWorkspace />
    </>
  );
}
