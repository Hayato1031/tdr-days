// Centralized style exports for the TDR Days application
// This index file provides a single entry point for all styling needs

// Core style modules
export * from './colors';
export * from './typography';
export * from './theme';

// Re-export commonly used items with more convenient names
export { colors as Colors } from './colors';
export { typography as Typography } from './typography';
export { 
  lightTheme as LightTheme, 
  darkTheme as DarkTheme,
  createTheme as CreateTheme,
  spacing as Spacing,
  borderRadius as BorderRadius
} from './theme';

// Type exports for better development experience
export type {
  Colors as ColorsType,
  ColorKey,
  PurpleShade,
  GradientKey
} from './colors';

export type {
  Typography as TypographyType,
  FontSize,
  FontWeight,
  TextStyle
} from './typography';

export type {
  Theme,
  ThemeMode
} from './theme';