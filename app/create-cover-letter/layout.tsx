import { generateMetadata as generateSEOMetadata, seoConfigs } from "@/lib/utils"

export const metadata = generateSEOMetadata(seoConfigs.createCoverLetter)

export default function CreateCoverLetterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
