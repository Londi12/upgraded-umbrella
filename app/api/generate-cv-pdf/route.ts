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
        generateProfessionalPDF(doc, userData, pageWidth, pageHeight, margin)
        break
      case "modern":
        generateModernPDF(doc, userData, pageWidth, pageHeight, margin)
        break
      case "creative":
        generateCreativePDF(doc, userData, pageWidth, pageHeight, margin)
        break
      case "simple":
        generateSimplePDF(doc, userData, pageWidth, pageHeight, margin)
        break
      case "executive":
        generateExecutivePDF(doc, userData, pageWidth, pageHeight, margin)
        break
      case "technical":
        generateTechnicalPDF(doc, userData, pageWidth, pageHeight, margin)
        break
      case "graduate":
        generateGraduatePDF(doc, userData, pageWidth, pageHeight, margin)
        break
      case "digital":
        generateDigitalPDF(doc, userData, pageWidth, pageHeight, margin)
        break
      default:
        generateProfessionalPDF(doc, userData, pageWidth, pageHeight, margin)
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    // Generate filename
    const fileName = `${userData?.personalInfo?.fullName?.replace(/[^a-zA-Z0-9]/g, "_") || "CV"}_${templateName?.replace(/[^a-zA-Z0-9]/g, "_") || "Professional"}.pdf`

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

function generateProfessionalPDF(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Header with border
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, 50, "F")
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, 45, pageWidth - margin, 45)

  // Name
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text(userData.personalInfo.fullName, margin, yPosition + 10)
  }

  // Job Title
  if (userData?.personalInfo?.jobTitle) {
    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    doc.text(userData.personalInfo.jobTitle, margin, yPosition + 20)
  }

  // Contact Info
  if (userData?.personalInfo?.email || userData?.personalInfo?.phone) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const contactInfo = []
    if (userData.personalInfo.email) contactInfo.push(userData.personalInfo.email)
    if (userData.personalInfo.phone) contactInfo.push(userData.personalInfo.phone)
    if (userData.personalInfo.location) contactInfo.push(userData.personalInfo.location)
    doc.text(contactInfo.join(" | "), margin, yPosition + 30)
  }

  yPosition = 60

  // Professional Summary
  if (userData?.summary) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("PROFESSIONAL SUMMARY", margin, yPosition)
    yPosition += 8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const summaryLines = doc.splitTextToSize(userData.summary, pageWidth - 2 * margin)
    doc.text(summaryLines, margin, yPosition)
    yPosition += summaryLines.length * 5 + 15
  }

  // Experience
  if (userData?.experience && userData.experience.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("WORK EXPERIENCE", margin, yPosition)
    yPosition += 10

    userData.experience.forEach((exp: any) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = margin
      }

      if (exp.title) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(exp.title, margin, yPosition)
        yPosition += 6
      }

      if (exp.company || exp.startDate || exp.endDate) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        const companyLine = []
        if (exp.company) companyLine.push(exp.company)
        if (exp.startDate || exp.endDate) {
          companyLine.push(`${exp.startDate || ""} - ${exp.endDate || ""}`)
        }
        doc.text(companyLine.join(" • "), margin, yPosition)
        yPosition += 6
      }

      if (exp.description) {
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        const descLines = doc.splitTextToSize(exp.description, pageWidth - 2 * margin)
        doc.text(descLines, margin, yPosition)
        yPosition += descLines.length * 4 + 10
      }
    })
    yPosition += 5
  }

  // Education
  if (userData?.education && userData.education.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("EDUCATION", margin, yPosition)
    yPosition += 10

    userData.education.forEach((edu: any) => {
      if (edu.degree) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(edu.degree, margin, yPosition)
        yPosition += 6
      }

      if (edu.institution || edu.graduationDate) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        const eduLine = []
        if (edu.institution) eduLine.push(edu.institution)
        if (edu.graduationDate) eduLine.push(edu.graduationDate)
        doc.text(eduLine.join(" • "), margin, yPosition)
        yPosition += 8
      }
    })
    yPosition += 10
  }

  // Skills
  if (userData?.skills) {
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("SKILLS", margin, yPosition)
    yPosition += 10

    // Parse skills and create skill boxes
    const skillsArray = userData.skills
      .split(",")
      .map((skill: string) => skill.trim())
      .filter(Boolean)

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)

    let xPosition = margin
    let currentY = yPosition

    skillsArray.forEach((skill: string) => {
      const skillWidth = doc.getTextWidth(skill) + 8

      if (xPosition + skillWidth > pageWidth - margin) {
        xPosition = margin
        currentY += 8
      }

      // Draw skill box
      doc.setFillColor(240, 240, 240)
      doc.roundedRect(xPosition, currentY - 4, skillWidth, 6, 1, 1, "F")
      doc.text(skill, xPosition + 4, currentY)

      xPosition += skillWidth + 5
    })
  }
}

