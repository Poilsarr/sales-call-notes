import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        border: "var(--border)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        danger: "var(--danger)",
        warning: "var(--warning)",
        success: "var(--success)",
        linear: {
          black: "#050505",
          panel: "#0a0a0b",
          surface: "#141416",
          secondary: "#1c1c20",
          indigo: "#5e6ad2",
          violet: "#7170ff",
          accent: "#22d3a8",
        },
      },
      letterSpacing: {
        tightest: "-0.06em",
        tighter: "-0.04em",
        tight: "-0.02em",
        wide: "0.05em",
        wider: "0.1em",
        widest: "0.2em",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
        "in-out-expo": "cubic-bezier(0.87, 0, 0.13, 1)",
        "spring": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px) blur(4px)" },
          "100%": { opacity: "1", transform: "translateY(0) blur(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease-out forwards",
        "stagger-1": "fadeUp 0.8s ease-out 0.1s forwards",
        "stagger-2": "fadeUp 0.8s ease-out 0.2s forwards",
        "stagger-3": "fadeUp 0.8s ease-out 0.3s forwards",
        "scale-in": "scale-in 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards",
        "float": "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
