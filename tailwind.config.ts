import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1440px",
    },
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        // Base system tokens
        "bg-0": "var(--bg-0)",
        "bg-1": "var(--bg-1)",
        "bg-2": "var(--bg-2)",
        steel: "var(--steel)",
        concrete: "var(--concrete)",
        ivory: "var(--ivory)",
        amber: {
          DEFAULT: "var(--amber)",
          50: "#FFF8E6",
          100: "#FEEDCC",
          200: "#FEDBA8",
          300: "#FDC77F",
          400: "#FCB856",
          500: "var(--amber)", // #FFB000
          600: "#D99300",
          700: "#B37600",
          800: "#8C5B00",
          900: "#664100",
        },
        molten: {
          DEFAULT: "var(--molten)",
          50: "#FFF2EC",
          100: "#FFE1D3",
          200: "#FFC2A8",
          300: "#FFA17C",
          400: "#FF844F",
          500: "var(--molten)", // #FF6A13
          600: "#D94F05",
          700: "#B33B00",
          800: "#8C2B00",
          900: "#661E00",
        },
        copper: "var(--copper)",
        brick: "var(--brick)",
        crimson: "var(--crimson)",
        gold: "var(--gold)",
        sand: "var(--sand)",

        // Semantic bindings mapped strictly to Steel & Molten Amber
        background: "var(--bg-0)",
        foreground: "var(--ivory)",
        panel: "var(--bg-2)",
        muted: {
          DEFAULT: "var(--bg-1)",
          foreground: "var(--steel)",
        },
        border: "var(--border-color)",
        input: "var(--border-color)",
        ring: "var(--amber)",
        primary: {
          DEFAULT: "var(--amber)",
          foreground: "var(--bg-0)",
        },
        secondary: {
          DEFAULT: "var(--bg-2)",
          foreground: "var(--ivory)",
        },
        accent: {
          DEFAULT: "var(--molten)",
          foreground: "var(--ivory)",
        },
        destructive: {
          DEFAULT: "var(--crimson)",
          foreground: "var(--ivory)",
        },
        warning: {
          DEFAULT: "var(--amber)",
          foreground: "var(--bg-0)",
        },
        success: {
          DEFAULT: "var(--gold)",
          foreground: "var(--bg-0)",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Barlow Condensed", "sans-serif"],
        body: ["var(--font-body)", "Barlow", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        steel: "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
        plate: "0 4px 12px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 176, 0, 0.1)",
        amber: "0 0 15px -3px rgba(255, 176, 0, 0.3)",
        molten: "0 0 20px -3px rgba(255, 106, 19, 0.4)",
        crimson: "0 0 15px -3px rgba(224, 49, 49, 0.3)",
      },
      backgroundImage: {
        "hazard-stripes":
          "repeating-linear-gradient(45deg, #FFB000, #FFB000 10px, #171513 10px, #171513 20px)",
        "hazard-stripes-crimson":
          "repeating-linear-gradient(45deg, #E03131, #E03131 10px, #171513 10px, #171513 20px)",
      },
      keyframes: {
        pulseWire: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        pulseWire: "pulseWire 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
