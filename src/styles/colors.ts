// Clean White-Based Design System
// Elegant, fresh, and user-friendly color palette

export const colors = {
  // Primary Purple Spectrum - Refined for clean white design
  purple: {
    50: '#fefefe',
    100: '#faf8ff',
    200: '#f4f0ff',
    300: '#e8d8ff',
    400: '#d1b3ff',
    500: '#9333ea', // Primary - More vibrant for white backgrounds
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#3730a3',
    
    // Fresh Purple Variants
    soft: '#a78bfa',
    bright: '#8b5cf6',
    vivid: '#7c3aed',
  },
  
  // Clean Fresh Gradients - Perfect for white-based design
  gradients: {
    // Subtle Primary Gradients
    purpleFlow: 'linear-gradient(135deg, #8b5cf6 0%, #9333ea 100%)',
    purpleLight: 'linear-gradient(135deg, #f4f0ff 0%, #e8d8ff 100%)',
    purpleSoft: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
    
    // Multi-color Fresh Gradients
    fresh: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 50%, #10b981 100%)',
    vibrant: 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #f59e0b 100%)',
    sunset: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ec4899 100%)',
    
    // Gentle Card Gradients
    card: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
    cardHover: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 246, 255, 0.8) 100%)',
    
    // Accent Gradients
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    
    // Glass Morphism for white backgrounds
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)',
    glassTinted: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(255, 255, 255, 0.1) 100%)',
  },
  
  // Vibrant Color Palettes - Optimized for white backgrounds
  orange: {
    50: '#fffbf7',
    100: '#fff3e6',
    200: '#ffe4c7',
    300: '#ffd19c',
    400: '#ffb366',
    500: '#f97316', // Bright and clear on white
    600: '#ea580c',
    700: '#dc2626',
    800: '#c2410c',
    900: '#9a3412',
    bright: '#ff8c42',
  },
  
  pink: {
    50: '#fdf8fc',
    100: '#fceff7',
    200: '#f8d7eb',
    300: '#f3b8d9',
    400: '#ec8cc8',
    500: '#ec4899', // Vibrant pink for contrast
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    bright: '#ff6bb3',
  },
  
  yellow: {
    50: '#fffef7',
    100: '#fefce8',
    200: '#fef9c3',
    300: '#fef08a',
    400: '#facc15',
    500: '#eab308', // Warm golden yellow
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    bright: '#fbbf24',
  },
  
  green: {
    50: '#f7fcf9',
    100: '#ecfdf5',
    200: '#d1fae5',
    300: '#a7f3d0',
    400: '#6ee7b7',
    500: '#10b981', // Fresh green for vitality
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    bright: '#34d399',
  },

  blue: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Clear sky blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    bright: '#06b6d4',
  },

  red: {
    50: '#fef8f8',
    100: '#fef2f2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Clear error red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    bright: '#f56565',
  },

  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6', // Ocean teal
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    bright: '#20d9bd',
  },

  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    bright: '#fbbf24',
  },

  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    bright: '#22d3ee',
  },

  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    bright: '#818cf8',
  },
  
  gray: {
    50: '#fdfdfd',
    100: '#f8fafc',
    200: '#f1f5f9',
    300: '#e2e8f0',
    400: '#cbd5e1',
    500: '#94a3b8', // Softer gray for white backgrounds
    600: '#64748b',
    700: '#475569',
    800: '#334155',
    900: '#1e293b',
    light: '#f8fafc',
  },

  // Fresh Accent Colors - Perfect for white backgrounds
  accent: {
    // Vibrant Accents
    coral: '#ff6b6b',
    mint: '#20d9bd',
    sunshine: '#fbbf24',
    lavender: '#a78bfa',
    
    // Soft Pastels
    peach: '#ffa8a8',
    seafoam: '#81e6d9',
    lemon: '#fed7aa',
    periwinkle: '#c7d2fe',
    
    // Natural Tones
    sage: '#68d391',
    rose: '#f687b3',
    sky: '#7dd3fc',
    warm: '#f6ad55',
  },
  
  // Semantic Colors - Clean and accessible
  semantic: {
    success: {
      light: '#a7f3d0',
      main: '#10b981',
      dark: '#059669',
      background: '#ecfdf5',
      border: '#6ee7b7',
    },
    error: {
      light: '#fecaca',
      main: '#ef4444',
      dark: '#dc2626',
      background: '#fef2f2',
      border: '#f87171',
    },
    warning: {
      light: '#fed7aa',
      main: '#f59e0b',
      dark: '#d97706',
      background: '#fffbeb',
      border: '#fbbf24',
    },
    info: {
      light: '#bae6fd',
      main: '#0ea5e9',
      dark: '#0284c7',
      background: '#f0f9ff',
      border: '#38bdf8',
    },
  },
  
  // Background Colors - Clean white-based design
  background: {
    // Primary white-based backgrounds
    primary: '#ffffff',
    secondary: '#fdfdfd',
    tertiary: '#f8fafc',
    elevated: '#ffffff',
    overlay: 'rgba(255, 255, 255, 0.95)',
    
    // Card and Component Backgrounds
    card: '#ffffff',
    cardHover: '#fefefe',
    surface: '#ffffff',
    
    // Tinted Backgrounds
    purpleTint: '#faf8ff',
    blueTint: '#f0f9ff',
    greenTint: '#f0fdf4',
    orangeTint: '#fffbf7',
    pinkTint: '#fdf8fc',
    
    // Subtle Gradients
    gradientSubtle: 'linear-gradient(180deg, #ffffff 0%, #fdfdfd 100%)',
    gradientPurple: 'linear-gradient(180deg, #ffffff 0%, #faf8ff 100%)',
    gradientBlue: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)',
    
    // Dark mode (for theme switching)
    dark: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
      elevated: '#1e293b',
      overlay: 'rgba(15, 23, 42, 0.95)',
      card: '#1e293b',
    },
  },
  
  // Text Colors - High contrast for white backgrounds
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    disabled: '#94a3b8',
    inverse: '#ffffff',
    
    // Accent text colors
    purple: '#7c3aed',
    blue: '#0ea5e9',
    green: '#10b981',
    orange: '#f59e0b',
    pink: '#ec4899',
    
    // Dark mode text
    dark: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      disabled: '#64748b',
      inverse: '#0f172a',
    },
  },
  
  // Special Effects Colors - Clean and subtle
  effects: {
    // Gentle Shadows for white backgrounds
    shadowSoft: 'rgba(15, 23, 42, 0.04)',
    shadowMedium: 'rgba(15, 23, 42, 0.08)',
    shadowLarge: 'rgba(15, 23, 42, 0.12)',
    shadowXL: 'rgba(15, 23, 42, 0.16)',
    
    // Colored Shadows
    shadowPurple: 'rgba(124, 58, 237, 0.1)',
    shadowBlue: 'rgba(14, 165, 233, 0.1)',
    shadowGreen: 'rgba(16, 185, 129, 0.1)',
    shadowOrange: 'rgba(245, 158, 11, 0.1)',
    
    // Glow Effects (subtle)
    glowPurple: 'rgba(124, 58, 237, 0.2)',
    glowBlue: 'rgba(14, 165, 233, 0.2)',
    glowGreen: 'rgba(16, 185, 129, 0.2)',
    
    // Backdrop Filters
    backdrop: 'rgba(255, 255, 255, 0.8)',
    backdropTinted: 'rgba(250, 248, 255, 0.8)',
  },
  
  // Utility Colors
  utility: {
    transparent: 'transparent',
    current: 'currentColor',
    black: '#000000',
    white: '#ffffff',
    
    // Border Colors
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    borderFocus: '#7c3aed',
    
    // Divider Colors
    divider: '#e2e8f0',
    dividerLight: '#f1f5f9',
  },
} as const;

// Type exports for TypeScript
export type Colors = typeof colors;
export type ColorKey = keyof Colors;
export type PurpleShade = keyof typeof colors.purple;
export type GradientKey = keyof typeof colors.gradients;