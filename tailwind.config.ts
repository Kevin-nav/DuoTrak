import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom Beige Theme Colors
        "warm-white": "#FFFCF7",
        "warm-grey": "#4E4640",
        "taupe": "#B8A693",
        "taupe-light": "#CFBFAF",
        "stone": "#E7DDD0",
        "sand": "#F5EEE4",
        "espresso": "#4E4640",
        "soft-white": "#FFFFFF",
        // Legacy semantic aliases used across app pages/components
        "off-white": "#FFFCF7",
        "charcoal": "#4E4640",
        "stone-gray": "#8B8178",
        "cool-gray": "#E7DDD0",
        "pearl-gray": "#F8F2EA",
        "error-red": "#DC2626",
        // Semantic overrides
        "primary-blue": "hsl(var(--primary))", // Fallback for backwards compat
        "primary-blue-hover": "hsl(31, 24%, 57%)",
        "accent-light-blue": "hsl(35, 45%, 95%)", // Re-mapped to neutral warm accent

        // Mascot Colors - Updated to Earthy Tones
        "poko-green": "#74A868",    // Earthy Sage Green
        "lumo-teal": "#6B9EA6",     // Muted Teal
        "energy-yellow": "#DFC46D", // Muted Gold
        "celebration-purple": "#A894C2", // Muted Lavender
        "accent-blue": "#7DA0BC",   // Muted Blue

        // Shared Beige Theme (lighter, less brown-heavy)
        "landing-cream": "#FFFCF7",
        "landing-sand": "#F5EEE4",
        "landing-clay": "#E7DDD0",
        "landing-espresso": "#4E4640",
        "landing-espresso-light": "#7A7067",
        "landing-terracotta": "#D19A78",
        "landing-sage": "#8AA083",
        "landing-gold": "#D5B469",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
