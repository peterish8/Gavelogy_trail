import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CacheInitializer } from "@/components/CacheInitializer";
import { AuthProvider } from "@/lib/auth-context";
import { SessionManager } from "@/components/session/session-manager";
import { AppSidebar } from "@/components/navigation/app-sidebar"
import { FloatingMenuToggle } from "@/components/navigation/sidebar-toggle"
import { SidebarLayoutClient } from "@/components/navigation/sidebar-layout-client"

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
      <body className={`${inter.variable} font-sans antialiased bg-background`} suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Theme Restore
                  var storedTheme = localStorage.getItem('gavalogy-theme');
                  if (storedTheme) {
                    var theme = JSON.parse(storedTheme);
                    if (theme.state.isDarkMode) {
                      document.documentElement.classList.add('dark');
                      document.documentElement.setAttribute('data-theme', 'dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.setAttribute('data-theme', 'light');
                    }
                  }

                  // Sidebar Restore
                  var storedSidebar = localStorage.getItem('sidebar-storage');
                  if (storedSidebar) {
                    var sidebar = JSON.parse(storedSidebar);
                    if (sidebar.state.isCollapsed) {
                      document.documentElement.setAttribute('data-sidebar-state', 'collapsed');
                    } else {
                      document.documentElement.setAttribute('data-sidebar-state', 'expanded');
                    }
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
        <AuthProvider>
          <Providers>
            <CacheInitializer />
            <SessionManager />
            
            {/* Sidebar State Provider Wrapper - Handles main content margin */}
            <SidebarLayoutClient>
              <AppSidebar />
              <FloatingMenuToggle />
              
              {/* Main Content Area */}
              <main className="flex-1 w-full relative">
                {children}
              </main>
            </SidebarLayoutClient>
            
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
