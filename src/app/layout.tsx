import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Gavalogy - CLAT PG Preparation Platform",
  description: "Comprehensive online learning platform for Indian law competitive exam preparation, specifically targeting CLAT PG aspirants.",
  keywords: ["CLAT PG", "law preparation", "competitive exams", "Indian law", "online learning"],
  authors: [{ name: "Gavalogy Team" }],
  openGraph: {
    title: "Gavalogy - CLAT PG Preparation Platform",
    description: "Master CLAT PG with intelligent mistake tracking, gamified learning, and contemporary legal cases.",
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
