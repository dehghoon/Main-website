import { getWorkbook } from './catalog.ts';
import previewKinds from './preview-kinds.json' with { type: 'json' };

const outlines = new Set(previewKinds.outline);
const topics = new Set(previewKinds.topic);

export function localWorkbookPreview(id: string) {
  if (!getWorkbook(id)) return;
  const kind = topics.has(id) ? 'topic' : outlines.has(id) ? 'outline' : 'worksheet';
  return { src: `/learning/workbook-previews/${id}.png`, kind } as const;
}
