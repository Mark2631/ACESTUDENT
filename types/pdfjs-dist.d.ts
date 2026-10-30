declare module "pdfjs-dist/build/pdf.mjs" {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export interface TextItem {
    str?: string;
    hasEOL?: boolean;
  }

  export interface PDFPageProxy {
    getTextContent(): Promise<{ items: TextItem[] }>;
  }

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): Promise<void>;
  }

  export function getDocument(options: {
    data: ArrayBuffer;
    useSystemFonts?: boolean;
  }): {
    promise: Promise<PDFDocumentProxy>;
    destroy(): Promise<void>;
  };
}
