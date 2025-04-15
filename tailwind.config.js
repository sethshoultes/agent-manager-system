/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
    },
  },
  plugins: [],
}

