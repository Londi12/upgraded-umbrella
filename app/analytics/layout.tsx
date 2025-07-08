import { generateMetadata as generateSEOMetadata, seoConfigs } from "@/lib/utils"

export const metadata = generateSEOMetadata(seoConfigs.analytics)

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
