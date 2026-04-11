import type { CVData, CoverLetterData, TemplateType } from "@/types/cv-types"
import { generateTemplateMarker, generateTemplateMetadata } from "@/lib/template-markers"

export async function generateCVPDF(template: TemplateType, userData: CVData, templateName: string, isAuthenticated = false): Promise<Blob> {
  try {
    // Dynamically import html2pdf for client-side only
    const html2pdf = (await import("html2pdf.js")).default

    const element = document.getElementById("cv-preview-container")
    if (!element) {
      throw new Error("CV preview container not found. Cannot generate PDF.")
    }

    let watermarkElement: HTMLDivElement | null = null;
    
    // Watermark for unauthenticated users
    if (!isAuthenticated) {
      watermarkElement = document.createElement('div');
      watermarkElement.style.position = 'absolute';
      watermarkElement.style.top = '0';
      watermarkElement.style.left = '0';
      watermarkElement.style.width = '100%';
      watermarkElement.style.height = '100%';
      watermarkElement.style.display = 'flex';
      watermarkElement.style.justifyContent = 'center';
      watermarkElement.style.alignItems = 'center';
      watermarkElement.style.pointerEvents = 'none';
      watermarkElement.style.zIndex = '9999';
      watermarkElement.style.overflow = 'hidden';
      
      const watermarkText = document.createElement('div');
      watermarkText.innerText = 'Created with CVKonnekt – Sign in to remove watermark';
      watermarkText.style.color = 'rgba(200, 200, 200, 0.4)';
      watermarkText.style.fontSize = '32px';
      watermarkText.style.transform = 'rotate(-30deg)';
      watermarkText.style.whiteSpace = 'nowrap';
      
      watermarkElement.appendChild(watermarkText);
      element.appendChild(watermarkElement);
    }

    const fileName = `${userData?.personalInfo?.fullName?.replace(/[^a-zA-Z0-9]/g, "_") || "CV"}_${templateName?.replace(/[^a-zA-Z0-9]/g, "_") || "Professional"}.pdf`

    const opt = {
      margin:       0,
      filename:     fileName,
      image:        { type: 'jpeg', quality: 1.0 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    // Generate blob
    const pdfBlob = await html2pdf().set(opt).from(element).output('blob')

    // Cleanup watermark
    if (watermarkElement && watermarkElement.parentNode) {
      watermarkElement.parentNode.removeChild(watermarkElement);
    }

    return pdfBlob
  } catch (error) {
    console.error("Error in generateCVPDF:", error)
    throw error
  }
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
