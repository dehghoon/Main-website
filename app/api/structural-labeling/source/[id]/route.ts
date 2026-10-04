import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { supabase } = await requireAuthenticatedUser(request.headers.get("authorization"));
    const { data: candidate, error: candidateError } = await supabase
      .from("structural_labeling_candidates")
      .select("source_id")
      .eq("id", id)
      .single();
    if (candidateError || !candidate?.source_id) throw new Error(candidateError?.messae ?? "source_not_found");

    const { data: source, error: sourceError } = await supabase
      .from("structural_labeling_sources")
      .select("storage_path,mime_type,original_filename")
      .eq("source_id", candidate.source_id)
      .single();
    if (sourceError || !source) throw new Error(sourceError?.message ?? "source_not_found");

    const { data: blob, error: downloadError } = await supabase.storage
      .from("structural-labeling-sources")
      .download(source.storage_path);
    if (downloadError || !blob) throw new Error(downloadError?.message ?? "source_download_failed");

    return new NextResponse(blob.stream(), {
      headers: {
        "Content-Type": source.mime_type,
        "Content-Disposition": `inline; filename="${String(source.original_filename).replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request_failed";
    return NextResponse.json({ error: message }, { status: message.includes("authentication_required") ? 401 : 403 });
  }
}
