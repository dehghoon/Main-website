import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";

export const dynamic = "force-dynamic";

/**
 * Timesheet is an independently deployed application. Do not query the
 * main website's public.profiles table and mislabel it as Timesheet data.
 * Until a dedicated, authenticated Timesheet integration is configured,
 * fail closed rather than returning incorrect employee roles.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser(request.headers.get("authorization"));
    if (user.email?.toLowerCase() !== "dehghani.pmp@gmail.com" || !user.email_confirmed_at) {
      return NextResponse.json({ error: "owner_required" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(
      { error: "timesheet_integration_not_configured", message: "Timesheet role inspection requires a verified connection to the Timesheet database." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "authentication_required" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
}
