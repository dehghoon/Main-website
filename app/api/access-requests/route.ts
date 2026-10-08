import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../lib/structural-labeling/server";

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "request_failed";
  const status = message.includes("authentication_required")
    ? 401
    : message.includes("owner_required")
      ? 403
      : message.includes("not_found")
        ? 404
        : message.includes("already_reviewed") || message.includes("unknown_permission")
          ? 400
          : 500;

  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuthenticatedUser(
      request.headers.get("authorization"),
    );

    const [{ data: requests, error: requestsError }, { data: catalog, error: catalogError }] =
      await Promise.all([
        supabase.rpc("platform_list_access_requests"),
        supabase
          .from("platform_permission_catalog")
          .select("permission,area,label,description")
          .eq("active", true)
          .order("area")
          .order("permission"),
      ]);

    if (requestsError) throw new Error(requestsError.message);
    if (catalogError) throw new Error(catalogError.message);

    return NextResponse.json({
      requests: requests ?? [],
      catalog: catalog ?? [],
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuthenticatedUser(
      request.headers.get("authorization"),
    );
    const body = await request.json();

    const requestId = String(body.requestId ?? "").trim();
    const note = String(body.note ?? "").trim();
    const permissions = Array.isArray(body.permissions)
      ? body.permissions.map((value: unknown) => String(value).trim()).filter(Boolean)
      : [];

    if (!requestId) {
      return NextResponse.json(
       { error: "request_id_required" },
      { status: 400 },
    );
    }

    const { data, error } = await supabase.rpc(
      "platform_review_access_request",
      {
        p_request_id: requestId,
        p_permissions: permissions,
        p_note: note || null,
      },
    );

    if (error) throw new Error(error.message);

    return NextResponse.json( {
      request: Array.isArray(data) ? data[0] ?? null : data ?? null,
    });
  } catch (error) {
    return failure(error);
  }
}
