import { generateMetadata as generateSEOMetadata, seoConfigs } from "@/lib/utils"

export const metadata = generateSEOMetadata(seoConfigs.cvExamples)

export default function CVExamplesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
