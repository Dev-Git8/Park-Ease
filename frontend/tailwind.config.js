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
          ignition: {
            DEFAULT: '#FF6A2B',
            dark: '#E5501A',
            light: '#FF8A5B',
          },
          asphalt: '#15171c',
          pulse: '#22D3EE',
          surface: {
            DEFAULT: '#f5f4f2',
            card: '#ffffff',
          },
          ink: {
            DEFAULT: '#0d0d0f',
            soft: '#6b7280',
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
        },
        keyframes: {
          'glow-pulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(34, 211, 238, 0.55)' },
            '100%': { boxShadow: '0 0 0 14px rgba(34, 211, 238, 0)' },
          },
        },
        animation: {
          'glow-pulse': 'glow-pulse 1.2s ease-out 2',
        },
      },
    },
    plugins: [],
  }
