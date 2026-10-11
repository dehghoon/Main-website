import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO_PATTERN = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  const gatewayKey = process.env.LINKOTEQ_GATEWAY_API_KEY;
  if (!gatewayKey) return jsonError("Gateway not configured", 503);

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${gatewayKey}`) {
    return jsonError("Unauthorized", 401);
  }

  const allowedRepos = (process.env.LINKOTEQ_GITHUB_ALLOWED_REPOS ?? "")
    .split(",").map((repo) => repo.trim().toLowerCase()).filter(Boolean);
  if (!allowedRepos.length) return jsonError("Repository allowlist not configured", 503);

  const repo = request.nextUrl.searchParams.get("repo") ?? "";
  if (!REPO_PATTERN.test(repo) || !allowedRepos.includes(repo.toLowerCase())) {
    return jsonError("Repository not allowed", 403);
  }

  const perPageParam = request.nextUrl.searchParams.get("per_page") ?? "20";
  const pageParam = request.nextUrl.searchParams.get("page") ?? "1";
  if (!/^\d+$/.test(perPageParam) || !/^\d+$/.test(pageParam)) {
    return jsonError("Invalid pagination", 400);
  }
  const perPage = Number(perPageParam);
  const page = Number(pageParam);
  if (perPage < 1 || perPage > 100 || page < 1 || page > 1000) {
    return jsonError("Pagination out of range", 400);
  }

  const token = process.env.LINKOTEQ_GITHUB_TOKEN;
  if (!token) return jsonError("GitHub token not configured", 503);

  const params = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
  });
  const branch = request.nextUrl.searchParams.get("branch");
  if (branch) {
    if (branch.length > 255 || !/^[a-zA-Z0-9_./-]+$/.test(branch) || branch.includes("..")) {
      return jsonError("Invalid branch", 400);
    }
    params.set("branch", branch);
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/actions/runs?${params.toString()}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "linkoteq-github-gateway",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
    );

    if (!response.ok) {
      return jsonError("GitHub request failed", response.status === 404 ? 404 : 502);
    }
    const payload = await response.json();
    return NextResponse.json({
      repository: repo,
      total_count: payload.total_count,
      workflow_runs: (payload.workflow_runs ?? []).map((run: Record<string, unknown>) => ({
        id: run.id,
        name: run.name,
        display_title: run.display_title,
        status: run.status,
        conclusion: run.conclusion,
        event: run.event,
        head_branch: run.head_branch,
        head_sha: run.head_sha,
        run_number: run.run_number,
        created_at: run.created_at,
        updated_at: run.updated_at,
        html_url: run.html_url,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("GitHub temporarily unavailable", 502);
  }
}
