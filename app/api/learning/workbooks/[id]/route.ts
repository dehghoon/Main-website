import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/structural-labeling/server';
import { readWorkbookAsset, workbookAsset } from '@/lib/workbooks/assets';
import { hasActiveWorkbookTrial } from '@/lib/workbooks/download-access';
import { getWorkbook } from '@/lib/workbooks/catalog';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' };
const mime: Record<string, string> = {
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
  xlsb: 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
};

type Context = { params: Promise<{ id: string }> };

async function serveAsset(request: NextRequest, { params }: Context, accessOnly = false) {
  const { id } = await params;
  const kind = !accessOnly && request.nextUrl.searchParams.get('asset') === 'preview' ? 'preview' : 'workbook';
  const error = (code: string, status: number) => accessOnly
    ? new Response(null, { status, headers })
    : NextResponse.json({ error: code }, { status, headers });
  if (!getWorkbook(id)) return error('not_found', 404);

  if (kind === 'workbook') {
    const identity = await requireAuthenticatedUser(request.headers.get('authorization')).catch(() => null);
    if (!identity) return error('sign_in_required', 401);
    const { user, supabase } = identity;
    if (!user.email_confirmed_at || user.is_anonymous) return error('download_access_required', 403);
    if (!hasActiveWorkbookTrial(user.app_metadata?.workbook_trial_approved_at)) {
      const { data: staff, error: accessError } = await supabase.rpc('learning_can_edit');
      if (accessError) return error('access_unavailable', 503);
      if (staff !== true) return error('download_access_required', 403);
    }
  }

  const asset = workbookAsset(id, kind);
  if (!asset || !process.env.WORKBOOK_GITHUB_TOKEN) return error('not_available', 404);
  if (accessOnly) return new Response(null, { status: 204, headers });
  const response = await readWorkbookAsset(asset);
  if (!response) return error('asset_unavailable', 503);

  const ext = asset.path.split('.').at(-1)?.toLowerCase() ?? '';
  return new Response(response.body, {
    headers: {
      ...headers,
      'Content-Type': kind === 'preview' ? 'image/png' : mime[ext],
      'Content-Disposition': `${kind === 'preview' ? 'inline' : 'attachment'}; filename="${id}.${ext}"`,
    },
  });
}

export async function GET(request: NextRequest, context: Context) {
  return serveAsset(request, context);
}

export async function HEAD(request: NextRequest, context: Context) {
  return serveAsset(request, context, true);
}
