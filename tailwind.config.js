/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          500: '#1d4ed8',
          600: '#1e40af',
          700: '#172554'
        },
        accent: {
          400: '#f59e0b',
          500: '#ea580c',
          600: '#c2410c'
        },
        pitch: {
          50: '#f4fbf4',
          100: '#dff3df',
          500: '#15803d',
          600: '#166534'
        }
      },
      boxShadow: {
        glow: '0 20px 45px -20px rgba(29, 78, 216, 0.45)'
      }
    },
  },
  plugins: [],
}
