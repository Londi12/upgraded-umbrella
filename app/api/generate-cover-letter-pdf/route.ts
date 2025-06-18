import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { template, userData, templateName } = await request.json()

    // Import jsPDF dynamically
    const { jsPDF } = await import("jspdf")

    // Create new PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20

    // Generate template-specific PDF
    switch (template) {
      case "professional":
        generateProfessionalCoverLetter(doc, userData, pageWidth, pageHeight, margin)
        break
      case "modern":
        generateModernCoverLetter(doc, userData, pageWidth, pageHeight, margin)
        break
      case "creative":
        generateCreativeCoverLetter(doc, userData, pageWidth, pageHeight, margin)
        break
      case "simple":
        generateSimpleCoverLetter(doc, userData, pageWidth, pageHeight, margin)
        break
      case "executive":
        generateExecutiveCoverLetter(doc, userData, pageWidth, pageHeight, margin)
        break
      case "technical":
        generateTechnicalCoverLetter(doc, userData, pageWidth, pageHeight, margin)
        break
      default:
        generateProfessionalCoverLetter(doc, userData, pageWidth, pageHeight, margin)
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    // Generate filename
    const fileName = `${userData?.personalInfo?.fullName?.replace(/[^a-zA-Z0-9]/g, "_") || "Cover_Letter"}_${templateName?.replace(/[^a-zA-Z0-9]/g, "_") || "Professional"}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function generateProfessionalCoverLetter(
  doc: any,
  userData: any,
  pageWidth: number,
  pageHeight: number,
  margin: number,
) {
  let yPosition = margin

  // Header with border
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, 40, "F")
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, 40, pageWidth - margin, 40)

  // Date - right aligned
  if (userData?.letterContent?.date) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    const dateWidth = doc.getTextWidth(userData.letterContent.date)
    doc.text(userData.letterContent.date, pageWidth - margin - dateWidth, yPosition)
    yPosition += 15
  }

  // Recipient info
  if (userData?.recipientInfo) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)

    if (userData.recipientInfo.name) {
      doc.text(userData.recipientInfo.name, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.title) {
      doc.text(userData.recipientInfo.title, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.company) {
      doc.text(userData.recipientInfo.company, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.address) {
      doc.text(userData.recipientInfo.address, margin, yPosition)
      yPosition += 5
    }
    yPosition += 10
  }

  // Greeting
  if (userData?.letterContent?.greeting) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "medium")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.letterContent.greeting, margin, yPosition)
    yPosition += 15
  }

  // Opening paragraph
  if (userData?.letterContent?.opening) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const openingLines = doc.splitTextToSize(userData.letterContent.opening, pageWidth - 2 * margin)
    doc.text(openingLines, margin, yPosition)
    yPosition += openingLines.length * 5 + 10
  }

  // Body paragraphs
  if (userData?.letterContent?.body) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const bodyLines = doc.splitTextToSize(userData.letterContent.body, pageWidth - 2 * margin)
    doc.text(bodyLines, margin, yPosition)
    yPosition += bodyLines.length * 5 + 10
  }

  // Closing paragraph
  if (userData?.letterContent?.closing) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const closingLines = doc.splitTextToSize(userData.letterContent.closing, pageWidth - 2 * margin)
    doc.text(closingLines, margin, yPosition)
    yPosition += closingLines.length * 5 + 15
  }

  // Signature
  if (userData?.letterContent?.signature) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.letterContent.signature, margin, yPosition)
    yPosition += 10
  }

  // Name
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.personalInfo.fullName, margin, yPosition)
  }
}

function generateModernCoverLetter(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Modern header with emerald background
  doc.setFillColor(5, 150, 105) // Emerald color
  doc.rect(0, 0, pageWidth, 40, "F")

  // Name in white
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text(userData.personalInfo.fullName, margin, yPosition + 15)
  }

  // Contact info in white
  if (userData?.personalInfo?.email || userData?.personalInfo?.phone) {
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    const contactInfo = []
    if (userData.personalInfo.email) contactInfo.push(userData.personalInfo.email)
    if (userData.personalInfo.phone) contactInfo.push(userData.personalInfo.phone)
    doc.text(contactInfo.join(" • "), margin, yPosition + 25)
  }

  yPosition = 50

  // Date
  if (userData?.letterContent?.date) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    doc.text(userData.letterContent.date, margin, yPosition)
    yPosition += 15
  }

  // Recipient info
  if (userData?.recipientInfo) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)

    if (userData.recipientInfo.title) {
      doc.text(userData.recipientInfo.title, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.company) {
      doc.text(userData.recipientInfo.company, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.address) {
      doc.text(userData.recipientInfo.address, margin, yPosition)
      yPosition += 5
    }
    yPosition += 10
  }

  // Greeting
  if (userData?.letterContent?.greeting) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "medium")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.letterContent.greeting, margin, yPosition)
    yPosition += 15
  }

  // Opening paragraph
  if (userData?.letterContent?.opening) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const openingLines = doc.splitTextToSize(userData.letterContent.opening, pageWidth - 2 * margin)
    doc.text(openingLines, margin, yPosition)
    yPosition += openingLines.length * 5 + 10
  }

  // Body paragraphs
  if (userData?.letterContent?.body) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const bodyLines = doc.splitTextToSize(userData.letterContent.body, pageWidth - 2 * margin)
    doc.text(bodyLines, margin, yPosition)
    yPosition += bodyLines.length * 5 + 10
  }

  // Closing paragraph in emerald box
  if (userData?.letterContent?.closing) {
    doc.setFillColor(240, 253, 244) // Light emerald
    doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 30, 3, 3, "F")

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const closingLines = doc.splitTextToSize(userData.letterContent.closing, pageWidth - 2 * margin - 10)
    doc.text(closingLines, margin + 5, yPosition + 5)
    yPosition += closingLines.length * 5 + 20
  }

  // Signature
  if (userData?.letterContent?.signature) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.letterContent.signature, margin, yPosition)
    yPosition += 10
  }

  // Name in emerald
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(5, 150, 105)
    doc.text(userData.personalInfo.fullName, margin, yPosition)
  }
}

function generateCreativeCoverLetter(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Creative header with gradient effect (simulated)
  doc.setFillColor(147, 51, 234) // Purple
  doc.rect(0, 0, pageWidth, 25, "F")
  doc.setFillColor(219, 39, 119) // Pink
  doc.rect(0, 25, pageWidth, 25, "F")

  // Circular avatar placeholder
  doc.setFillColor(255, 255, 255)
  doc.circle(pageWidth / 2, 25, 15, "F")
  doc.setDrawColor(147, 51, 234)
  doc.setLineWidth(2)
  doc.circle(pageWidth / 2, 25, 15, "S")

  yPosition = 60

  // Centered name
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    const nameWidth = doc.getTextWidth(userData.personalInfo.fullName)
    doc.text(userData.personalInfo.fullName, (pageWidth - nameWidth) / 2, yPosition)
    yPosition += 8
  }

  // Centered contact info
  if (userData?.personalInfo?.email || userData?.personalInfo?.phone) {
    doc.setFontSize(10)
    doc.setTextColor(147, 51, 234)
    const contactInfo = []
    if (userData.personalInfo.email) contactInfo.push(userData.personalInfo.email)
    if (userData.personalInfo.phone) contactInfo.push(userData.personalInfo.phone)
    const contactText = contactInfo.join(" • ")
    const contactWidth = doc.getTextWidth(contactText)
    doc.text(contactText, (pageWidth - contactWidth) / 2, yPosition)
    yPosition += 15
  }

  // Date - right aligned
  if (userData?.letterContent?.date) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    const dateWidth = doc.getTextWidth(userData.letterContent.date)
    doc.text(userData.letterContent.date, pageWidth - margin - dateWidth, yPosition)
    yPosition += 15
  }

  // Recipient info
  if (userData?.recipientInfo) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)

    if (userData.recipientInfo.title) {
      doc.text(userData.recipientInfo.title, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.company) {
      doc.text(userData.recipientInfo.company, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.address) {
      doc.text(userData.recipientInfo.address, margin, yPosition)
      yPosition += 5
    }
    yPosition += 10
  }

  // Greeting in purple
  if (userData?.letterContent?.greeting) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "medium")
    doc.setTextColor(147, 51, 234)
    doc.text(userData.letterContent.greeting, margin, yPosition)
    yPosition += 15
  }

  // Opening paragraph
  if (userData?.letterContent?.opening) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const openingLines = doc.splitTextToSize(userData.letterContent.opening, pageWidth - 2 * margin)
    doc.text(openingLines, margin, yPosition)
    yPosition += openingLines.length * 5 + 10
  }

  // Body paragraphs in creative box
  if (userData?.letterContent?.body) {
    doc.setFillColor(250, 245, 255) // Light purple
    doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 40, 3, 3, "F")

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const bodyLines = doc.splitTextToSize(userData.letterContent.body, pageWidth - 2 * margin - 10)
    doc.text(bodyLines, margin + 5, yPosition + 5)
    yPosition += bodyLines.length * 5 + 20
  }

  // Closing paragraph
  if (userData?.letterContent?.closing) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const closingLines = doc.splitTextToSize(userData.letterContent.closing, pageWidth - 2 * margin)
    doc.text(closingLines, margin, yPosition)
    yPosition += closingLines.length * 5 + 15
  }

  // Signature
  if (userData?.letterContent?.signature) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.letterContent.signature, margin, yPosition)
    yPosition += 10
  }

  // Name in purple
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(147, 51, 234)
    doc.text(userData.personalInfo.fullName, margin, yPosition)
  }
}

function generateSimpleCoverLetter(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Date - right aligned
  if (userData?.letterContent?.date) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    const dateWidth = doc.getTextWidth(userData.letterContent.date)
    doc.text(userData.letterContent.date, pageWidth - margin - dateWidth, yPosition)
    yPosition += 15
  }

  // Recipient info
  if (userData?.recipientInfo) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)

    if (userData.recipientInfo.title) {
      doc.text(userData.recipientInfo.title, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.company) {
      doc.text(userData.recipientInfo.company, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.address) {
      doc.text(userData.recipientInfo.address, margin, yPosition)
      yPosition += 5
    }
    yPosition += 10
  }

  // Greeting
  if (userData?.letterContent?.greeting) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "medium")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.letterContent.greeting, margin, yPosition)
    yPosition += 15
  }

  // Opening paragraph
  if (userData?.letterContent?.opening) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const openingLines = doc.splitTextToSize(userData.letterContent.opening, pageWidth - 2 * margin)
    doc.text(openingLines, margin, yPosition)
    yPosition += openingLines.length * 5 + 10
  }

  // Body paragraphs
  if (userData?.letterContent?.body) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const bodyLines = doc.splitTextToSize(userData.letterContent.body, pageWidth - 2 * margin)
    doc.text(bodyLines, margin, yPosition)
    yPosition += bodyLines.length * 5 + 10
  }

  // Closing paragraph
  if (userData?.letterContent?.closing) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const closingLines = doc.splitTextToSize(userData.letterContent.closing, pageWidth - 2 * margin)
    doc.text(closingLines, margin, yPosition)
    yPosition += closingLines.length * 5 + 15
  }

  // Signature
  if (userData?.letterContent?.signature) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.letterContent.signature, margin, yPosition)
    yPosition += 10
  }

  // Name
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.personalInfo.fullName, margin, yPosition)
  }
}

function generateExecutiveCoverLetter(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Executive header with dark background
  doc.setFillColor(17, 24, 39) // Dark gray
  doc.rect(0, 0, pageWidth, 40, "F")

  // Name in white
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text(userData.personalInfo.fullName, margin, yPosition + 15)
  }

  // Email in white
  if (userData?.personalInfo?.email) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(255, 255, 255)
    doc.text(userData.personalInfo.email, margin, yPosition + 25)
  }

  yPosition = 50

  // Date - right aligned
  if (userData?.letterContent?.date) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    const dateWidth = doc.getTextWidth(userData.letterContent.date)
    doc.text(userData.letterContent.date, pageWidth - margin - dateWidth, yPosition)
    yPosition += 15
  }

  // Recipient info
  if (userData?.recipientInfo) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)

    if (userData.recipientInfo.title) {
      doc.text(userData.recipientInfo.title, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.company) {
      doc.text(userData.recipientInfo.company, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.address) {
      doc.text(userData.recipientInfo.address, margin, yPosition)
      yPosition += 5
    }
    yPosition += 10
  }

  // Greeting
  if (userData?.letterContent?.greeting) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "medium")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.letterContent.greeting, margin, yPosition)
    yPosition += 15
  }

  // Opening paragraph
  if (userData?.letterContent?.opening) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const openingLines = doc.splitTextToSize(userData.letterContent.opening, pageWidth - 2 * margin)
    doc.text(openingLines, margin, yPosition)
    yPosition += openingLines.length * 5 + 10
  }

  // Body paragraphs in executive box
  if (userData?.letterContent?.body) {
    doc.setFillColor(243, 244, 246) // Light gray
    doc.setDrawColor(17, 24, 39) // Dark gray
    doc.setLineWidth(2)
    doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 40, 0, 0, "F")
    doc.line(margin, yPosition - 5, margin + 4, yPosition - 5)
    doc.line(margin, yPosition - 5, margin, yPosition + 35)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const bodyLines = doc.splitTextToSize(userData.letterContent.body, pageWidth - 2 * margin - 10)
    doc.text(bodyLines, margin + 10, yPosition + 5)
    yPosition += bodyLines.length * 5 + 20
  }

  // Closing paragraph
  if (userData?.letterContent?.closing) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const closingLines = doc.splitTextToSize(userData.letterContent.closing, pageWidth - 2 * margin)
    doc.text(closingLines, margin, yPosition)
    yPosition += closingLines.length * 5 + 15
  }

  // Signature
  if (userData?.letterContent?.signature) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.letterContent.signature, margin, yPosition)
    yPosition += 10
  }

  // Name and title
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(17, 24, 39)
    doc.text(userData.personalInfo.fullName, margin, yPosition)
    yPosition += 5
  }

  if (userData?.personalInfo?.jobTitle) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    doc.text(userData.personalInfo.jobTitle, margin, yPosition)
  }
}

function generateTechnicalCoverLetter(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Technical header with name and title
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.personalInfo.fullName, margin, yPosition)
  }

  if (userData?.personalInfo?.jobTitle) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(37, 99, 235) // Blue
    doc.text(userData.personalInfo.jobTitle, margin, yPosition + 8)
  }

  // Contact info on the right
  if (userData?.personalInfo?.email || userData?.personalInfo?.phone) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const contactInfo = []
    if (userData.personalInfo.email) contactInfo.push(userData.personalInfo.email)
    if (userData.personalInfo.phone) contactInfo.push(userData.personalInfo.phone)

    contactInfo.forEach((info, index) => {
      const infoWidth = doc.getTextWidth(info)
      doc.text(info, pageWidth - margin - infoWidth, yPosition + index * 5)
    })
  }

  yPosition += 25

  // Line separator
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 15

  // Date - right aligned
  if (userData?.letterContent?.date) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    const dateWidth = doc.getTextWidth(userData.letterContent.date)
    doc.text(userData.letterContent.date, pageWidth - margin - dateWidth, yPosition)
    yPosition += 15
  }

  // Recipient info
  if (userData?.recipientInfo) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)

    if (userData.recipientInfo.title) {
      doc.text(userData.recipientInfo.title, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.company) {
      doc.text(userData.recipientInfo.company, margin, yPosition)
      yPosition += 5
    }
    if (userData.recipientInfo.address) {
      doc.text(userData.recipientInfo.address, margin, yPosition)
      yPosition += 5
    }
    yPosition += 10
  }

  // Greeting
  if (userData?.letterContent?.greeting) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "medium")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.letterContent.greeting, margin, yPosition)
    yPosition += 15
  }

  // Opening paragraph
  if (userData?.letterContent?.opening) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const openingLines = doc.splitTextToSize(userData.letterContent.opening, pageWidth - 2 * margin)
    doc.text(openingLines, margin, yPosition)
    yPosition += openingLines.length * 5 + 10
  }

  // Technical expertise box
  doc.setFillColor(239, 246, 255) // Light blue
  doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 30, 3, 3, "F")

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(37, 99, 235) // Blue
  doc.text("Technical Expertise:", margin + 5, yPosition + 5)

  // Body as technical bullet points
  if (userData?.letterContent?.body) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)

    // Convert body to bullet points if it contains newlines
    const bodyText = userData.letterContent.body
    const bodyLines = bodyText.split("\n")

    bodyLines.forEach((line: string, index: number) => {
      if (line.trim()) {
        if (!line.startsWith("•")) {
          line = "• " + line
        }
        doc.text(line, margin + 5, yPosition + 15 + index * 5)
      }
    })

    yPosition += bodyLines.length * 5 + 20
  } else {
    yPosition += 30
  }

  // Closing paragraph
  if (userData?.letterContent?.closing) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const closingLines = doc.splitTextToSize(userData.letterContent.closing, pageWidth - 2 * margin)
    doc.text(closingLines, margin, yPosition)
    yPosition += closingLines.length * 5 + 15
  }

  // Signature
  if (userData?.letterContent?.signature) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.letterContent.signature, margin, yPosition)
    yPosition += 10
  }

  // Name in blue
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(37, 99, 235)
    doc.text(userData.personalInfo.fullName, margin, yPosition)
  }
}
