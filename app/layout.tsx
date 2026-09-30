import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "终末地控制台",
  description: "终末地自动化任务控制台",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

