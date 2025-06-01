// Ultra-Minimal Theme System
export type ThemeMode = 'light' | 'dark';

// Fallback colors in case colors.ts fails
const fallbackColors = {
  purple: {
    500: '#9333ea',
    bright: '#8b5cf6',
  },
  background: {
    primary: '#ffffff',
    secondary: '#fdfdfd',
    card: '#ffffff',
    elevated: '#ffffff',
    tertiary: '#f8fafc',
  },
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    disabled: '#d1d5db',
  },
  utility: {
    borderLight: '#f3f4f6',
    border: '#e5e7eb',
    white: '#ffffff',
    gridLight: '#f9fafb',
  },
};

// Try to import colors, fallback if it fails
let importedColors;
try {
  importedColors = require('./colors').colors;
} catch (error) {
  console.warn('Failed to import colors, using fallback');
  importedColors = fallbackColors;
}

export const colors = importedColors || fallbackColors;

// Spacing system
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
};

// Border radius system
export const borderRadius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

// Basic theme structure
export interface Theme {
  mode: ThemeMode;
  colors: typeof colors;
}

// Create theme function
export const createTheme = (mode: ThemeMode): Theme => ({
  mode,
  colors,
});

// Export default themes
export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');