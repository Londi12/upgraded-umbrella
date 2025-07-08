import { generateMetadata as generateSEOMetadata, seoConfigs } from "@/lib/utils"

export const metadata = generateSEOMetadata(seoConfigs.create)

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
