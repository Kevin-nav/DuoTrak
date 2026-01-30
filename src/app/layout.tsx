import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { UserProvider } from "@/contexts/UserContext"
import { Providers } from "@/components/providers"
import ErrorBoundary from "@/components/ErrorBoundary"
import { MockAuthIndicator } from "@/components/dev/MockAuthIndicator"
import ConvexClientProvider from "./ConvexClientProvider"

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DuoTrak - Shared Goals Dashboard",
  description: "Manage shared goals and tasks with your partner",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={plusJakartaSans.className}>
        <ErrorBoundary>
          <ConvexClientProvider>
            <Providers>
              <UserProvider>
                {children}
                {process.env.NODE_ENV === 'development' && <MockAuthIndicator />}
              </UserProvider>
            </Providers>
          </ConvexClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

