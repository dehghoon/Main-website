import StructuralLabelingWorkflowGuide from "../StructuralLabelingWorkflowGuide";
import RegionKitWorkspace from "./RegionKitWorkspace";
import StructuralLabelingPermissionAdmin from "./StructuralLabelingPermissionAdmin";
import StructuralLabelingUploadPanel from "./StructuralLabelingUploadPanel";
import styles from "./RegionKitPage.module.css";

export default function RegionKitPage() {
  return (
    <>
      <StructuralLabelingWorkflowGuide active="labeling" />
      <StructuralLabelingPermissionAdmin />
      <StructuralLabelingUploadPanel />
      <div className={styles.workspace}>
        <RegionKitWorkspace />
      </div>
    </>
  );
}
