import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";

const OWNER_EMAIL = "dehghani.pmp@gmail.com";

function safeEnv(value: string | undefined) {
  const present = typeof value === "string" && value.length > 0;
  return {
    present,
    length: present ? value!.length : 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser(request.headers.get("authorization"));
    const email = user.email?.trim().toLowerCase();

    if (email !== OWNER_EMAIL) {
      return NextResponse.json({ error: "owner_access_required" }, { status: 403 });
    }

    const token = safeEnv(process.env.GPT7_GITHUB_TOKEN);
    const repo = safeEnv(process.env.GPT7_GITHUB_REPO);
    const owner = safeEnv(process.env.GPT7_GITHUB_OWNER);
    const branch = safeEnv(process.env.GPT7_GITHUB_BRANCH);

    return NextResponse.json({
      diagnostic: "gpt7-github-handoff-env",
      vercelEnv: process.env.VERCEL_ENV ?? null,
      vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      env: {
        GPT7_GITHUB_TOKEN: token,
        GPT7_GITHUB_REPO: repo,
        GPT7_GITHUB_OWNER: owner,
        GPT7_GITHUB_BRANCH: branch,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "diagnostic_failed";
    const status = message.includes("authentication_required") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