function generateModernPDF(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Header with emerald background
  doc.setFillColor(5, 150, 105) // Emerald color
  doc.rect(0, 0, pageWidth, 50, "F")

  // Name in white
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text(userData.personalInfo.fullName, margin, yPosition + 15)
  }

  // Job Title in white
  if (userData?.personalInfo?.jobTitle) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(255, 255, 255)
    doc.text(userData.personalInfo.jobTitle, margin, yPosition + 25)
  }

  yPosition = 60

  // Contact Info
  if (userData?.personalInfo?.email || userData?.personalInfo?.phone) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const contactInfo = []
    if (userData.personalInfo.email) contactInfo.push(userData.personalInfo.email)
    if (userData.personalInfo.phone) contactInfo.push(userData.personalInfo.phone)
    doc.text(contactInfo.join(" | "), margin, yPosition)
    yPosition += 15
  }

  // About Section
  if (userData?.summary) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(5, 150, 105) // Emerald color
    doc.text("ABOUT", margin, yPosition)
    yPosition += 8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const summaryLines = doc.splitTextToSize(userData.summary, pageWidth - 2 * margin)
    doc.text(summaryLines, margin, yPosition)
    yPosition += summaryLines.length * 5 + 15
  }

  // Experience with modern styling
  if (userData?.experience && userData.experience.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(5, 150, 105)
    doc.text("EXPERIENCE", margin, yPosition)
    yPosition += 10

    userData.experience.forEach((exp: any) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = margin
      }

      // Experience item with modern layout
      if (exp.title && exp.company) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(exp.title, margin, yPosition)

        // Date on the right
        if (exp.startDate || exp.endDate) {
          const dateText = `${exp.startDate || ""}-${exp.endDate || ""}`
          const dateWidth = doc.getTextWidth(dateText)
          doc.setFontSize(9)
          doc.setTextColor(100, 100, 100)
          doc.text(dateText, pageWidth - margin - dateWidth, yPosition)
        }
        yPosition += 6

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        doc.text(exp.company, margin, yPosition)
        yPosition += 6
      }

      if (exp.description) {
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        const descLines = doc.splitTextToSize(exp.description, pageWidth - 2 * margin)
        doc.text(descLines, margin, yPosition)
        yPosition += descLines.length * 4 + 10
      }
    })
  }

  // Skills with dots
  if (userData?.skills) {
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(5, 150, 105)
    doc.text("SKILLS", margin, yPosition)
    yPosition += 10

    const skillsArray = userData.skills
      .split(",")
      .map((skill: string) => skill.trim())
      .filter(Boolean)

    skillsArray.forEach((skill: string) => {
      // Draw emerald dot
      doc.setFillColor(5, 150, 105)
      doc.circle(margin + 2, yPosition - 2, 1, "F")

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(60, 60, 60)
      doc.text(skill, margin + 8, yPosition)
      yPosition += 6
    })
  }
}

