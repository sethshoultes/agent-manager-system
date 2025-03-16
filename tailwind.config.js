/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  safelist: [
    'app-layout',
    'app-content',
    'main-content',
    'card',
    'card-header',
    'card-body',
    'card-footer',
    'btn', 
    'btn-primary', 
    'btn-secondary', 
    'btn-danger',
    'btn-small', 
    'btn-medium', 
    'btn-large',
    'btn-disabled'
  ],
  theme: {
    extend: {
      colors: {
        // Light theme
        light: {
          primary: '#4a69bd',
          secondary: '#6c5ce7',
          accent: '#00b894',
          background: '#ffffff',
          surface: '#f5f7fa',
          error: '#e74c3c',
          warning: '#f39c12',
          success: '#2ecc71',
          'text-primary': '#24292e',
          'text-secondary': '#6c757d',
        },
        // Dark theme
        dark: {
          primary: '#5c85e6',
          secondary: '#9c88ff',
          accent: '#00d1a0',
          background: '#1a1a2e',
          surface: '#16213e',
          error: '#ff6b6b',
          warning: '#feca57',
          success: '#1dd1a1',
          'text-primary': '#f8f9fa',
          'text-secondary': '#adb5bd',
        },
        // Terminal/Log Display specific colors
        terminal: {
          background: '#000000',
          text: '#00bfff',  // Electric blue
          border: '#444444',
          success: '#00ff00', // Bright green
          error: '#ff6b6b',   // Bright red
          warning: '#ffcc00', // Amber
          info: '#00bfff',    // Electric blue
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        bold: '700',
      },
    },
  },
  plugins: [],
}