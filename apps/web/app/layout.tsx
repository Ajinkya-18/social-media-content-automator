import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AfterGlow | AI Content Engine",
  description: "Canva to YouTube Automation Platform",
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
        variables: { colorPrimary: "#0ea5e9" }, // Cyan-500
      }}
    >
      <html lang="en">
        <body className={`${inter.className} bg-[#030712] text-white flex flex-col min-h-screen`}>
          
          {/* 1. Navbar (Fixed at Top) */}
          <Navbar />

          {/* 2. Main Content 
              Added pt-28 to push content down so Navbar doesn't cover it 
          */}
          <main className="flex-1 pt-28 pb-10">
            {children}
          </main>

          {/* 3. Footer (Always at Bottom) */}
          <Footer />
          
        </body>
      </html>
    </ClerkProvider>
  );
}