/**
 * Medikal Portal Brand Color Scheme
 * Green-to-Blue Gradient Theme
 */

export const theme = {
  // Primary Colors
  colors: {
    primary: {
      green: '#10b981',      // Emerald Green
      greenLight: '#34d399', // Light Emerald
      blue: '#0ea5e9',       // Sky Blue
      blueLight: '#38bdf8',  // Light Sky Blue
    },
    
    // Background Colors
    background: {
      darkest: '#000000',    // Pure Black
      dark: '#050505',       // Almost Black
      medium: '#0a0a0a',     // Very Dark Gray
      surface: '#0f0f0f',    // Dark Gray
    },

    // Text Colors
    text: {
      primary: '#ffffff',
      secondary: '#e5e7eb',
      tertiary: '#d1d5db',
      muted: '#9ca3af',
      mutedStrong: '#6b7280',
    },

    // Border Colors
    border: {
      light: 'rgba(16, 185, 129, 0.2)',  // Green with opacity
      lightBlue: 'rgba(14, 165, 233, 0.2)', // Blue with opacity
      strong: 'rgba(16, 185, 129, 0.5)',
    },

    // Status Colors
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },

  // Gradient Backgrounds
  gradients: {
    pageBackground: 'linear-gradient(135deg, #000000 0%, #050505 50%, #0a0a0a 100%)',
    pageBgClasses: 'bg-gradient-to-br from-black via-slate-950 to-black',
    heroText: 'bg-gradient-to-r from-green-400 via-emerald-300 to-blue-400',
    logo: 'bg-gradient-to-r from-green-400 to-blue-400',
  },

  // Component Styles
  components: {
    navbar: {
      background: 'bg-slate-950/80',
      border: 'border-green-500/20',
      text: 'text-gray-400',
      textHover: 'hover:text-green-400',
      logoGradient: 'bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent',
    },

    footer: {
      background: 'bg-slate-950/80',
      border: 'border-green-500/20',
      text: 'text-gray-300',
      linkText: 'text-gray-400',
      linkHover: 'hover:text-green-400',
    },

    button: {
      primary: 'bg-green-600 hover:bg-green-700',
      secondary: 'bg-blue-600 hover:bg-blue-700',
      outline: 'border border-green-500/20 text-green-400 hover:bg-green-500/10',
    },

    input: {
      background: 'bg-blue-900/30',
      border: 'border-green-500/20',
      borderFocus: 'focus:border-green-500/50',
      text: 'text-white',
      placeholder: 'placeholder-gray-500',
    },

    spinner: {
      border: 'border-blue-700',
      accent: 'border-r-green-400',
    },
  },

  // CSS Variables (for use in CSS/globals.css)
  cssVariables: {
    '--primary-green': '#10b981',
    '--primary-blue': '#0ea5e9',
    '--accent-green': '#34d399',
    '--accent-blue': '#38bdf8',
    '--background-darkest': '#0a1929',
    '--background-dark': '#0f2942',
    '--background-medium': '#1a3a52',
  },
} as const;

export type Theme = typeof theme;