function generateCreativePDF(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Creative header with gradient effect (simulated)
  doc.setFillColor(147, 51, 234) // Purple
  doc.rect(0, 0, pageWidth, 25, "F")
  doc.setFillColor(219, 39, 119) // Pink
  doc.rect(0, 25, pageWidth, 25, "F")

  // Circular avatar placeholder
  doc.setFillColor(255, 255, 255)
  doc.circle(pageWidth / 2, 35, 15, "F")
  doc.setDrawColor(147, 51, 234)
  doc.setLineWidth(2)
  doc.circle(pageWidth / 2, 35, 15, "S")

  yPosition = 65

  // Centered name
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    const nameWidth = doc.getTextWidth(userData.personalInfo.fullName)
    doc.text(userData.personalInfo.fullName, (pageWidth - nameWidth) / 2, yPosition)
    yPosition += 10
  }

  // Centered job title
  if (userData?.personalInfo?.jobTitle) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(147, 51, 234)
    const titleWidth = doc.getTextWidth(userData.personalInfo.jobTitle)
    doc.text(userData.personalInfo.jobTitle, (pageWidth - titleWidth) / 2, yPosition)
    yPosition += 15
  }

  // Contact info with creative styling
  if (userData?.personalInfo?.email || userData?.personalInfo?.phone) {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    const contactInfo = []
    if (userData.personalInfo.email) contactInfo.push(userData.personalInfo.email)
    if (userData.personalInfo.phone) contactInfo.push(userData.personalInfo.phone)
    const contactText = contactInfo.join(" | ")
    const contactWidth = doc.getTextWidth(contactText)
    doc.text(contactText, (pageWidth - contactWidth) / 2, yPosition)
    yPosition += 20
  }

  // Creative Skills section
  if (userData?.skills) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(147, 51, 234)
    doc.text("CREATIVE SKILLS", margin, yPosition)
    yPosition += 10

    const skillsArray = userData.skills
      .split(",")
      .map((skill: string) => skill.trim())
      .filter(Boolean)

    skillsArray.forEach((skill: string) => {
      // Creative bullet point
      doc.setFillColor(219, 39, 119)
      doc.circle(margin + 2, yPosition - 2, 1, "F")

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(60, 60, 60)
      doc.text(skill, margin + 8, yPosition)
      yPosition += 6
    })
    yPosition += 10
  }

  // Experience with creative boxes
  if (userData?.experience && userData.experience.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(147, 51, 234)
    doc.text("EXPERIENCE", margin, yPosition)
    yPosition += 10

    userData.experience.forEach((exp: any) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage()
        yPosition = margin
      }

      // Creative box for each experience
      doc.setFillColor(248, 250, 252) // Light background
      doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 3, 3, "F")
      doc.setDrawColor(147, 51, 234)
      doc.setLineWidth(0.5)
      doc.roundedRect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 3, 3, "S")

      if (exp.title) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(exp.title, margin + 5, yPosition + 3)
      }

      if (exp.company) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        doc.text(exp.company, margin + 5, yPosition + 10)
      }

      if (exp.startDate || exp.endDate) {
        const dateText = `${exp.startDate || ""} - ${exp.endDate || ""}`
        const dateWidth = doc.getTextWidth(dateText)
        doc.setFontSize(9)
        doc.setTextColor(147, 51, 234)
        doc.text(dateText, pageWidth - margin - dateWidth - 5, yPosition + 3)
      }

      yPosition += 30

      if (exp.description) {
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        const descLines = doc.splitTextToSize(exp.description, pageWidth - 2 * margin)
        doc.text(descLines, margin, yPosition)
        yPosition += descLines.length * 4 + 10
      }
    })
  }
}

