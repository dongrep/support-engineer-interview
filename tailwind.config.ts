// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#ff0000',
        'secondary': '#00ff00',
      },
      textColor: {
        DEFAULT: '#808080', // Default text color set to gray
      },
    },
  },
  plugins: [],
};

export default config;
