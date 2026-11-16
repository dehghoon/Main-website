import 'server-only';
import { localWorkbookPreview } from './previews';

type Asset = { path: string; ref: string };
type AssetSet = { workbook?: Asset; preview?: Asset };
const workbookExtension = /\.(xlsx|xlsm|xls|xlsb)$/i;
const previewExtension = /\.png$/i;

function validAsset(value: unknown, kind: keyof AssetSet): Asset | undefined {
  if (!value || typeof value !== 'object' || !('path' in value) || !('ref' in value)) return;
  const { path, ref } = value;
  const extension = kind === 'preview' ? previewExtension : workbookExtension;
  const root = kind === 'preview' ? 'approved-previews/' : 'Excell Spreadsheets/';
  if (typeof path !== 'string' || !path.startsWith(root) || !extension.test(path) ||
      path.split('/').some((part) => !part || part === '.' || part === '..') || /[\\\x00-\x1f]/.test(path) ||
      typeof ref !== 'string' || !/^[a-f0-9]{40}$/.test(ref)) return;
  return { path, ref };
}

export function workbookAsset(id: string, kind: keyof AssetSet) {
  try {
    const catalog: Record<string, AssetSet> = JSON.parse(process.env.WORKBOOK_ASSETS ?? '{}');
    return Object.hasOwn(catalog, id) ? validAsset(catalog[id]?.[kind], kind) : undefined;
  } catch {
    return undefined;
  }
}

export function privateWorkbookPreview(id: string) {
  const local = localWorkbookPreview(id);
  if (local && local.kind !== 'worksheet' && process.env.WORKBOOK_GITHUB_TOKEN && workbookAsset(id, 'preview')) {
    return `/api/learning/workbooks/${id}?asset=preview`;
  }
}

export async function readWorkbookAsset(asset: Asset) {
  const token = process.env.WORKBOOK_GITHUB_TOKEN;
  if (!token) return null;
  const encoded = asset.path.split('/').map(encodeURIComponent).join('/');
  const url = new URL(`https://api.github.com/repos/dehghoon/Linkoteq_Excels/contents/${encoded}`);
  url.searchParams.set('ref', asset.ref);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw+json' },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    return response.ok && response.body ? response : null;
  } catch {
    return null;
  }
}
