import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Thème "Solaire" - haut contraste pour utilisation en extérieur
        solaire: {
          // Fond sombre principal
          bg: {
            DEFAULT: '#0f172a',
            dark: '#020617',
            card: '#1e293b',
            elevated: '#334155',
          },
          // Accents orange/jaune vif (couleur soleil)
          accent: {
            DEFAULT: '#f97316',
            light: '#fb923c',
            dark: '#ea580c',
            glow: '#fbbf24',
            sun: '#fcd34d',
          },
          // Texte haute visibilité
          text: {
            DEFAULT: '#f8fafc',
            secondary: '#cbd5e1',
            muted: '#94a3b8',
            inverse: '#0f172a',
          },
          // États et feedback
          success: '#22c55e',
          warning: '#eab308',
          error: '#ef4444',
          info: '#3b82f6',
          // Bordures
          border: {
            DEFAULT: '#334155',
            light: '#475569',
            accent: '#f97316',
          },
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Tailles augmentées pour lisibilité extérieure
        'touch': ['1.125rem', { lineHeight: '1.5' }],
        'touch-lg': ['1.25rem', { lineHeight: '1.5' }],
        'touch-xl': ['1.5rem', { lineHeight: '1.4' }],
        'touch-2xl': ['1.875rem', { lineHeight: '1.3' }],
      },
      spacing: {
        // Espacements pour éléments tactiles
        'touch': '3rem',
        'touch-sm': '2.5rem',
        'touch-lg': '3.5rem',
      },
      borderRadius: {
        'touch': '0.75rem',
        'touch-lg': '1rem',
      },
      boxShadow: {
        'solaire': '0 0 20px rgba(249, 115, 22, 0.3)',
        'solaire-lg': '0 0 40px rgba(249, 115, 22, 0.4)',
        'glow': '0 0 15px rgba(251, 191, 36, 0.5)',
        'inner-dark': 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'recording': 'recording 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(249, 115, 22, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(249, 115, 22, 0.6)' },
        },
        recording: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      minHeight: {
        'touch': '3rem',
        'touch-lg': '3.5rem',
      },
      minWidth: {
        'touch': '3rem',
        'touch-lg': '3.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
