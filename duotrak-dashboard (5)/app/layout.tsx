import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { MascotProvider } from "@/contexts/mascot-context"
import { ContextualMascotRenderer } from "@/components/mascots/contextual-mascot-renderer"
import DashboardLayout from "@/components/dashboard-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DuoTrak - Achieve Goals Together",
  description: "Build habits and achieve goals with your accountability partner",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <MascotProvider>
            <DashboardLayout>{children}</DashboardLayout>
            <ContextualMascotRenderer />
          </MascotProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
