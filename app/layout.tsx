import type React from "react"
import type { Metadata } from "next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "Forko Conseil - Réseau Social Interne",
  description: "Plateforme collaborative pour les consultants Forko Conseil",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-50">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
