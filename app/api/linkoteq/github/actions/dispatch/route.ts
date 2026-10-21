import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const WORKFLOW = /^(?:[A-Za-z0-9_.-]+\.ya?ml|[1-9][0-9]*)$/;
const REF = /^[A-Za-z0-9_./-]+$/;

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST { "repo": "owner/repo", "workflow": "build.yml", "ref": "main" }
 * No arbitrary workflow inputs: add individually reviewed inputs per workflow if needed.
 */
export async function POST(request: NextRequest) {
  const key = process.env.LINKOTEQ_GATEWAY_API_KEY;
  if (!key) return fail("Gateway not configured", 503);
  if (request.headers.get("authorization") !== `Bearer ${key}`) return fail("Unauthorized", 401);

  const token = process.env.LINKOTEQ_GITHUB_TOKEN;
  if (!token) return fail("GitHub token not configured", 503);

  const repoAllowlist = (process.env.LINKOTEQ_GITHUB_ALLOWED_REPOS ?? "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const dispatchAllowlist = (process.env.LINKOTEQ_GITHUB_DISPATCH_ALLOWLIST ?? "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

  if (!repoAllowlist.length || !dispatchAllowlist.length) return fail("Dispatch allowlist not configured", 503);
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 2048) return fail("Request too large", 413);

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 2048) return fail("Request too large", 413);
    body = JSON.parse(raw);
  } catch {
    return fail("Invalid JSON", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Invalid request", 400);
  const fields = body as Record<string, unknown>;
  if (Object.keys(fields).some((k) => !["repo", "workflow", "ref"].includes(k))) return fail("Unsupported fields", 400);
  const { repo, workflow, ref } = fields;
  if (typeof repo !== "string" || typeof workflow !== "string" || typeof ref !== "string" ||
      !REPO.test(repo) || !WORKFLOW.test(workflow) || !REF.test(ref) ||
      ref.includes("..") || ref.startsWith("/") || ref.endsWith("/") || ref.length > 200) {
    return fail("Invalid repository, workflow or ref", 400);
  }

  if (!repoAllowlist.includes(repo.toLowerCase()) ||
      !dispatchAllowlist.includes(`${repo}:${workflow}:${ref}`.toLowerCase())) {
    return fail("Workflow dispatch not allowed", 403);
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
          "User-Agent": "linkoteq-github-gateway",
        },
        body: JSON.stringify({ ref }),
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
    );
    if (response.status === 204) {
      return NextResponse.json({ accepted: true, repository: repo, workflow, ref },
        { status: 202, headers: { "Cache-Control": "no-store" } });
    }
    return fail("GitHub workflow dispatch failed", response.status === 404 ? 404 : 502);
  } catch {
    return fail("GitHub temporarily unavailable", 502);
  }
}
