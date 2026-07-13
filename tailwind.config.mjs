/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        court: {
          blue: '#123B5D',
          charcoal: '#252B31',
          teal: '#2E7D78',
          mist: '#F5F7F8',
          line: '#D8DEE3'
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: []
};