function generateSimplePDF(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Simple centered header
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    const nameWidth = doc.getTextWidth(userData.personalInfo.fullName)
    doc.text(userData.personalInfo.fullName, (pageWidth - nameWidth) / 2, yPosition)
    yPosition += 8
  }

  if (userData?.personalInfo?.jobTitle) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    const titleWidth = doc.getTextWidth(userData.personalInfo.jobTitle)
    doc.text(userData.personalInfo.jobTitle, (pageWidth - titleWidth) / 2, yPosition)
    yPosition += 8
  }

  // Contact info centered
  if (userData?.personalInfo?.email || userData?.personalInfo?.phone) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const contactInfo = []
    if (userData.personalInfo.email) contactInfo.push(userData.personalInfo.email)
    if (userData.personalInfo.phone) contactInfo.push(userData.personalInfo.phone)
    const contactText = contactInfo.join(" • ")
    const contactWidth = doc.getTextWidth(contactText)
    doc.text(contactText, (pageWidth - contactWidth) / 2, yPosition)
    yPosition += 15
  }

  // Simple line separator
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 15

  // Objective
  if (userData?.summary) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("OBJECTIVE", margin, yPosition)
    yPosition += 8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const summaryLines = doc.splitTextToSize(userData.summary, pageWidth - 2 * margin)
    doc.text(summaryLines, margin, yPosition)
    yPosition += summaryLines.length * 5 + 15
  }

  // Simple sections with minimal styling
  generateSimpleSection(doc, "EDUCATION", userData?.education, yPosition, pageWidth, margin, pageHeight)
  generateSimpleSection(doc, "TECHNICAL SKILLS", userData?.skills, yPosition + 60, pageWidth, margin, pageHeight)
  generateSimpleSection(doc, "PROJECTS", userData?.experience, yPosition + 120, pageWidth, margin, pageHeight)
}

function generateSimpleSection(
  doc: any,
  title: string,
  data: any,
  yPos: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
) {
  let yPosition = yPos

  if (yPosition > pageHeight - 40) {
    doc.addPage()
    yPosition = margin
  }

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text(title, margin, yPosition)
  yPosition += 8

  if (title === "TECHNICAL SKILLS" && data) {
    const skillsArray = data
      .split(",")
      .map((skill: string) => skill.trim())
      .filter(Boolean)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)

    skillsArray.forEach((skill: string) => {
      doc.text(`• ${skill}`, margin, yPosition)
      yPosition += 5
    })
  } else if (Array.isArray(data)) {
    data.forEach((item: any) => {
      if (item.degree || item.title) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(item.degree || item.title, margin, yPosition)
        yPosition += 6
      }

      if (item.institution || item.company) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        doc.text(item.institution || item.company, margin, yPosition)
        yPosition += 6
      }

      if (item.description) {
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        const descLines = doc.splitTextToSize(item.description, pageWidth - 2 * margin)
        doc.text(descLines, margin, yPosition)
        yPosition += descLines.length * 4 + 8
      }
    })
  }
}

function generateExecutivePDF(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Executive header with dark background
  doc.setFillColor(17, 24, 39) // Dark gray
  doc.rect(0, 0, pageWidth, 45, "F")

  // Name in white
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text(userData.personalInfo.fullName, margin, yPosition + 15)
  }

  // Job Title in white
  if (userData?.personalInfo?.jobTitle) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(255, 255, 255)
    doc.text(userData.personalInfo.jobTitle, margin, yPosition + 28)
  }

  yPosition = 55

  // Contact info in grid
  if (userData?.personalInfo?.email || userData?.personalInfo?.phone) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)

    if (userData.personalInfo.email) {
      doc.text("Email", margin, yPosition)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)
      doc.text(userData.personalInfo.email, margin, yPosition + 5)
    }

    if (userData.personalInfo.phone) {
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)
      doc.text("Phone", pageWidth / 2, yPosition)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)
      doc.text(userData.personalInfo.phone, pageWidth / 2, yPosition + 5)
    }

    yPosition += 20
  }

  // Executive Summary
  if (userData?.summary) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("EXECUTIVE SUMMARY", margin, yPosition)
    yPosition += 8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const summaryLines = doc.splitTextToSize(userData.summary, pageWidth - 2 * margin)
    doc.text(summaryLines, margin, yPosition)
    yPosition += summaryLines.length * 5 + 15
  }

  // Leadership Experience with left border
  if (userData?.experience && userData.experience.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("LEADERSHIP EXPERIENCE", margin, yPosition)
    yPosition += 10

    userData.experience.forEach((exp: any) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = margin
      }

      // Left border for experience
      doc.setDrawColor(17, 24, 39)
      doc.setLineWidth(2)
      doc.line(margin, yPosition - 5, margin, yPosition + 20)

      if (exp.title) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(exp.title, margin + 8, yPosition)
        yPosition += 6
      }

      if (exp.company || exp.startDate || exp.endDate) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        const companyLine = []
        if (exp.company) companyLine.push(exp.company)
        if (exp.startDate || exp.endDate) {
          companyLine.push(`${exp.startDate || ""} - ${exp.endDate || ""}`)
        }
        doc.text(companyLine.join(" • "), margin + 8, yPosition)
        yPosition += 6
      }

      if (exp.description) {
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        const descLines = doc.splitTextToSize(exp.description, pageWidth - 2 * margin - 10)
        doc.text(descLines, margin + 8, yPosition)
        yPosition += descLines.length * 4 + 15
      }
    })
  }

  // Key Achievements
  if (userData?.skills) {
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("KEY ACHIEVEMENTS", margin, yPosition)
    yPosition += 10

    const skillsArray = userData.skills
      .split(",")
      .map((skill: string) => skill.trim())
      .filter(Boolean)

    skillsArray.forEach((skill: string) => {
      // Executive bullet point
      doc.setFillColor(17, 24, 39)
      doc.circle(margin + 2, yPosition - 2, 1, "F")

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(60, 60, 60)
      doc.text(skill, margin + 8, yPosition)
      yPosition += 6
    })
  }
}

