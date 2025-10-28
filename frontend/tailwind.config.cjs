/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        // Animation for the kinetic text
        textFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // A soft, celebratory pulse for the final stage
        celebrateGlow: {
          '0%, 100%': { boxShadow: '0 0 15px 5px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 30px 10px rgba(59, 130, 246, 0.5)' },
        },
        // NEW: Keyframe for the revolving line
        spin: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        'text-fade-in': 'textFadeIn 0.6s ease-out forwards',
        'celebrate-glow': 'celebrateGlow 1.5s ease-out forwards',
        // NEW: A 4.5s spin animation that runs once
        'spin-slow-once': 'spin 4.5s linear forwards',
      },
    },
  },
  plugins: [],
}