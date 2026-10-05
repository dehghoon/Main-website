"use client";

import { getSupabase } from "../../lib/supabase-browser";
import type { Annotation, TransformMetadata } from "../../lib/structural-labeling/contract";

type CandidateResponseRow = {
  id: string;
  workflow_state: string;
  page_index: number | null;
  page_id: string | null;
  original_filename: string | null;
  source_ref: string;
  source_sha256: string;
  transform_metadata: unknown;
  duplicate_of: string | null;
};

type CandidateDetailResponse = {
  candidate: CandidateResponseRow;
  revisions: Array<{
    annotations: Annotation[];
    transform_metadata: TransformMetadata;
    revision_no: number;
    revision_kind: string;
  }>;
  audit: unknown[];
};

type CandidateQueueResponse = {
  permissions: string[];
  candidates: CandidateResponseRow[];
};

export async function labelingAccessToken() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Sign in is required");
  return data.session.access_token;
}

export function labelingApi(
  path: "/api/structural-labeling/candidates",
  init?: RequestInit,
): Promise<CandidateQueueResponse>;
export function labelingApi(
  path: `/api/structural-labeling/candidates/${string}`,
  init?: RequestInit,
): Promise<CandidateDetailResponse>;
export function labelingApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T>;
export async function labelingApi<T = Record<string, unknown>>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const accessToken = await labelingAccessToken();
  const response = await fetch(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
  });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}
