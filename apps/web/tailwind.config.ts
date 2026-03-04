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
                            50: '#f0fdf4',
                            100: '#dcfce7',
                            500: '#22c55e', // Green for BigBasket alignment/Freshness
                            600: '#16a34a',
                            900: '#0f172a',
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
