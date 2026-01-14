import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AfterGlow v2 | Creator OS",
  description: "The Operating System for the Creator Economy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: { 
          colorPrimary: "#f97316", // Orange-500 (The new primary)
          colorBackground: "#0f172a", 
        },
      }}
    >
      <html lang="en">
        <body className={`${inter.className} bg-[#030712] text-white flex flex-col min-h-screen selection:bg-orange-500/30 selection:text-orange-200`}>
          
          <Providers>
            {/* Fixed Navbar with Z-Index */}
            <Navbar />

            {/* Main Content with padding for fixed nav */}
            <main className="flex-1 pt-24 pb-12 relative z-10">
              {children}
            </main>

            <Footer />
          </Providers>

        </body>
      </html>
    </ClerkProvider>
  );
}