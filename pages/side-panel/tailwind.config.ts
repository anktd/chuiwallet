import baseConfig from '@extension/tailwindcss-config';
import type { Config } from 'tailwindcss/types/config';

export default {
  ...baseConfig,
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary-yellow': '#F1E84D',
        disabledBg: '#797979',
        disabledText: '#424242',
        dark: '#141414',
        foreground: '#ABABAB',
      },
      fontFamily: {
        sans: ['"Red Hat Display"', 'sans-serif'],
      },
    },
  },
} as Config;