function generateTechnicalPDF(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Technical header
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
    if (userData.personalInfo.location) contactInfo.push(userData.personalInfo.location)

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

  // Technical Expertise in grid
  if (userData?.skills) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(37, 99, 235)
    doc.text("TECHNICAL EXPERTISE", margin, yPosition)
    yPosition += 10

    const skillsArray = userData.skills
      .split(",")
      .map((skill: string) => skill.trim())
      .filter(Boolean)
    const skillsPerCategory = Math.ceil(skillsArray.length / 4)

    const categories = ["Languages", "Frameworks", "Databases", "Cloud"]

    categories.forEach((category, catIndex) => {
      const startIndex = catIndex * skillsPerCategory
      const categorySkills = skillsArray.slice(startIndex, startIndex + skillsPerCategory)

      if (categorySkills.length > 0) {
        const xPos = margin + (catIndex % 2) * (pageWidth / 2 - margin)
        const yPos = yPosition + Math.floor(catIndex / 2) * 25

        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(category, xPos, yPos)

        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        doc.text(categorySkills.join(", "), xPos, yPos + 5)
      }
    })

    yPosition += 60
  }

  // Professional Experience
  if (userData?.experience && userData.experience.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(37, 99, 235)
    doc.text("PROFESSIONAL EXPERIENCE", margin, yPosition)
    yPosition += 10

    userData.experience.forEach((exp: any) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = margin
      }

      if (exp.title && exp.startDate && exp.endDate) {
        // Title and dates on same line
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(exp.title, margin, yPosition)

        const dateText = `${exp.startDate}-${exp.endDate}`
        const dateWidth = doc.getTextWidth(dateText)
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(dateText, pageWidth - margin - dateWidth, yPosition)
        yPosition += 6
      }

      if (exp.company) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        doc.text(exp.company, margin, yPosition)
        yPosition += 6
      }

      if (exp.description) {
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        const descLines = doc.splitTextToSize(exp.description, pageWidth - 2 * margin)
        doc.text(descLines, margin, yPosition)
        yPosition += descLines.length * 4 + 10
      }
    })
  }
}

