/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'larger-phone': '393px', // iPhone 16/17 Pro and larger
      },
      colors: {
        // Primary accent color (vibrant blue) - use for buttons, active states, highlights
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0066FF',  // Vibrant blue - main CTA color
          600: '#0052CC',  // Darker vibrant blue
          700: '#0747A6',  // Deep blue
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Success/complete state - muted teal-green that works with dark theme
        success: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // Landing page accent color (green)
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        // Vibrant saturated colors for premium feel
        vivid: {
          purple: '#6366F1',      // Indigo-500
          purpleDark: '#4F46E5',  // Indigo-600
          blue: '#0066FF',        // Bright blue
          blueDark: '#0052CC',    // Deep blue
          green: '#10B981',       // Emerald-500
          orange: '#F59E0B',      // Amber-500
          pink: '#EC4899',        // Pink-500
          yellow: '#FBBF24',      // Amber-400
        },
        // Card background for dark mode
        card: {
          dark: '#1f2937', // gray-800
          'dark-hover': '#374151', // gray-700
        },
      },
      // Consistent spacing scale
      spacing: {
        '4.5': '1.125rem', // 18px
        '18': '4.5rem', // 72px
      },
      // Consistent border radius
      borderRadius: {
        'card': '0.75rem', // 12px - standard card radius
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-slow': 'fadeInSlow 0.4s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInSlow: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
