declare module 'pdfjs-dist' {
  export function getDocument(options: { data: ArrayBuffer }): {
    promise: Promise<{
      numPages: number;
      getPage: (pageNumber: number) => Promise<{
        getTextContent: () => Promise<{
          items: Array<{ str: string }>;
        }>;
      }>;
    }>;
  };
}
declare module 'mammoth' {
  interface MammothOptions {
    buffer: Buffer;
  }

  interface MammothResult {
    value: string;
    messages: any[];
  }

  export function extractRawText(options: MammothOptions): Promise<MammothResult>;
}

declare module 'pdf-parse' {
  interface PDFOptions {
    // options
  }

  interface PDFData {
    text: string;
    // other properties
  }

  export default function(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData>;
}