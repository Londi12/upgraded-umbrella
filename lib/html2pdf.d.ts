declare module "html2pdf.js" {
  function html2pdf(): html2pdf.Html2Pdf

  namespace html2pdf {
    interface Html2Pdf {
      set(options: any): Html2Pdf
      from(element: HTMLElement): Html2Pdf
      save(): Promise<void>
      output(type: string, options?: any): Promise<any>
      then(callback: (pdf: any) => void): Html2Pdf
      catch(callback: (error: Error) => void): Html2Pdf
    }
  }

  export = html2pdf
}
