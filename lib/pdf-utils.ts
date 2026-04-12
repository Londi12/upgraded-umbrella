import type { CVData, CoverLetterData, TemplateType } from "@/types/cv-types"

export async function generateCVPDF(template: TemplateType, userData: CVData, templateName: string, isAuthenticated = false): Promise<Blob> {
  let captureRoot: HTMLDivElement | null = null

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ])

    const element = document.getElementById("cv-preview-container")
    if (!element) {
      throw new Error("CV preview container not found. Cannot generate PDF.")
    }

    if (document.fonts?.ready) {
      await document.fonts.ready
    }

    const rect = element.getBoundingClientRect()
    const sourceWidth = Math.max(Math.ceil(rect.width), element.scrollWidth)
    const sourceHeight = Math.max(Math.ceil(rect.height), element.scrollHeight)

    captureRoot = document.createElement("div")
    captureRoot.style.position = "fixed"
    captureRoot.style.left = "-100000px"
    captureRoot.style.top = "0"
    captureRoot.style.width = `${sourceWidth}px`
    captureRoot.style.background = "#ffffff"
    captureRoot.style.zIndex = "-1"

    const clone = element.cloneNode(true) as HTMLElement
    clone.style.width = `${sourceWidth}px`
    clone.style.minHeight = `${sourceHeight}px`
    clone.style.height = "auto"
    clone.style.background = "#ffffff"
    captureRoot.appendChild(clone)

    if (!isAuthenticated) {
      const watermark = document.createElement("div")
      watermark.style.position = "absolute"
      watermark.style.inset = "0"
      watermark.style.display = "flex"
      watermark.style.justifyContent = "center"
      watermark.style.alignItems = "center"
      watermark.style.pointerEvents = "none"
      watermark.style.zIndex = "9999"

      const watermarkText = document.createElement("div")
      watermarkText.innerText = "Created with CVKonnekt - Sign in to remove watermark"
      watermarkText.style.color = "rgba(180, 180, 180, 0.38)"
      watermarkText.style.fontSize = "32px"
      watermarkText.style.transform = "rotate(-30deg)"
      watermarkText.style.whiteSpace = "nowrap"

      watermark.appendChild(watermarkText)
      captureRoot.appendChild(watermark)
    }

    document.body.appendChild(captureRoot)

    const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 2))
    const canvas = await html2canvas(captureRoot, {
      scale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: sourceWidth,
      height: captureRoot.scrollHeight,
      windowWidth: sourceWidth,
      windowHeight: captureRoot.scrollHeight,
    })

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    })

    const pageWidthMm = 210
    const pageHeightMm = 297
    const imageWidthMm = pageWidthMm
    const pxPerMm = canvas.width / imageWidthMm
    const pageHeightPx = Math.floor(pageHeightMm * pxPerMm)

    let renderedHeightPx = 0
    let pageIndex = 0

    while (renderedHeightPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedHeightPx)

      const sliceCanvas = document.createElement("canvas")
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeightPx

      const ctx = sliceCanvas.getContext("2d")
      if (!ctx) {
        throw new Error("Could not create canvas context for PDF slicing.")
      }

      ctx.drawImage(
        canvas,
        0,
        renderedHeightPx,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx,
      )

      const sliceHeightMm = sliceHeightPx / pxPerMm
      const imgData = sliceCanvas.toDataURL("image/png")

      if (pageIndex > 0) {
        pdf.addPage()
      }

      pdf.addImage(imgData, "PNG", 0, 0, imageWidthMm, sliceHeightMm, undefined, "FAST")

      renderedHeightPx += sliceHeightPx
      pageIndex += 1
    }

    return pdf.output("blob")
  } catch (error) {
    console.error("Error in generateCVPDF:", error)
    throw error
  } finally {
    if (captureRoot?.parentNode) {
      captureRoot.parentNode.removeChild(captureRoot)
    }
  }
}

export async function generateCoverLetterPDF(
  template: TemplateType,
  userData: CoverLetterData,
  templateName: string,
): Promise<Blob> {
  try {
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
