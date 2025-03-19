import baseConfig from '@extension/tailwindcss-config';
import type { Config } from 'tailwindcss/types/config';

export default {
  ...baseConfig,
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#141414',
        'primary-yellow': '#F1E84D',
        'primary-orange': '#FB8200',
        'primary-green': '#3EE246',
        'primary-red': '#F62C2C',
        'background-ab': '#ABABAB',
        'background-79': '#797979',
        'background-5f': '#5F5F5F',
        'background-42': '#424242',
        'background-2c': '#2C2C2C',
        'background-1d': '#1D1D1D',
        'background-14': '#141414',
        'foreground-e7': '#E7E7E7',
        foreground: '#ABABAB',
        'foreground-79': '#797979',
        'foreground-42': '#424242',
        'foreground-1e': '#1E1E1E',
      },
      fontFamily: {
        sans: ['"Red Hat Display"', 'sans-serif'],
      },
    },
  },
} as Config;
