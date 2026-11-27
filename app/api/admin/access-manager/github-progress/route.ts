import { NextRequest, NextResponse } from "next/server";
import { commandCenterError, requireCommandCenterOwner } from "@/lib/command-center/server";
import { additionalDevelopmentTools } from "@/lib/command-center/development-tools";
import snapshot from "@/lib/command-center/repository-snapshot.json";

export const dynamic = "force-dynamic";
const responseHeaders = { "Cache-Control": "private, no-store", Vary: "Authorization" };
const registry = [...snapshot.tools, ...additionalDevelopmentTools];

async function github(path: string) {
  const token = process.env.COMMAND_CENTER_GITHUB_READ_TOKEN?.trim();
  const response = await fetch(`https://api.github.com/repos/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error("github_unavailable");
  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    await requireCommandCenterOwner(request.headers.get("authorization"));
    const tool = registry.find(item => item.tool === request.nextUrl.searchParams.get("tool"));
    if (!tool) return NextResponse.json({ error: "Unknown tool" }, { status: 400, headers: responseHeaders });

    const query = new URLSearchParams({ per_page: "1" });
    if ("activityPath" in tool && tool.activityPath) query.set("path", tool.activityPath);
    const commits = await github(`${tool.repository}/commits?${query}`);
    const latest = Array.isArray(commits) ? commits[0] : null;
    if (!latest || typeof latest.sha !== "string" || !/^[a-f0-9]{40}$/.test(latest.sha)) {
      throw new Error("github_revision_unavailable");
    }

    const revision = `${tool.repository}/commits/${latest.sha}`;
    const [checks, pulls] = await Promise.allSettled([
      github(`${revision}/check-runs?per_page=30`),
      github(`${revision}/pulls?per_page=10`),
    ]);
    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      sha: latest.sha,
      message: String(latest.commit?.message ?? "").split("\n")[0].slice(0, 250),
      committedAt: latest.commit?.committer?.date ?? null,
      commitUrl: `https://github.com/${tool.repository}/commit/${latest.sha}`,
      checks: checks.status === "fulfilled" && Array.isArray(checks.value.check_runs)
        ? checks.value.check_runs.map((item: { name: string; status: string; conclusion: string | null }) =>
          ({ name: item.name, status: item.status, conclusion: item.conclusion }))
        : null,
      pullRequests: pulls.status === "fulfilled" && Array.isArray(pulls.value)
        ? pulls.value.filter((item: { number: number }) => Number.isSafeInteger(item.number)).map(
          (item: { number: number; title: string; state: string; merged_at: string | null }) => ({
            number: item.number, title: item.title, state: item.merged_at ? "merged" : item.state,
            url: `https://github.com/${tool.repository}/pull/${item.number}`,
          }))
        : null,
    }, { headers: responseHeaders });
  } catch (error) {
    const result = commandCenterError(error);
    return NextResponse.json({ error: result.error }, { status: result.status, headers: responseHeaders });
  }
}