function generateGraduatePDF(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Graduate header - centered
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    const nameWidth = doc.getTextWidth(userData.personalInfo.fullName)
    doc.text(userData.personalInfo.fullName, (pageWidth - nameWidth) / 2, yPosition)
    yPosition += 8
  }

  if (userData?.personalInfo?.jobTitle) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(20, 184, 166) // Teal
    const titleWidth = doc.getTextWidth(userData.personalInfo.jobTitle)
    doc.text(userData.personalInfo.jobTitle, (pageWidth - titleWidth) / 2, yPosition)
    yPosition += 10
  }

  // Contact info centered
  if (userData?.personalInfo?.email || userData?.personalInfo?.phone) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const contactInfo = []
    if (userData.personalInfo.email) contactInfo.push(userData.personalInfo.email)
    if (userData.personalInfo.phone) contactInfo.push(userData.personalInfo.phone)
    const contactText = contactInfo.join(" | ")
    const contactWidth = doc.getTextWidth(contactText)
    doc.text(contactText, (pageWidth - contactWidth) / 2, yPosition)
    yPosition += 15
  }

  // Line separator
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 15

  // Profile
  if (userData?.summary) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(20, 184, 166)
    doc.text("PROFILE", margin, yPosition)
    yPosition += 8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const summaryLines = doc.splitTextToSize(userData.summary, pageWidth - 2 * margin)
    doc.text(summaryLines, margin, yPosition)
    yPosition += summaryLines.length * 5 + 15
  }

  // Education first for graduates
  if (userData?.education && userData.education.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(20, 184, 166)
    doc.text("EDUCATION", margin, yPosition)
    yPosition += 10

    userData.education.forEach((edu: any) => {
      if (edu.degree) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(edu.degree, margin, yPosition)
        yPosition += 6
      }

      if (edu.institution || edu.graduationDate) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        const eduLine = []
        if (edu.institution) eduLine.push(edu.institution)
        if (edu.graduationDate) eduLine.push(edu.graduationDate)
        doc.text(eduLine.join(" • "), margin, yPosition)
        yPosition += 8
      }
    })
    yPosition += 10
  }

  // Experience/Projects
  if (userData?.experience && userData.experience.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(20, 184, 166)
    doc.text("EXPERIENCE", margin, yPosition)
    yPosition += 10

    userData.experience.forEach((exp: any) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = margin
      }

      if (exp.title) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(exp.title, margin, yPosition)
        yPosition += 6
      }

      if (exp.company || exp.startDate) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        const companyLine = []
        if (exp.company) companyLine.push(exp.company)
        if (exp.startDate) companyLine.push(exp.startDate)
        doc.text(companyLine.join(" • "), margin, yPosition)
        yPosition += 6
      }

      if (exp.description) {
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        const descLines = doc.splitTextToSize(exp.description, pageWidth - 2 * margin)
        doc.text(descLines, margin, yPosition)
        yPosition += descLines.length * 4 + 10
      }
    })
  }

  // Skills with teal styling
  if (userData?.skills) {
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(20, 184, 166)
    doc.text("SKILLS", margin, yPosition)
    yPosition += 10

    const skillsArray = userData.skills
      .split(",")
      .map((skill: string) => skill.trim())
      .filter(Boolean)

    let xPosition = margin
    let currentY = yPosition

    skillsArray.forEach((skill: string) => {
      const skillWidth = doc.getTextWidth(skill) + 8

      if (xPosition + skillWidth > pageWidth - margin) {
        xPosition = margin
        currentY += 8
      }

      // Draw teal skill box
      doc.setFillColor(240, 253, 250) // Light teal
      doc.setDrawColor(20, 184, 166)
      doc.roundedRect(xPosition, currentY - 4, skillWidth, 6, 1, 1, "FD")

      doc.setFontSize(9)
      doc.setTextColor(20, 184, 166)
      doc.text(skill, xPosition + 4, currentY)

      xPosition += skillWidth + 5
    })
  }
}

