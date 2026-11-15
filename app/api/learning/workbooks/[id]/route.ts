import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/structural-labeling/server';
import { clientMayDownload, readWorkbookAsset, workbookAsset } from '@/lib/workbooks/assets';
import { getWorkbook } from '@/lib/workbooks/catalog';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const mime: Record<string, string> = {
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
  xlsb: 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kind = request.nextUrl.searchParams.get('asset') === 'preview' ? 'preview' : 'workbook';
  const error = (code: string, status: number) => NextResponse.json({ error: code }, { status, headers });
  if (!getWorkbook(id)) return error('not_found', 404);

  if (kind === 'workbook') {
    const identity = await requireAuthenticatedUser(request.headers.get('authorization')).catch(() => null);
    if (!identity) return error('sign_in_required', 401);
    if (!clientMayDownload(identity.user)) return error('client_access_required', 403);
  }

  const asset = workbookAsset(id, kind);
  if (!asset) return error('not_available', 404);
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
