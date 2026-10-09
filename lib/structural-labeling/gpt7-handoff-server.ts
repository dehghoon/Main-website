import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildGpt7IntakePackage,
  validateGpt7IntakePackage,
  type Gpt7IntakePackage,
} from "./gpt7";
import type { Annotation, TransformMetadata } from "./contract";

type BuildContext = {
  candidate: Record<string, unknown>;
  source: Record<string, unknown>;
  revision: {
    annotations: Annotation[];
    transform_metadata: TransformMetadata;
  };
  audit: unknown[];
};

export type Gpt7HandoffResult = {
  handoffId: string;
  handoffState: "pending-gpt7";
  contractVersion: "manual-labeling-intake-v0.1";
  datasetAdmission: "pending-gpt7";
  trainingReady: false;
  datasetSplitAssigned: false;
  package: Gpt7IntakePackage;
};

function requireBuildContext(value: unknown): BuildContext {
  if (!value || typeof value !== "object") {
    throw new Error("gpt7_build_context_required");
  }

  const context = value as Partial<BuildContext>;
  if (
    !context.candidate ||
    !context.source ||
    !context.revision ||
    !Array.isArray(context.revision.annotations) ||
    !context.revision.transform_metadata ||
    !Array.isArray(context.audit)
  ) {
    throw new Error("gpt7_build_context_incomplete");
  }

  return context as BuildContext;
}

export async function prepareGpt7Handoff(
  supabase: SupabaseClient,
  candidateId: string,
): Promise<Gpt7HandoffResult> {
  const contextResult = await supabase.rpc("labeling_get_gpt7_build_context", {
    p_id: candidateId,
  });
  if (contextResult.error) {
    throw new Error(contextResult.error.message);
  }

  const context = requireBuildContext(contextResult.data);
  const pkg = buildGpt7IntakePackage({
    candidate: context.candidate,
    source: context.source,
    annotations: context.revision.annotations,
    transform: context.revision.transform_metadata,
    audit: context.audit,
    toolVersion: "milestone-2-auto-handoff",
  });

  const validationErrors = validateGpt7IntakePackage(pkg);
  if (validationErrors.length) {
    throw new Error(
      `pinned_contract_validation_failed:${validationErrors.join(",")}`,
    );
  }

  const finalizeResult = await supabase.rpc("labeling_finalize_gpt7_handoff", {
    p_id: candidateId,
    p_package: pkg,
  });
  if (finalizeResult.error) {
    throw new Error(finalizeResult.error.message);
  }
  if (!finalizeResult.data) {
    throw new Error("gpt7_handoff_id_required");
  }

  return {
    handoffId: String(finalizeResult.data),
    handoffState: "pending-gpt7",
    contractVersion: pkg.schema_version,
    datasetAdmission: pkg.dataset_admission,
    trainingReady: pkg.training_ready,
    datasetSplitAssigned: pkg.dataset_split_assigned,
    package: pkg,
  };
}
