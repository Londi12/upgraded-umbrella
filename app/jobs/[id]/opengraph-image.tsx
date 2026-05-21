import { ImageResponse } from "next/og"
import { cleanJobCompany, cleanJobLocation, cleanJobTitle } from "@/lib/job-display"
import { supabase } from "@/lib/supabase"

export const runtime = "edge"

export const alt = "Shared job preview"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

interface OpenGraphImageProps {
  params: Promise<{ id: string }>
}

interface PublicJob {
  id: string
  title: string
  snippet: string
  description?: string | null
  source: string
  company?: string | null
  location?: string | null
  posted_date?: string | null
}

async function getJob(id: string): Promise<PublicJob | null> {
  const { data, error } = await supabase
    .from("scraped_jobs")
    .select("id,title,snippet,source,company,location,posted_date")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("Failed to load job preview", error)
    return null
  }

  return data
}

function clamp(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

function formatPostedDate(value?: string | null) {
  if (!value) return "Recently posted"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Recently posted"
  return `Posted ${new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(date)}`
}

function extractShareSnippet(job: PublicJob | null) {
  const raw = (job?.description?.trim() || job?.snippet?.trim() || "").replace(/\r\n/g, "\n")
  if (!raw) return "Browse this role on CVKonnekt and apply directly from the original job source."

  const lines = raw
    .split("\n")
    .map((line) => line.replace(/^[-*\u2022]\s*/, "").trim())
    .filter(Boolean)

  if (!lines.length) return "Browse this role on CVKonnekt and apply directly from the original job source."

  const targetLines = Math.min(8, Math.max(5, lines.length))
  const excerpt = lines.slice(0, targetLines).join(" ")
  return excerpt.length > 620 ? `${excerpt.slice(0, 617)}...` : excerpt
}

function buildSummary(job: PublicJob | null) {
  const snippet = extractShareSnippet(job)
  const source = job?.source || "CVKonnekt Jobs"
  const posted = formatPostedDate(job?.posted_date)
  return clamp(`${snippet} Source: ${source}. ${posted}.`, 360)
}

export default async function OpenGraphImage({ params }: OpenGraphImageProps) {
  const { id } = await params
  const job = await getJob(id)

  const title = clamp(cleanJobTitle(job?.title, "South African job opportunity"), 90)
  const company = clamp(cleanJobCompany(job?.company || job?.source || "CVKonnekt Jobs", "CVKonnekt Jobs"), 42)
  const location = clamp(cleanJobLocation(job?.location), 38)
  const summary = buildSummary(job)
  const posted = formatPostedDate(job?.posted_date)

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #bfdbfe 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at top right, rgba(255,255,255,0.28), transparent 32%), radial-gradient(circle at bottom left, rgba(59,130,246,0.55), transparent 30%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "54px 58px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 18px",
                borderRadius: 999,
                background: "rgba(15, 23, 42, 0.35)",
                border: "1px solid rgba(255,255,255,0.16)",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              <span style={{ color: "#bfdbfe" }}>CVKonnekt</span>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>Shared job</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.14)",
                fontSize: 22,
              }}
            >
              <span>{location}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 940 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: "#dbeafe" }}>{company}</div>
              <div style={{ fontSize: 68, lineHeight: 1.04, fontWeight: 800, letterSpacing: -2.2 }}>{title}</div>
            </div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.82)",
                maxWidth: 920,
              }}
            >
              {summary}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                fontSize: 24,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: "10px 16px",
                  borderRadius: 999,
                  background: "rgba(15, 23, 42, 0.3)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {posted}
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "10px 16px",
                  borderRadius: 999,
                  background: "rgba(15, 23, 42, 0.3)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                View and apply on CVKonnekt
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>cvkonnekt.co.za</div>
          </div>
        </div>
      </div>
    ),
    size
  )
}