import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Layout from "../components/Layout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Nocturnal Content Planner",
  description: "Advanced content planning and generation",
};

import ErrorBoundary from "../components/ErrorBoundary";

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`} suppressHydrationWarning>
        <ErrorBoundary>
          <Providers>
            <Layout>{children}</Layout>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
