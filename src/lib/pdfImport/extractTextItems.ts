export type PdfTextItem = {
  text: string;
  x: number;
  /** PDF coordinate space: y grows upward from the bottom of the page. */
  y: number;
  width: number;
  height: number;
};

/**
 * Extracts positioned text items from page 1 of a PDF buffer using pdfjs-dist.
 * Runs server-side only (Node.js runtime).
 */
export async function extractTextItems(buffer: Buffer): Promise<PdfTextItem[]> {
  // pdfjs-dist references `DOMMatrix` at module scope. It normally polyfills
  // this via the optional `@napi-rs/canvas` native binding, but that binding
  // isn't guaranteed to load on every serverless platform/arch (e.g. it fails
  // silently on Vercel), which crashes the import outright. Provide a pure-JS
  // fallback so text extraction never depends on a native binary succeeding.
  if (!("DOMMatrix" in globalThis)) {
    const { default: DOMMatrixPolyfill } = await import("@thednp/dommatrix");
    (globalThis as unknown as { DOMMatrix: unknown }).DOMMatrix = DOMMatrixPolyfill;
  }

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data, useSystemFonts: true });
  const doc = await loadingTask.promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();

  const items: PdfTextItem[] = [];
  for (const raw of content.items) {
    if (!("str" in raw) || raw.str.trim() === "") continue;
    const tx = raw.transform;
    items.push({
      text: raw.str,
      x: tx[4],
      y: tx[5],
      width: raw.width,
      height: raw.height,
    });
  }

  await loadingTask.destroy();
  return items;
}
