import type React from "react"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { UserChatbot } from "@/components/user-chatbot"
import { MultipleStructuredData } from "@/components/structured-data"
import {
  generateMetadata as generateSEOMetadata,
  seoConfigs,
  generateOrganizationStructuredData,
  generateWebsiteStructuredData
} from "@/lib/utils"
import Script from "next/script"

import "./globals.css"

export const metadata = generateSEOMetadata(seoConfigs.home)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const structuredDataArray = [
    generateOrganizationStructuredData(),
    generateWebsiteStructuredData()
  ]

  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CVKonnekt" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#1e40af" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-69Y0MVRCH3"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-69Y0MVRCH3');
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>
        <MultipleStructuredData dataArray={structuredDataArray} />
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <div className="flex-1">{children}</div>
              <SiteFooter />
              <UserChatbot />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
