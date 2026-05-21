const JOB_SHARE_SEPARATOR = "--"

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function buildJobSharePath(job: { id: string | number; title?: string | null; company?: string | null }) {
  const id = String(job.id)
  const base = [job.title || "", job.company || ""].filter(Boolean).join(" ").trim()
  const slug = slugify(base)
  return slug ? `/jobs/${id}${JOB_SHARE_SEPARATOR}${slug}` : `/jobs/${id}`
}

export function parseJobIdFromRouteParam(param: string): string {
  const [id] = param.split(JOB_SHARE_SEPARATOR)
  return id || param
}
