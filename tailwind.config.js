/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        ink: {
          950: '#0a0d12', 900: '#0f141b', 850: '#131a23', 800: '#18212c', 700: '#223040', 600: '#2e3f53',
        },
        signal: { DEFAULT: '#f5a524', soft: '#f5a52420' },
      },
    },
  },
  plugins: [],
};
