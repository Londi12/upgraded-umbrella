import type { CVData, CoverLetterData, TemplateType } from "@/types/cv-types"
import { generateTemplateMarker, generateTemplateMetadata } from "@/lib/template-markers"

export async function generateCVPDF(template: TemplateType, userData: CVData, templateName: string): Promise<Blob> {
  try {
    const response = await fetch("/api/generate-cv-pdf", {
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
