import type { Config } from 'tailwindcss';

/**
 * Design system for the "Enchanted/Cozy" Macros wizard.
 * All palette tokens are centralized here (no scattered hex in components).
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f4f1ea',
        sage: '#8a9a5b',
        pink: '#e8c4c4',
        ink: '#3e4a3d',
        muted: '#6b705c',
        card: 'rgba(255, 255, 255, 0.88)',
        cardBorder: 'rgba(255, 255, 255, 0.6)',
      },
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};

export default config;