function generateDigitalPDF(doc: any, userData: any, pageWidth: number, pageHeight: number, margin: number) {
  let yPosition = margin

  // Digital header with gradient effect
  doc.setFillColor(59, 130, 246) // Blue
  doc.rect(0, 0, pageWidth, 25, "F")
  doc.setFillColor(99, 102, 241) // Indigo
  doc.rect(0, 25, pageWidth, 25, "F")

  // Avatar circle
  doc.setFillColor(255, 255, 255)
  doc.circle(margin + 15, 35, 12, "F")
  doc.setDrawColor(59, 130, 246)
  doc.setLineWidth(2)
  doc.circle(margin + 15, 35, 12, "S")

  // Initials in circle
  if (userData?.personalInfo?.fullName) {
    const initials = userData.personalInfo.fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(59, 130, 246)
    const initialsWidth = doc.getTextWidth(initials)
    doc.text(initials, margin + 15 - initialsWidth / 2, 38)
  }

  // Name and title next to avatar
  if (userData?.personalInfo?.fullName) {
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text(userData.personalInfo.fullName, margin + 35, 30)
  }

  if (userData?.personalInfo?.jobTitle) {
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(255, 255, 255)
    doc.text(userData.personalInfo.jobTitle, margin + 35, 40)
  }

  yPosition = 65

  // Contact with icons (simulated)
  if (userData?.personalInfo?.email) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("🌐 portfolio.com", margin, yPosition)
    doc.text(`📧 ${userData.personalInfo.email}`, margin + 60, yPosition)
    yPosition += 15
  }

  // About section
  if (userData?.summary) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(99, 102, 241)
    doc.text("ABOUT", margin, yPosition)
    yPosition += 8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const summaryLines = doc.splitTextToSize(userData.summary, pageWidth - 2 * margin)
    doc.text(summaryLines, margin, yPosition)
    yPosition += summaryLines.length * 5 + 15
  }

  // Portfolio Highlights
  if (userData?.experience && userData.experience.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(99, 102, 241)
    doc.text("PORTFOLIO HIGHLIGHTS", margin, yPosition)
    yPosition += 10

    userData.experience.forEach((exp: any, index: number) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage()
        yPosition = margin
      }

      // Portfolio item box
      const boxWidth = (pageWidth - 3 * margin) / 2
      const xPos = margin + (index % 2) * (boxWidth + margin)
      const yPos = yPosition + Math.floor(index / 2) * 40

      // Gradient background simulation
      const colors = [
        [236, 72, 153], // Pink
        [168, 85, 247], // Purple
        [34, 197, 94], // Green
        [59, 130, 246], // Blue
      ]
      const color = colors[index % colors.length]

      doc.setFillColor(color[0], color[1], color[2])
      doc.setGlobalAlpha(0.1)
      doc.roundedRect(xPos, yPos - 5, boxWidth, 25, 3, 3, "F")
      doc.setGlobalAlpha(1)

      // Portfolio preview rectangle
      doc.setFillColor(color[0], color[1], color[2])
      doc.setGlobalAlpha(0.3)
      doc.roundedRect(xPos + 5, yPos, boxWidth - 10, 8, 2, 2, "F")
      doc.setGlobalAlpha(1)

      if (exp.title) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(exp.title, xPos + 5, yPos + 15)
      }

      if (exp.description) {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        const shortDesc = exp.description.substring(0, 50) + "..."
        doc.text(shortDesc, xPos + 5, yPos + 20)
      }
    })

    yPosition += Math.ceil(userData.experience.length / 2) * 40 + 10
  }

  // Digital Skills
  if (userData?.skills) {
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(99, 102, 241)
    doc.text("DIGITAL SKILLS", margin, yPosition)
    yPosition += 10

    const skillsArray = userData.skills
      .split(",")
      .map((skill: string) => skill.trim())
      .filter(Boolean)

    let xPosition = margin
    let currentY = yPosition

    skillsArray.forEach((skill: string) => {
      const skillWidth = doc.getTextWidth(skill) + 10

      if (xPosition + skillWidth > pageWidth - margin) {
        xPosition = margin
        currentY += 10
      }

      // Digital skill pill
      doc.setFillColor(248, 250, 252) // Light background
      doc.setDrawColor(99, 102, 241)
      doc.roundedRect(xPosition, currentY - 4, skillWidth, 7, 3, 3, "FD")

      doc.setFontSize(9)
      doc.setTextColor(99, 102, 241)
      doc.text(skill, xPosition + 5, currentY)

      xPosition += skillWidth + 5
    })

    yPosition = currentY + 15
  }

  // Contact section
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 15, 3, 3, "F")

  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text("Available for freelance", margin + 5, yPosition + 6)

  doc.setFont("helvetica", "bold")
  doc.setTextColor(99, 102, 241)
  const connectText = "Let's connect!"
  const connectWidth = doc.getTextWidth(connectText)
  doc.text(connectText, pageWidth - margin - connectWidth - 5, yPosition + 6)
}
