import { NextRequest, NextResponse } from "next/server"
import { CoverLetterPreview } from "@/components/cover-letter-preview"
export async function POST(request: NextRequest) {
  try {
    const { template, userData } = await request.json()
    // Generate static HTML without ReactDOM
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; background: #f9fafb; margin: 0; }
          </style>
        </head>
        <body>
          <div style="padding:0;margin:0">
            <CoverLetterPreview template={template} userData={userData} />
          </div>
        </body>
      </html>
    `
    // Let Next.js handle the component rendering internally
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to render HTML", details: error instanceof Error ? error.message : error }, { status: 500 })
  }
}
