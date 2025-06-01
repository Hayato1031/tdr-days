// Ultra-Minimal Theme Context - Safe Implementation
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Minimal fallback theme
const fallbackTheme = {
  mode: 'light' as const,
  colors: {
    purple: {
      500: '#9333ea',
      bright: '#8b5cf6',
    },
    background: {
      primary: '#ffffff',
      secondary: '#fdfdfd', 
      card: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
    },
    utility: {
      borderLight: '#f3f4f6',
    },
  },
};

// Try to import theme safely
let lightTheme, darkTheme;
try {
  const themeModule = require('../styles/theme');
  lightTheme = themeModule.lightTheme || fallbackTheme;
  darkTheme = themeModule.darkTheme || { ...fallbackTheme, mode: 'dark' };
} catch (error) {
  console.warn('Failed to import theme, using fallback');
  lightTheme = fallbackTheme;
  darkTheme = { ...fallbackTheme, mode: 'dark' };
}

export type ThemeMode = 'light' | 'dark';
export type Theme = typeof fallbackTheme;

// Simple theme configuration
export interface ThemeConfiguration {
  mode: ThemeMode;
  designStyle: string;
  accentColor: string;
  animationSpeed: string;
  borderRadiusPreference: string;
  shadowIntensity: string;
}

// Theme context interface
interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isLoading: boolean;
  systemTheme: string | null;
  
  // Configuration
  themeConfig: ThemeConfiguration;
  setDesignStyle: (style: string) => void;
  setAccentColor: (color: string) => void;
  setAnimationSpeed: (speed: string) => void;
  setBorderRadiusPreference: (preference: string) => void;
  setShadowIntensity: (intensity: string) => void;
  resetThemeDefaults: () => void;
  exportThemeSettings: () => string;
  importThemeSettings: (settings: string) => Promise<boolean>;
}

// Default configuration
const defaultThemeConfig: ThemeConfiguration = {
  mode: 'light',
  designStyle: 'material',
  accentColor: '#a855f7',
  animationSpeed: 'normal',
  borderRadiusPreference: 'rounded',
  shadowIntensity: 'normal',
};

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Safe Theme Provider
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [themeConfig, setThemeConfig] = useState<ThemeConfiguration>(defaultThemeConfig);
  const [isLoading] = useState(false);

  // Safe theme selection
  const theme = themeMode === 'light' ? (lightTheme || fallbackTheme) : (darkTheme || fallbackTheme);

  // Toggle theme
  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeModeState(newMode);
  };

  // Set theme mode
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  // Simple config setters
  const setDesignStyle = (style: string) => {
    setThemeConfig(prev => ({ ...prev, designStyle: style }));
  };

  const setAccentColor = (color: string) => {
    setThemeConfig(prev => ({ ...prev, accentColor: color }));
  };

  const setAnimationSpeed = (speed: string) => {
    setThemeConfig(prev => ({ ...prev, animationSpeed: speed }));
  };

  const setBorderRadiusPreference = (preference: string) => {
    setThemeConfig(prev => ({ ...prev, borderRadiusPreference: preference }));
  };

  const setShadowIntensity = (intensity: string) => {
    setThemeConfig(prev => ({ ...prev, shadowIntensity: intensity }));
  };

  const resetThemeDefaults = () => {
    setThemeConfig(defaultThemeConfig);
  };

  const exportThemeSettings = (): string => {
    return JSON.stringify(themeConfig);
  };

  const importThemeSettings = async (settings: string): Promise<boolean> => {
    try {
      const config = JSON.parse(settings);
      setThemeConfig(config);
      return true;
    } catch {
      return false;
    }
  };

  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    toggleTheme,
    setThemeMode,
    isLoading,
    systemTheme: null,
    themeConfig,
    setDesignStyle,
    setAccentColor,
    setAnimationSpeed,
    setBorderRadiusPreference,
    setShadowIntensity,
    resetThemeDefaults,
    exportThemeSettings,
    importThemeSettings,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Safe hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return a safe fallback instead of throwing
    return {
      theme: fallbackTheme,
      themeMode: 'light',
      toggleTheme: () => {},
      setThemeMode: () => {},
      isLoading: false,
      systemTheme: null,
      themeConfig: defaultThemeConfig,
      setDesignStyle: () => {},
      setAccentColor: () => {},
      setAnimationSpeed: () => {},
      setBorderRadiusPreference: () => {},
      setShadowIntensity: () => {},
      resetThemeDefaults: () => {},
      exportThemeSettings: () => '{}',
      importThemeSettings: async () => false,
    };
  }
  return context;
};

export default ThemeContext;