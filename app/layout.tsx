import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: "Employee work tracking system for photo editing teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
