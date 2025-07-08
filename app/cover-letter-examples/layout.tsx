import { generateMetadata as generateSEOMetadata, seoConfigs } from "@/lib/utils"

export const metadata = generateSEOMetadata(seoConfigs.coverLetterExamples)

export default function CoverLetterExamplesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
