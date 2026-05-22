/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          midnight: '#0a0f1e',
          navy: '#0d1426',
          surface: '#ffffff',
          accent: '#5b5fcf',
          'accent-bright': '#818cf8',
          'accent-glow': 'rgba(91, 95, 207, 0.15)',
        },
        status: {
          success: '#10b981',
          'success-light': '#d1fae5',
          'success-text': '#065f46',
          warning: '#f59e0b',
          'warning-light': '#fef3c7',
          'warning-text': '#92400e',
          danger: '#ef4444',
          'danger-light': '#fee2e2',
          'danger-text': '#991b1b',
          info: '#3b82f6',
          'info-light': '#dbeafe',
          'info-text': '#1e40af',
          purple: '#8b5cf6',
          'purple-light': '#ede9fe',
          'purple-text': '#5b21b6',
          orange: '#f97316',
          'orange-light': '#ffedd5',
          'orange-text': '#c2410c',
        },
        neutral: {
          primary: '#0f172a',
          secondary: '#475569',
          muted: '#94a3b8',
          placeholder: '#cbd5e1',
          'border-default': '#f1f5f9',
          'border-strong': '#e2e8f0',
          'border-focus': '#5b5fcf',
          page: '#f0f4ff',
          card: '#ffffff',
          hover: '#fafbff',
          selected: '#eef2ff',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
