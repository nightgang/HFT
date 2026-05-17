module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: "#070B14",
          DEFAULT: "#0F172A",
          elevated: "#111827",
          card: "rgba(15, 23, 42, 0.72)",
        },
        accent: {
          purple: "#8B5CF6",
          cyan:   "#06B6D4",
          green:  "#22C55E",
          red:    "#EF4444",
        },
        text: {
          primary:   "#F1F5F9",
          secondary: "#94A3B8",
          muted:     "#64748B",
        },
        border: "rgba(255, 255, 255, 0.06)",
        "border-hover": "rgba(255, 255, 255, 0.12)",
      },
      borderRadius: {
        card: "16px",
        panel: "20px",
      },
      boxShadow: {
        "card-glow": "0 0 12px rgba(139, 92, 246, 0.12)",
      },
      backdropBlur: {
        glass: "12px",
      },
      spacing: {
        section: "24px",
        card:    "16px",
        inner:   "12px",
      },
      fontSize: {
        "2xs":  "0.625rem",
        xs:     "0.75rem",
        sm:     "0.875rem",
        base:   "1rem",
        lg:     "1.125rem",
        xl:     "1.25rem",
        "2xl":  "1.5rem",
        "3xl":  "1.875rem",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
