module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface: '#121212',
        primary: '#8A2BE2',
        primaryLight: '#A855F7',
        secondary: '#B084F5',
        accent: '#FF0033',
        textPrimary: '#FFFFFF',
        textSecondary: '#D1D5DB',
      },
      borderRadius: {
        card: '16px',
        panel: '24px',
      },
      boxShadow: {
        glowPrimary: '0 0 20px rgba(138,43,226,0.6)',
        glowSoft: '0 0 10px rgba(168,85,247,0.4)',
      },
      backdropBlur: {
        glass: '12px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
    },
  },
  plugins: [],
};
