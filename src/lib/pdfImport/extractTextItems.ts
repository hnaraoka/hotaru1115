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
