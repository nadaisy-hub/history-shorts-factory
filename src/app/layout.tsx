import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Serif_KR } from "next/font/google";
import Link from "next/link";
import { Settings, Clapperboard } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSerifKR = Noto_Serif_KR({
  variable: "--font-serif-kr",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "역사 쇼츠 팩토리",
  description: "AI 역사 유튜브 쇼츠 자동 제작 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${notoSerifKR.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <Clapperboard className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold font-[family-name:var(--font-serif-kr)] tracking-tight">
                역사 쇼츠 팩토리
              </h1>
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/settings"
                className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
