import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mascot Brand Colors
        poko: {
          50: "hsl(var(--poko-50))",
          100: "hsl(var(--poko-100))",
          200: "hsl(var(--poko-200))",
          300: "hsl(var(--poko-300))",
          400: "hsl(var(--poko-400))",
          500: "hsl(var(--poko-500))", // #36C95F
          600: "hsl(var(--poko-600))",
          700: "hsl(var(--poko-700))",
          800: "hsl(var(--poko-800))",
          900: "hsl(var(--poko-900))",
          950: "hsl(var(--poko-950))",
        },
        lumo: {
          50: "hsl(var(--lumo-50))",
          100: "hsl(var(--lumo-100))",
          200: "hsl(var(--lumo-200))",
          300: "hsl(var(--lumo-300))",
          400: "hsl(var(--lumo-400))",
          500: "hsl(var(--lumo-500))", // #3AB8C2
          600: "hsl(var(--lumo-600))",
          700: "hsl(var(--lumo-700))",
          800: "hsl(var(--lumo-800))",
          900: "hsl(var(--lumo-900))",
          950: "hsl(var(--lumo-950))",
        },
        // Theme System Colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(var(--primary-50))",
          100: "hsl(var(--primary-100))",
          200: "hsl(var(--primary-200))",
          300: "hsl(var(--primary-300))",
          400: "hsl(var(--primary-400))",
          500: "hsl(var(--primary-500))",
          600: "hsl(var(--primary-600))",
          700: "hsl(var(--primary-700))",
          800: "hsl(var(--primary-800))",
          900: "hsl(var(--primary-900))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "hsl(var(--secondary-50))",
          100: "hsl(var(--secondary-100))",
          200: "hsl(var(--secondary-200))",
          300: "hsl(var(--secondary-300))",
          400: "hsl(var(--secondary-400))",
          500: "hsl(var(--secondary-500))",
          600: "hsl(var(--secondary-600))",
          700: "hsl(var(--secondary-700))",
          800: "hsl(var(--secondary-800))",
          900: "hsl(var(--secondary-900))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Legacy colors for gradual migration
        "primary-blue": "hsl(var(--primary))",
        "primary-blue-hover": "hsl(var(--primary-600))",
        "accent-light-blue": "hsl(var(--primary-50))",
        charcoal: "hsl(var(--foreground))",
        "stone-gray": "hsl(var(--muted-foreground))",
        "cool-gray": "hsl(var(--border))",
        "pearl-gray": "hsl(var(--muted))",
        "error-red": "hsl(var(--destructive))",
      },
      backgroundImage: {
        "gradient-poko": "linear-gradient(135deg, hsl(var(--poko-500)), hsl(var(--poko-600)))",
        "gradient-lumo": "linear-gradient(135deg, hsl(var(--lumo-500)), hsl(var(--lumo-600)))",
        "gradient-duo": "linear-gradient(135deg, hsl(var(--poko-500)), hsl(var(--lumo-500)))",
        "gradient-primary": "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-600)))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
