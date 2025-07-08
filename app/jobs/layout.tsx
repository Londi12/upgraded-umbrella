import { generateMetadata as generateSEOMetadata, seoConfigs } from "@/lib/utils"

export const metadata = generateSEOMetadata(seoConfigs.jobs)

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
