import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom AfterGlow Palette
        biolum: {
          cyan: "#22d3ee",   // Main Glow
          purple: "#a855f7", // Secondary Glow
          dark: "#0f172a",   // Deep Sea Background
          glass: "rgba(15, 23, 42, 0.6)", // Glass Panel bg
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "conic-gradient":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      // --- YOUR REQUESTED ANIMATION ---
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite', // Added for the loading rings
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;