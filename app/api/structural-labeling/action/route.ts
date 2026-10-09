import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/structural-labeling/server";
import { assertAnnotationsValid } from "../../../../lib/structural-labeling/validation";
import type { Annotation, TransformMetadata } from "../../../../lib/structural-labeling/contract";
import { prepareGpt7Handoff } from "../../../../lib/structural-labeling/gpt7-handoff-server";

const OWNER_EMAIL = "dehghani.pmp@gmail.com";

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "request_failed";
  const status = message.includes("authentication_required") ? 401 : 403;
  return NextResponse.json({ error: message }, { status });
}

function githubHandoffResponse(handoff: Awaited<ReturnType<typeof prepareGpt7Handoff>>) {
  return {
    state: "exported-to-gpt7-github",
    repository: handoff.repository,
    commitSha: handoff.commitSha,
    exportPath: handoff.exportPath,
    sourcePath: handoff.sourcePath,
    annotationsPath: handoff.annotationsPath,
    manifestPath: handoff.manifestPath,
    datasetAdmission: "pending-gpt7",
    trainingReady: false,
    datasetSplitAssigned: false,
  };
}

function safeEnv(value: string | undefined) {
  const present = typeof value === "string" && value.length > 0;
  return { present, length: present ? value!.length : 0 };
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const { supabase, user } = await requireAuthenticatedUser(authorization);
    const body = await request.json();
    const candidateId = String(body.candidateId ?? "");
    const action = String(body.action ?? "");

    if (!candidateId || !action) {
      return NextResponse.json({ error: "candidateId_and_action_required" }, { status: 400 });
    }

    if (action === "diagnose-gpt7-env") {
      const email = user.email?.trim().toLowerCase();
      if (email !== OWNER_EMAIL) {
        return NextResponse.json({ error: "owner_access_required" }, { status: 403 });
      }

      return NextResponse.json({
        diagnostic: "gpt7-github-handoff-env",
      vercelEnv: process.env.VERCEL_ENV ?? null,
        vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        env: {
          GPT7_GITHUB_TOKEN: safeEnv(process.env.GPT7_GITHUB_TOKEN),
          GPT7_GITHUB_REPO: safeEnv(process.env.GPT7_GITHUB_REPO),
          GPT7_GITHUB_OWNER: safeEnv(process.env.GPT7_GITHUB_OWNER),
          GPT7_GITHUB_BRANCH: safeEnv(process.env.GPT7_GITHUB_BRANCH),
        },
      });
    }

    if (action === "save-revision") {
      const annotations = body.annotations as Annotation[];
      const transform = body.transform as TransformMetadata;
      assertAnnotationsValid(annotations, transform);
      const { data, error } = await supabase.rpc("labeling_save_revision", {
        p_id: candidateId,
        p_annotations: annotations,
        p_transform: transform,
        p_notes: body.notes ?? null,
      });
      if (error) throw new Error(error.message);
      return NextResponse.json({ revisionId: data });
    }

    if (["mark-suitable", "mark-unsuitable", "start-labeling", "submit-owner-qa"].includes(action)) {
      const { data, error } = await supabase.rpc("labeling_employee_transition", {
        p_id: candidateId,
        p_action: action,
        p_reason: body.reason ?? null,
      });
      if (error) throw new Error(error.message);
      return NextResponse.json({ state: data });
    }

    if (["approve", "reject", "request-revision"].includes(action)) {
      const { data, error } = await supabase.rpc("labeling_owner_transition", {
        p_id: candidateId,
        p_action: action,
        p_reason: body.reason ?? null,
      });
      if (error) throw new Error(error.message);

      if (action !== "approve") {
        return NextResponse.json({ state: data });
      }

      try {
        const handoff = await prepareGpt7Handoff(supabase, candidateId);
        return NextResponse.json({
          state: data,
          handoff: githubHandoffResponse(handoff),
        });
      } catch (handoffError) {
        const message = handoffError instanceof Error ? handoffError.message : "gpt7_github_export_failed";
        return NextResponse.json(
          {
            error: `Owner approval succeeded, but GPT-7 GitHub handoff failed: ${message}`,
            state: data,
            handoff: { state: "github-export-required", datasetAdmission: "pending-gpt7", trainingReady: false, datasetSplitAssigned: false, error: message },
          },
          { status: 502 },
        );
      }
    }

    if (action === "retry-gpt7-handoff") {
      const handoff = await prepareGpt7Handoff(supabase, candidateId);
      return NextResponse.json({ state: "owner-approved", handoff: githubHandoffResponse(handoff) });
    }

    return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
  } catch (error) {
    return failure(error);
  }
}
