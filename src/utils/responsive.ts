import { Dimensions, Platform } from 'react-native';

// Breakpoints for responsive design
export const BREAKPOINTS = {
  mobile: 0,
  mobileL: 428,
  tablet: 768,
  laptop: 1024,
  desktop: 1440,
  desktopL: 1920,
  ultraWide: 2560,
} as const;

// Grid configurations
export const GRID_CONFIG = {
  mobile: { columns: 4, gutter: 16, margin: 16 },
  mobileL: { columns: 4, gutter: 20, margin: 20 },
  tablet: { columns: 8, gutter: 24, margin: 24 },
  laptop: { columns: 12, gutter: 24, margin: 32 },
  desktop: { columns: 12, gutter: 32, margin: 48 },
  desktopL: { columns: 12, gutter: 32, margin: 64 },
  ultraWide: { columns: 16, gutter: 40, margin: 80 },
} as const;

// Platform detection
export const PLATFORM = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',
  isMobile: Platform.OS === 'ios' || Platform.OS === 'android',
  isTablet: (Platform.OS === 'ios' && Dimensions.get('window').width >= 768) || (Platform.OS === 'android' && !Platform.isTV),
  isDesktop: Platform.OS === 'web' && typeof window !== 'undefined',
};

// Get current screen dimensions
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return {
    width,
    height,
    isLandscape: width > height,
    isPortrait: width <= height,
    aspectRatio: width / height,
  };
};

// Get current breakpoint
export const getCurrentBreakpoint = (width?: number): keyof typeof BREAKPOINTS => {
  const screenWidth = width || getScreenDimensions().width;
  
  if (screenWidth >= BREAKPOINTS.ultraWide) return 'ultraWide';
  if (screenWidth >= BREAKPOINTS.desktopL) return 'desktopL';
  if (screenWidth >= BREAKPOINTS.desktop) return 'desktop';
  if (screenWidth >= BREAKPOINTS.laptop) return 'laptop';
  if (screenWidth >= BREAKPOINTS.tablet) return 'tablet';
  if (screenWidth >= BREAKPOINTS.mobileL) return 'mobileL';
  return 'mobile';
};

// Responsive value calculator
export const responsiveValue = <T>(
  values: Partial<Record<keyof typeof BREAKPOINTS, T>>,
  width?: number
): T => {
  const breakpoint = getCurrentBreakpoint(width);
  const breakpointKeys = Object.keys(BREAKPOINTS) as Array<keyof typeof BREAKPOINTS>;
  const currentIndex = breakpointKeys.indexOf(breakpoint);
  
  // Find the value for current or nearest lower breakpoint
  for (let i = currentIndex; i >= 0; i--) {
    const key = breakpointKeys[i];
    if (values[key] !== undefined) {
      return values[key]!;
    }
  }
  
  // Return the first available value
  return Object.values(values)[0] as T;
};

// Responsive dimension calculator
export const responsiveDimension = (
  base: number,
  scale: Partial<Record<keyof typeof BREAKPOINTS, number>> = {}
): number => {
  const defaultScale = {
    mobile: 1,
    mobileL: 1.05,
    tablet: 1.2,
    laptop: 1.3,
    desktop: 1.4,
    desktopL: 1.5,
    ultraWide: 1.8,
  };
  
  const mergedScale = { ...defaultScale, ...scale };
  const multiplier = responsiveValue(mergedScale);
  
  return Math.round(base * multiplier);
};

// Grid system utilities
export const getGridConfig = (width?: number) => {
  const breakpoint = getCurrentBreakpoint(width);
  return GRID_CONFIG[breakpoint];
};

export const calculateColumnWidth = (
  columns: number = 1,
  width?: number,
  includeGutter: boolean = true
): number => {
  const screenWidth = width || getScreenDimensions().width;
  const config = getGridConfig(screenWidth);
  const availableWidth = screenWidth - (config.margin * 2);
  const totalGutters = includeGutter ? (config.columns - 1) * config.gutter : 0;
  const columnWidth = (availableWidth - totalGutters) / config.columns;
  
  return Math.floor(columnWidth * columns + (includeGutter ? config.gutter * (columns - 1) : 0));
};

// Responsive spacing calculator
export const responsiveSpacing = (base: number): number => {
  return responsiveDimension(base, {
    mobile: 1,
    mobileL: 1.1,
    tablet: 1.25,
    laptop: 1.4,
    desktop: 1.5,
    desktopL: 1.6,
    ultraWide: 2,
  });
};

