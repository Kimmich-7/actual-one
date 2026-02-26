import "./globals.css"

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Juja St. Peters School - Coding Platform",
  description: "Learn to code with interactive courses designed for students at Juja St. Peters School",
  icons: {
    icon: "https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png",
    shortcut: "https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png",
    apple: "https://jsps.ac.ke/wp-content/uploads/2022/10/jsps-logo2.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}