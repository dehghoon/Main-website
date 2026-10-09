import { DOMMatrix, ImageData, Path2D, createCanvas } from "@napi-rs/canvas";

const PDF_RENDER_SCALE = 2;

function installPdfJsCanvasGlobals() {
  const target = globalThis as unknown as Record<string, unknown>;

  if (!target.DOMMatrix) target.DOMMatrix = DOMMatrix;
  if (!target.ImageData) target.ImageData = ImageData;
  if (!target.Path2D) target.Path2D = Path2D;
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

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: pdfBytes,
    disableWorker: true,
    useSystemFonts: true,
  });

  const document = await loadingTask.promise;

  try {
    if (pageIndex >= document.numPages) {
      throw new Error(`pdf_page_index_out_of_range:${pageIndex}`);
    }

    const page = await document.getPage(pageIndex + 1);
    const viewport = page.getViewport({scale: PDF_RENDER_SCALE });
    const widthPx = Math.max(1, Math.ceil(viewport.width));
    const heightPx = Math.max(1, Math.ceil(viewport.height));
    const canvas = createCanvas(widthPx, heightPx);
    const context = canvas.getContext("2d");

    await page.render({
      canvasContext: context as never,
      viewport,
      canvas: canvas as never,
    }).promise;

    return {
      png: new Uint8Array(canvas.toBuffer("image/png")),
      widthPx,
      heightPx,
      scale: PDF_RENDER_SCALE,
      pageIndex,
    };
  } finally {
    await document.destroy();
  }
}
