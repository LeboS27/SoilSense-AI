import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1A6B3A",
          light: "#E8F5E9",
        },
        accent: {
          gold: "#F5A623",
        },
        ink: {
          dark: "#1A1A1A",
          grey: "#555555",
        },
        surface: {
          bg: "#F7F9F7",
          card: "#FFFFFF",
        },
        alert: {
          red: "#D32F2F",
          orange: "#F57C00",
          blue: "#1565C0",
        },
      },
      animation: {
        "flash-in": "flashIn 1s ease-out",
        "slide-down": "slideDown 0.2s ease-out",
      },
      keyframes: {
        flashIn: {
          "0%": { backgroundColor: "rgba(232, 245, 233, 1)" },
          "100%": { backgroundColor: "rgba(232, 245, 233, 0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
