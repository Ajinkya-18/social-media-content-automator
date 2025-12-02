import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nocturnal Content Planner",
  description: "Advanced content planning and generation",
};

import ErrorBoundary from "@/components/ErrorBoundary";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <Layout>{children}</Layout>
        </ErrorBoundary>
      </body>
    </html>
  );
}
