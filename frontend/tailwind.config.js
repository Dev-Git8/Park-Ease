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
          brand: {
            yellow: '#facc15',
            black: '#000000',
            dark: '#0f0f0f',
            'dark-card': '#1a1a1a',
            'light-bg': '#f5f5f5',
            accent: '#facc15',
          },
          primary: {
            DEFAULT: '#facc15',
            dark: '#eab308',
          },
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
        boxShadow: {
          'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.08)',
          'premium-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.12)',
          'yellow': '0 10px 15px -3px rgba(250, 204, 21, 0.3)',
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
