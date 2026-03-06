import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        display: ['Outfit', 'sans-serif'],
                    },
                    colors: {
                        brand: {
                            50: '#fff7ed',
                            100: '#ffedd5',
                            500: '#ff8c42', // Orange primary
                            600: '#ff7722',
                            700: '#ff6600',
                            900: '#1b3a5c', // Dark blue secondary
                        },
                        primary: {
                            50: '#fff7ed',
                            100: '#ffedd5',
                            500: '#ff8c42',
                            600: '#ff7722',
                            700: '#ff6600',
                        },
                        secondary: {
                            500: '#2c5282',
                            600: '#1b3a5c',
                            700: '#0f2744',
                        },
                        slate: {
                            850: '#1e293b', // Custom dark card
                        }
                    },
                    boxShadow: {
                        'glow': '0 0 20px rgba(34, 197, 94, 0.15)',
                        'card': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    }
                }
            },
  plugins: [],
};
export default config;
