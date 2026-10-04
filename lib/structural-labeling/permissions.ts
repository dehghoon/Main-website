export const STRUCTURAL_LABELING_PERMISSIONS = [
  "labeling.workspace",
  "labeling.upload",
  "labeling.annotate",
  "labeling.submit",
  "labeling.owner_review",
  "labeling.gpt7_export",
] as const;

export type StructuralLabelingPermission = (typeof STRUCTURAL_LABELING_PERMISSIONS)[number];
export type StructuralLabelingPermissionSet = Partial<Record<StructuralLabelingPermission, boolean>>;

export function hasLabelingPermission(
  permissions: StructuralLabelingPermissionSet | null | undefined,
  required: StructuralLabelingPermission,
): boolean {
  return permissions?.[required] === true;
}

export function assertEmployeeAction(
  role: "employee" | "client",
  permissions: StructuralLabelingPermissionSet,
  required: Exclude<StructuralLabelingPermission, "labeling.owner_review" | "labeling.gpt7_export">,
): void {
  if (role !== "employee" || !hasLabelingPermission(permissions, required)) throw new Error("Structural Labeling permission denied");
}

export function assertOwnerAction(
  permissions: StructuralLabelingPermissionSet,
  required: "labeling.owner_review" | "labeling.gpt7_export",
): void {
  if (!hasLabelingPermission(permissions, required)) throw new Error("Owner/reviewer permission denied");
}
