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

export type TemplateType = string;

export interface CVTemplate {
  id: number;
  name: string;
  category: string;
  template: TemplateType;
  popular: boolean;
}

declare module 'puppeteer-core' {
  export interface LaunchOptions {
    args: string[];
    defaultViewport: any;
    executablePath: string;
    headless: boolean;
  }
  export function launch(options: LaunchOptions): Promise<any>;
  export interface Page {
    setContent(html: string, options: any): Promise<void>;
    pdf(options: any): Promise<Buffer>;
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }
  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }
}

declare module '@sparticuz/chromium' {
  export const args: string[];
  export const defaultViewport: any;
  export const headless: boolean;
  export async function executablePath(): Promise<string>;
}
