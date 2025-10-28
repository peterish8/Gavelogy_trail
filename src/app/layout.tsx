import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CacheInitializer } from "@/components/CacheInitializer";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Gavelogy - CLAT PG Preparation Platform",
  description:
    "Comprehensive online learning platform for Indian law competitive exam preparation, specifically targeting CLAT PG aspirants.",
  keywords: [
    "CLAT PG",
    "law preparation",
    "competitive exams",
    "Indian law",
    "online learning",
  ],
  authors: [{ name: "Gavelogy Team" }],
  icons: {
    icon: "/icon.jpg",
  },
  openGraph: {
    title: "Gavelogy - CLAT PG Preparation Platform",
    description:
      "Master CLAT PG with intelligent mistake tracking, gamified learning, and contemporary legal cases.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <Providers>
            <CacheInitializer />
            {children}
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
