// tailwind.config.ts

import type { Config } from 'tailwindcss'; // Import the type

const config: Config = {
  // Add darkMode strategy
  darkMode: 'class',
  // Configure content paths
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // If using pages router alongside app
    './src/components/**/*.{js,ts,jsx,tsx,mdx}', // Your components folder
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // Your app router folder
  ],
  theme: {
    extend: {
      // You can add theme extensions here later if needed
      // backgroundImage: {
      //   'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      //   'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      // },
    },
  },
  plugins: [
    // require('@tailwindcss/forms'), // Uncomment if you add this plugin
  ],
};

export default config; // Use ES Module export
