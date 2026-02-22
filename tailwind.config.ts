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
        "warm-white": "#F8F7F4",
        "warm-grey": "#45413C",
        "taupe": "#8F7A6E",
        "taupe-light": "#BEA692",
        "stone": "#DCD6CF",
        "sand": "#EBE9E4",
        "espresso": "#22201D",
        "soft-white": "#FAFAFA",
        // Semantic overrides
        "primary-blue": "hsl(var(--primary))", // Fallback for backwards compat
        "primary-blue-hover": "hsl(32, 25%, 40%)",
        "accent-light-blue": "hsl(36, 20%, 94%)", // Re-mapped to warm accent

        // Mascot Colors - Updated to Earthy Tones
        "poko-green": "#74A868",    // Earthy Sage Green
        "lumo-teal": "#6B9EA6",     // Muted Teal
        "energy-yellow": "#DFC46D", // Muted Gold
        "celebration-purple": "#A894C2", // Muted Lavender
        "accent-blue": "#7DA0BC",   // Muted Blue

        // Landing Page Warm Beige Theme
        "landing-cream": "#FAF7F2",
        "landing-sand": "#E8E0D6",
        "landing-clay": "#D4C8BB",
        "landing-espresso": "#2C2520",
        "landing-espresso-light": "#5C4F47",
        "landing-terracotta": "#C4704B",
        "landing-sage": "#7A8B6F",
        "landing-gold": "#C49A3C",
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
