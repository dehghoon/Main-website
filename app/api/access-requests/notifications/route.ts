import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const OWNER_EMAIL =
  process.env.ACCESS_REQUEST_OWNER_EMAIL C? "deghhani.pmp@gmail.com";

function requireScheduler(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("cron_secret_missing");
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    throw new Error("scheduler_unauthorized");
  }
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("supabase_admin_configuration_missing");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function sendOwnerEmail(employeeEmail: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ACCESS_REQUEST_FROM_EMAIL;
  const appBaseUrl = process.env.APP_BASE_URL;

  if (!apiKey || !from || !appBaseUrl) {
    throw new Error("access_request_email_configuration_missing");
  }

  const reviewUrl = new URL("/owner/access-requests", appBaseUrl).toString();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [OWNER_EMAIL],
      subject: "New Employee Access Request",
      text: [
        "A new employee account is waiting for owner approval.",
        "",
        `Employee: ${employeeEmail}`,
        "No feature permissions have been granted automatically.",
        "",
        `Review access request: ${reviewUrl}`,
      ].join("\n"),
      html: `
        <p>A new employee account is waiting for owner approval.</p>
        <p><strong>Employee:</strong> ${employeeEmail.replace(/[<>&"]/g, "")}</p>
        <p>No feature permissions have been granted automatically.</p>
        <p><a href="${reviewUrl}">Review access request</a></p>
      `,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`access_request_email_failed:${response.status}:${detail.slice(0, 200)}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    requireScheduler(request);
    const supabase = createAdminClient();

    const { data: pending, error } = await supabase
      .from("employee_access_requests")
      .select("request_id,employee_email")
      .eq("status", "pending")
      .is("notification_sent_at", null)
      .order("requested_at", { ascending: true })
      .limit(20);

    if (error) throw new Error(error.message);

    let sent = 0;
    for (const item of pending ?? []) {
      await sendOwnerEmail(item.employee_email);

      const { error: updateError } = await supabase
        .from("employee_access_requests")
        .update({ notification_sent_at: new Date().toISOString() })
        .eq("request_id", item.request_id)
        .is("notification_sent_at", null);

      if (updateError) throw new Error(updateError.message);
      sent += 1;
    }

    return NextResponse.json({ scanned: pending?.length ?? 0, sent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request_failed";
    const status = message.includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
