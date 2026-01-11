"use client";

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/5 bg-[#030712] py-8 mt-auto z-40 relative">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        
        {/* Copyright */}
        <div>
          © {currentYear} AfterGlow Inc. All rights reserved.
        </div>

        {/* Legal Links */}
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-cyan-400 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-cyan-400 transition-colors">
            Terms of Service
          </Link>
          <Link href="/support" className="hover:text-cyan-400 transition-colors">
            Support
          </Link>
        </div>

      </div>
    </footer>
  );
}