// Responsive font size calculator
export const responsiveFontSize = (base: number): number => {
  return responsiveDimension(base, {
    mobile: 1,
    mobileL: 1.02,
    tablet: 1.1,
    laptop: 1.15,
    desktop: 1.2,
    desktopL: 1.25,
    ultraWide: 1.4,
  });
};

// Container width calculator
export const getContainerWidth = (maxWidth?: number): number => {
  const { width } = getScreenDimensions();
  const breakpoint = getCurrentBreakpoint();
  
  const containerMaxWidths = {
    mobile: width,
    mobileL: width,
    tablet: 720,
    laptop: 960,
    desktop: 1200,
    desktopL: 1400,
    ultraWide: 1800,
  };
  
  const defaultMaxWidth = containerMaxWidths[breakpoint];
  const finalMaxWidth = maxWidth || defaultMaxWidth;
  
  return Math.min(width, finalMaxWidth);
};

// Adaptive layout configurations
export const getLayoutConfig = (width?: number) => {
  const breakpoint = getCurrentBreakpoint(width);
  
  const configs = {
    mobile: {
      navigation: 'bottom',
      sidebar: false,
      columns: 1,
      cardColumns: 1,
      analyticsColumns: 1,
    },
    mobileL: {
      navigation: 'bottom',
      sidebar: false,
      columns: 1,
      cardColumns: 1,
      analyticsColumns: 1,
    },
    tablet: {
      navigation: 'top',
      sidebar: false,
      columns: 2,
      cardColumns: 2,
      analyticsColumns: 2,
    },
    laptop: {
      navigation: 'sidebar',
      sidebar: true,
      columns: 3,
      cardColumns: 3,
      analyticsColumns: 3,
    },
    desktop: {
      navigation: 'sidebar',
      sidebar: true,
      columns: 4,
      cardColumns: 3,
      analyticsColumns: 4,
    },
    desktopL: {
      navigation: 'sidebar',
      sidebar: true,
      columns: 4,
      cardColumns: 4,
      analyticsColumns: 4,
    },
    ultraWide: {
      navigation: 'sidebar',
      sidebar: true,
      columns: 6,
      cardColumns: 5,
      analyticsColumns: 6,
    },
  };
  
  return configs[breakpoint];
};

// Media query helper
export const mediaQuery = (breakpoint: keyof typeof BREAKPOINTS): string => {
  return `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`;
};

// Orientation utilities
export const isLandscape = (): boolean => {
  const { isLandscape } = getScreenDimensions();
  return isLandscape;
};

export const isPortrait = (): boolean => {
  const { isPortrait } = getScreenDimensions();
  return isPortrait;
};

// Safe area calculations
export const getSafeAreaPadding = () => {
  const breakpoint = getCurrentBreakpoint();
  
  return {
    top: responsiveValue({
      mobile: 44,
      tablet: 24,
      laptop: 0,
      desktop: 0,
    }),
    bottom: responsiveValue({
      mobile: 34,
      tablet: 24,
      laptop: 0,
      desktop: 0,
    }),
    left: responsiveValue({
      mobile: 0,
      tablet: 24,
      laptop: 32,
      desktop: 48,
    }),
    right: responsiveValue({
      mobile: 0,
      tablet: 24,
      laptop: 32,
      desktop: 48,
    }),
  };
};

// Animation duration based on screen size
export const getAnimationDuration = (base: number = 300): number => {
  return responsiveValue({
    mobile: base,
    tablet: base * 0.9,
    laptop: base * 0.8,
    desktop: base * 0.7,
  });
};

// Touch target sizes
export const getTouchTargetSize = (): number => {
  return responsiveValue({
    mobile: 44,
    tablet: 48,
    laptop: 40,
    desktop: 36,
  });
};

// Export all utilities
export default {
  BREAKPOINTS,
  GRID_CONFIG,
  PLATFORM,
  getScreenDimensions,
  getCurrentBreakpoint,
  responsiveValue,
  responsiveDimension,
  getGridConfig,
  calculateColumnWidth,
  responsiveSpacing,
  responsiveFontSize,
  getContainerWidth,
  getLayoutConfig,
  mediaQuery,
  isLandscape,
  isPortrait,
  getSafeAreaPadding,
  getAnimationDuration,
  getTouchTargetSize,
};