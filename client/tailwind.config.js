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
          canvas: "#f8f9fa",
          dark: "#111111",
          card: "#ffffff",
          border: "#e5e7eb",
          subtle: "#6b7280",
          low: {
            bg: "#ecfdf5",
            text: "#047857",
            border: "#a7f3d0",
          },
          moderate: {
            bg: "#f4f4f5",
            text: "#52525b",
            border: "#e4e4e7",
          },
          high: {
            bg: "#fff1f2",
            text: "#be123c",
            border: "#fecdd3",
          },
        },
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)",
        card: "0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.03), 0 4px 12px -2px rgba(0, 0, 0, 0.02)",
        "card-hover": "0 0 0 1px rgba(0, 0, 0, 0.08), 0 10px 25px -4px rgba(0, 0, 0, 0.05), 0 4px 10px -2px rgba(0, 0, 0, 0.02)",
        glow: "0 0 20px -5px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        xl: "18px",
        lg: "14px",
        md: "10px",
        sm: "6px",
        full: "9999px",
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '"Inter"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.96)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};
