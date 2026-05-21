function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

export function cleanJobTitle(value?: string | null, fallback = "Untitled role"): string {
  if (!value) return fallback

  const cleaned = normalizeSpaces(
    value
      .replace(/^\[external\s+from\s+[^\]]+\]:\s*/i, "")
      .replace(/^external\s+from\s+[^:]+:\s*/i, "")
      .replace(/^static\s*[/:]+\s*/i, "")
  )

  return cleaned || fallback
}

export function cleanJobCompany(value?: string | null, fallback = "CVKonnekt"): string {
  if (!value) return fallback
  const cleaned = normalizeSpaces(value)
  return cleaned || fallback
}

export function cleanJobLocation(value?: string | null, fallback = "South Africa"): string {
  if (!value) return fallback
  const cleaned = normalizeSpaces(value.split(",")[0] || "")
  return cleaned || fallback
}
