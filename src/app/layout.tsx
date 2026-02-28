import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "X - It's what's happening",
  description: "From breaking news and entertainment to sports and politics, get the full story with all the live commentary.",
  keywords: ["X", "Twitter", "social media", "news", "trending"],
  authors: [{ name: "X Corp." }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "X - It's what's happening",
    description: "From breaking news and entertainment to sports and politics, get the full story with all the live commentary.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "X - It's what's happening",
    description: "From breaking news and entertainment to sports and politics, get the full story with all the live commentary.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
