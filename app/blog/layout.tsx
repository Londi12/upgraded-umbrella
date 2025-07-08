import { generateMetadata as generateSEOMetadata, seoConfigs } from "@/lib/utils"

export const metadata = generateSEOMetadata(seoConfigs.blog)

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
