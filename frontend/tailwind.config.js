export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          sans: ['Onest', 'Inter', 'sans-serif'],
          outfit: ['Outfit', 'sans-serif'],
        },
        colors: {
          navy: {
            DEFAULT: '#2563c9',
            deep: '#0f2f63',
            light: '#5790e6',
          },
          harbor: '#0b6e97',
          surface: {
            DEFAULT: '#f4f4f4',
            card: '#ffffff',
          },
          ink: {
            DEFAULT: '#0a0a0a',
            soft: '#717784',
          },
          ghost: '#d7dae1',
          hairline: '#e6e8ec',
          background: '#ffffff',
        },
        borderRadius: {
          '3xl': '1.5rem',
          '4xl': '2rem',
          card: '1.5rem',
          'card-lg': '2rem',
          pill: '62.5rem',
        }
      },
    },
    plugins: [],
  }
