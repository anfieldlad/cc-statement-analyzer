import { PdfError } from "@/types";

interface PdfJsModule {
  getDocument: (params: {
    data: ArrayBuffer;
    password?: string;
  }) => { promise: Promise<PdfDocument> };
  GlobalWorkerOptions: { workerSrc: string };
  version: string;
}

interface PdfDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
  destroy: () => Promise<void>;
}

interface PdfPage {
  getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
  cleanup: () => void;
}

let pdfjsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const mod = (await import("pdfjs-dist")) as unknown as PdfJsModule;
      mod.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.mjs`;
      return mod;
    })();
  }
  return pdfjsPromise;
}

export async function extractText(
  file: File,
  password?: string
): Promise<string> {
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new PdfError("FILE_TOO_LARGE", "File exceeds 10MB limit");
  }

  let arrayBuffer: ArrayBuffer | null = await file.arrayBuffer();
  const pdfjs = await loadPdfJs();

  let doc: PdfDocument | null = null;
  try {
    doc = await pdfjs.getDocument({
      data: arrayBuffer,
      password: password || undefined,
    }).promise;

    const parts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const lineMap = new Map<number, string[]>();
      for (const item of content.items) {
        if (typeof item.str === "string" && item.str.length > 0) {
          parts.push(item.str);
        }
        void lineMap;
      }
      parts.push("\n");
      page.cleanup();
    }

    return parts.join(" ");
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string };
    const msg = (e?.name || "") + " " + (e?.message || "");
    if (
      msg.includes("PasswordException") ||
      msg.toLowerCase().includes("password")
    ) {
      throw new PdfError("INVALID_PASSWORD", "Invalid PDF password");
    }
    if (
      msg.includes("InvalidPDFException") ||
      msg.toLowerCase().includes("invalid pdf")
    ) {
      throw new PdfError("CORRUPTED_PDF", "Corrupted or unsupported PDF");
    }
    throw new PdfError("EXTRACTION_FAILED", "PDF text extraction failed");
  } finally {
    if (doc) {
      try {
        await doc.destroy();
      } catch {
        // ignore
      }
      doc = null;
    }
    arrayBuffer = null;
  }
}
