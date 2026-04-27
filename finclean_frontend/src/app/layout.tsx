// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import ThemeToggle from "./theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinClean",
  description: "Application de scan et correction de vulnérabilités",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      translate="no" 
      suppressHydrationWarning
    >
      <head>
        <meta name="google" content="notranslate" />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} relative min-h-screen antialiased`}>
        {/* Élément décoratif de fond */}
        <div className="fixed inset-0 blur-2xl opacity-70 pointer-events-none"></div>
        
        {/* Élément flou décoratif */}
        <div 
          className="fixed top-[13%] right-20 w-1/15 h-[15vh] bg-primary/45 blur-3xl pointer-events-none"
          // {/* aria-hidden="true" */}
        >
          {/* Contenu décoratif vide */}
        </div>

        <div 
          className="fixed bottom-[13%] left-20 w-1/15 h-[15vh] bg-primary/70 blur-3xl pointer-events-none"

        >
        </div>
        <div className="fixed inset-0 blur-2xl opacity-70 pointer-events-none"></div>


        {/* ThemeToggle positionné de manière absolue */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Contenu principal */}
        <main className="relative z-20 min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </main>
      </body>
    </html>
  );
}