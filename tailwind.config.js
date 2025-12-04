/** @type {import('tailwindcss').Config} */
import { tailwindTokens } from './src/design-system/tokens.ts';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    screens: tailwindTokens.screens,
    extend: {
      colors: {
        ...tailwindTokens.colors,
        // Dark mode aliases for easier use
        darkBg: tailwindTokens.colors.darkBg,
        cardDark: tailwindTokens.colors.cardDark,
        textDark: tailwindTokens.colors.textDark,
        mutedDark: tailwindTokens.colors.mutedDark,
      },
      spacing: {
        ...tailwindTokens.spacing,
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      fontFamily: tailwindTokens.fontFamily,
      fontSize: tailwindTokens.fontSize,
      fontWeight: tailwindTokens.fontWeight,
      lineHeight: tailwindTokens.lineHeight,
      letterSpacing: tailwindTokens.letterSpacing,
      boxShadow: tailwindTokens.boxShadow,
      borderRadius: tailwindTokens.borderRadius,
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      maxHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        slideInLeft: 'slideInLeft 0.3s ease-out',
        slideInRight: 'slideInRight 0.3s ease-out',
        slideOutLeft: 'slideOutLeft 0.3s ease-in',
        slideOutRight: 'slideOutRight 0.3s ease-in',
        scaleIn: 'scaleIn 0.2s ease-out',
        scaleOut: 'scaleOut 0.2s ease-in',
        bounceIn: 'bounceIn 0.6s ease-out',
        shake: 'shake 0.5s ease-in-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'bounce-delay-0': 'bounce 1s infinite 0ms',
        'bounce-delay-150': 'bounce 1s infinite 150ms',
        'bounce-delay-300': 'bounce 1s infinite 300ms',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutLeft: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        slideInLeft: 'slideInLeft 0.3s ease-out',
        slideInRight: 'slideInRight 0.3s ease-out',
        slideOutLeft: 'slideOutLeft 0.3s ease-in',
        slideOutRight: 'slideOutRight 0.3s ease-in',
        scaleIn: 'scaleIn 0.2s ease-out',
        scaleOut: 'scaleOut 0.2s ease-in',
        bounceIn: 'bounceIn 0.6s ease-out',
        shake: 'shake 0.5s ease-in-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'bounce-delay-0': 'bounce 1s infinite 0ms',
        'bounce-delay-150': 'bounce 1s infinite 150ms',
        'bounce-delay-300': 'bounce 1s infinite 300ms',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
