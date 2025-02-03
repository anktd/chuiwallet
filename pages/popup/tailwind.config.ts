import baseConfig from '@extension/tailwindcss-config';
import type { Config } from 'tailwindcss/types/config';

export default {
  ...baseConfig,
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        splash: '#F1E84D',
      },
      fontFamily: {
        sans: ['"Red Hat Display"', 'sans-serif'],
      },
    },
  },
} as Config;
