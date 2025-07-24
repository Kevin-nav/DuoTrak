import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { UserProvider } from "@/contexts/UserContext"
import { Providers } from "@/components/providers"
import ErrorBoundary from "@/components/ErrorBoundary"

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
      <body className={plusJakartaSans.className}>
        <ErrorBoundary>
          <Providers>
            <UserProvider>{children}</UserProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
