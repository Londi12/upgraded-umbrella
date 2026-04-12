import type { CVData, CoverLetterData, TemplateType } from "@/types/cv-types"
import { generateTemplateMarker, generateTemplateMetadata } from "@/lib/template-markers"

export async function generateCVPDF(template: string, userData: CVData, templateName: string, isAuthenticated = false): Promise<Blob> {

  const preview = document.getElementById('cv-preview-container');
  if (!preview) {
    throw new Error("CV preview container not found. Cannot generate PDF.");
  }

  // Dynamically import for client-side
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).default;

  const canvas = await html2canvas(preview, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const fileName = `${userData?.personalInfo?.fullName?.replace(/[^a-zA-Z0-9]/g, "_") || "CV"}_${templateName?.replace(/[^a-zA-Z0-9]/g, "_") || "Professional"}.pdf`
  
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const imgHeightMM = (imgHeight * pdfWidth) / imgWidth;
  let heightLeft = imgHeightMM;

  let position = 0;

  const imgData = canvas.toDataURL('image/png', 1.0);
  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightMM);

  heightLeft -= pdfHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeightMM;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightMM);
    heightLeft -= pdfHeight;
  }

  const pdfBlob = new Blob([pdf.output('datauristring')], { type: 'application/pdf' });
  return pdfBlob;

}

export async function generateCoverLetterPDF(
  template: TemplateType,
  userData: CoverLetterData,
  templateName: string,
): Promise<Blob> {
  try {
    // Generate template marker and metadata for later detection
    const templateMarker = generateTemplateMarker(template, templateName || template);
    const templateMetadata = generateTemplateMetadata(template, templateName || template);
    const response = await fetch("/api/generate-cover-letter-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template,
        userData,
        templateName,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return response.blob()
  } catch (error) {
    console.error("Error in generateCoverLetterPDF:", error)
    throw error
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  try {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error downloading file:", error)
    throw new Error("Failed to download file")
  }
}

