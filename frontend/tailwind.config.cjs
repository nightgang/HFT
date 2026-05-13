module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#121212",
        primary: "#8A2BE2",
        primaryLight: "#A855F7",
        secondary: "#B084F5",
        accent: "#FF0033",
        textPrimary: "#FFFFFF",
        textSecondary: "#D1D5DB",
        // Cyberpunk Neon Colors
        neon: {
          purple: "#a855f7",
          "purple-dark": "#7e22ce",
          "purple-light": "#d8b4fe",
          green: "#22c55e",
          "green-dark": "#15803d",
          "green-light": "#86efac",
          pink: "#ec4899",
          "pink-dark": "#be185d",
          "pink-light": "#f472b6",
          cyan: "#06b6d4",
          "cyan-dark": "#0e7490",
          "cyan-light": "#67e8f9",
        },
      },
      borderRadius: {
        card: "16px",
        panel: "24px",
      },
      boxShadow: {
        glowPrimary: "0 0 20px rgba(138,43,226,0.6)",
        glowSoft: "0 0 10px rgba(168,85,247,0.4)",
        "glow-purple": "0 0 20px rgba(168, 85, 247, 0.8)",
        "glow-green": "0 0 20px rgba(34, 197, 94, 0.8)",
        "glow-pink": "0 0 20px rgba(236, 72, 153, 0.8)",
        "glow-cyan": "0 0 20px rgba(6, 182, 212, 0.8)",
        "glow-purple-sm": "0 0 10px rgba(168, 85, 247, 0.6)",
        "glow-green-sm": "0 0 10px rgba(34, 197, 94, 0.6)",
        "glow-pink-sm": "0 0 10px rgba(236, 72, 153, 0.6)",
      },
      backdropBlur: {
        glass: "12px",
        "glass-heavy": "20px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
      animation: {
        "neon-glow": "neon-glow 2s ease-in-out infinite",
        "neon-green": "neon-green 2s ease-in-out infinite",
        "neon-pink": "neon-pink 2s ease-in-out infinite",
        "pulse-neon": "pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scan-line 8s linear infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        "neon-glow": {
          "0%, 100%": {
            "box-shadow":
              "0 0 10px rgba(168, 85, 247, 0.8), 0 0 20px rgba(168, 85, 247, 0.4)",
          },
          "50%": {
            "box-shadow":
              "0 0 20px rgba(168, 85, 247, 1), 0 0 30px rgba(168, 85, 247, 0.6)",
          },
        },
        "neon-green": {
          "0%, 100%": {
            "box-shadow":
              "0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.4)",
          },
          "50%": {
            "box-shadow":
              "0 0 20px rgba(34, 197, 94, 1), 0 0 30px rgba(34, 197, 94, 0.6)",
          },
        },
        "neon-pink": {
          "0%, 100%": {
            "box-shadow":
              "0 0 10px rgba(236, 72, 153, 0.8), 0 0 20px rgba(236, 72, 153, 0.4)",
          },
          "50%": {
            "box-shadow":
              "0 0 20px rgba(236, 72, 153, 1), 0 0 30px rgba(236, 72, 153, 0.6)",
          },
        },
        "pulse-neon": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
      fontFamily: {
        mono: ["Monaco", "Courier New", "monospace"],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
      },
    },
  },
  plugins: [],
};
