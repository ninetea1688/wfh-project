import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', 'IBM Plex Sans Thai', ...fontFamily.sans],
      },
      colors: {
        navy: {
          DEFAULT: '#1B3F8B',
          light: '#234A9E',
        },
        blue: {
          DEFAULT: '#2E5EAA',
          light: '#E6EEF9',
          mid: '#D0E1F5',
        },
        gold: {
          DEFAULT: '#22C55E',
          light: '#DCFCE7',
        },
        success: '#16A34A',
        danger: '#EF4444',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [animate],
}

export default config
