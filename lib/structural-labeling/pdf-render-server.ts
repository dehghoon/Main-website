// Server-side PDF rendering is intentionally disabled on Vercel.
// The GPT-7 recovery flow renders the approved page in the browser.
// This fallback remains only to preserve the server handoff interface.
export async function renderPdfPageToPng(
  _pdfBytes: Uint8Array,
  _pageIndex: number,
): Promise<never> {
  throw new Error("pre_rendered_pdf_page_required");
}
