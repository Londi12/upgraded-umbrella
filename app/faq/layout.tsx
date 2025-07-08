import { generateMetadata as generateSEOMetadata, seoConfigs } from "@/lib/utils"

export const metadata = generateSEOMetadata(seoConfigs.faq)

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
