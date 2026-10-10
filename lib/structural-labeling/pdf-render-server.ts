import { DOMMatrix, ImageData, Path2D, createCanvas } from "@napi-rs/canvas";

const PDF_RENDER_SCALE = 2;

function installPdfJsCanvasGlobals() {
  const target = globalThis as unknown as Record<string, unknown>;

  if (!target.DOMMatrix) target.DOMMatrix = DOMMatrix;
  if (!target.ImageData) target.ImageData = ImageData;
  if (!target.Path2D) target.Path2D = Path2D;
}

async function installPdfJsFakeWorker() {
  const target = globalThis as unknown as Record<string, unknown>;
  if (target.pdfjsWorker) return;

  // PDF.js disables real Web Workers in Node and falls back to a main-thread worker.
  // Preloading the worker module keeps Next.js/Vercel from having to resolve a dynamic
  // pdf.worker.mjs path from a bundled .~ext/server/chunks module at runtime.
  const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  target.pdfjsWorker = worker;
}

export type RenderedPdfPage = {
  png: Uint8Array;
  widthPx: number;
  heightPx: number;
  scale: number;
  pageIndex: number;
};

export async function renderPdfPageToPng(
  pdfBytes: Uint8Array,
  pageIndex: number,
): Promise<RenderedPdfPage> {
  if (!Number.isInteger(pageIndex) || pageIndex < 0) {
    throw new Error("invalid_pdf_page_index");
  }

  installPdfJsCanvasGlobals();
  await installPdfJsFakeWorker();

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: pdfBytes,
    useSystemFonts: true,
  });

  const document = await loadingTask.promise;

  try {
    if (pageIndex >= document.numPages) {
      throw new Error(`pdf_page_index_out_of_range:${pageIndex}`);
    }

    const page = await document.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE );
