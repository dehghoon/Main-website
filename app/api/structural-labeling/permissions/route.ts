import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/structural-labeling/server";

const MANAGEABLE_PERMISSIONS = new Set([
  "labeling.workspace",
  "labeling.upload",
  "labeling.annotate",
  "labeling.submit",
]);

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "request_failed";
  const status = message.includes("authentication_required")
    ? 401
    : message.includes("permission_admin_required") || message.includes("target_must_be_employee")
      ? 403
      : message.includes("required") || message.includes("not_manageable")
        ? 400
        : message.includes("not_found")
          ? 404
          : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuthenticatedUser(request.headers.get("authorization"));
    const { data, error } = await supabase.rpc("labeling_list_employee_permissions");
    if (error) throw new Error(error.message);
    return NextResponse.json({ employees: data ?? [] });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuthenticatedUser(request.headers.get("authorization"));
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const permission = String(body.permission ?? "").trim();
    const enabled = body.enabled === true;

    if (!email) {
      return NextResponse.json({ error: "email_required" }, { status: 400 });
    }
    if (!MANAGEABLE_PERMISSIONS.has(permission)) {
      return NextResponse.json({ error: "employee_permission_not_manageable" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("labeling_manage_employee_permission", {
      p_email: email,
      p_permission: permission,
      p_enabled: enabled,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ employee: Array.isArray(data) ? data[0] ?? null : data ?? null });
  } catch (error) {
    return failure(error);
  }
}
