import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/toaster"
import { createDeploymentRecoveryScript } from "@/lib/deployment-recovery"
import PreloadPagesWrapper from "./preload-pages-wrapper"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: {
    default: "终末地控制台",
    template: "%s · 终末地控制台",
  },
  description: "面向任务调度、设备状态与运行记录的终末地控制台",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="shortcut icon" href="/icon.png" />
        <script dangerouslySetInnerHTML={{ __html: createDeploymentRecoveryScript() }} />
      </head>
      <body className={inter.variable}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <PreloadPagesWrapper />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
