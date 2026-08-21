/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1100px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#171717",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f0f0f0",
          foreground: "#171717",
        },
        destructive: {
          DEFAULT: "#9b3131",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#777777",
          foreground: "#555555",
        },
        accent: {
          DEFAULT: "#f0f0f0",
          foreground: "#171717",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#171717",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#171717",
        },
        gym: {
          canvas: "#f7f7f7",
          dark: "#171717",
          card: "#ffffff",
          border: "#dedede",
          subtle: "#777777",
          low: {
            bg: "#e5f4e8",
            text: "#277a3e",
          },
          moderate: {
            bg: "#eeeeee",
            text: "#555555",
          },
          high: {
            bg: "#f7e4e4",
            text: "#9b3131",
          },
        },
      },
      borderRadius: {
        lg: "14px",
        md: "9px",
        sm: "6px",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
