import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import {
  getCurrentBreakpoint,
  getScreenDimensions,
  responsiveValue,
  responsiveDimension,
  responsiveFontSize,
  responsiveSpacing,
  getLayoutConfig,
  calculateColumnWidth,
  getContainerWidth,
  BREAKPOINTS,
  PLATFORM,
  getGridConfig,
  getSafeAreaPadding,
  getAnimationDuration,
  getTouchTargetSize,
} from '../utils/responsive';

// Main responsive hook
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(getScreenDimensions());
  const [breakpoint, setBreakpoint] = useState(getCurrentBreakpoint());

  useEffect(() => {
    const updateDimensions = ({ window }: { window: ScaledSize }) => {
      const newDimensions = {
        width: window.width,
        height: window.height,
        isLandscape: window.width > window.height,
        isPortrait: window.width <= window.height,
        aspectRatio: window.width / window.height,
      };
      setDimensions(newDimensions);
      setBreakpoint(getCurrentBreakpoint(window.width));
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  const responsive = useCallback(
    <T>(values: Partial<Record<keyof typeof BREAKPOINTS, T>>): T => {
      return responsiveValue(values, dimensions.width);
    },
    [dimensions.width]
  );

  const rDimension = useCallback(
    (base: number, scale?: Partial<Record<keyof typeof BREAKPOINTS, number>>) => {
      return responsiveDimension(base, scale);
    },
    [dimensions.width]
  );

  const rFontSize = useCallback(
    (base: number) => responsiveFontSize(base),
    [dimensions.width]
  );

  const rSpacing = useCallback(
    (base: number) => responsiveSpacing(base),
    [dimensions.width]
  );

  const layoutConfig = useMemo(
    () => getLayoutConfig(dimensions.width),
    [dimensions.width]
  );

  const gridConfig = useMemo(
    () => getGridConfig(dimensions.width),
    [dimensions.width]
  );

  const containerWidth = useMemo(
    () => getContainerWidth(),
    [dimensions.width]
  );

  const safeAreaPadding = useMemo(
    () => getSafeAreaPadding(),
    [breakpoint]
  );

  const animationDuration = useCallback(
    (base?: number) => getAnimationDuration(base),
    [breakpoint]
  );

  const touchTargetSize = useMemo(
    () => getTouchTargetSize(),
    [breakpoint]
  );

  const isBreakpoint = useCallback(
    (bp: keyof typeof BREAKPOINTS) => {
      return dimensions.width >= BREAKPOINTS[bp];
    },
    [dimensions.width]
  );

  const isExactBreakpoint = useCallback(
    (bp: keyof typeof BREAKPOINTS) => {
      return breakpoint === bp;
    },
    [breakpoint]
  );

  return {
    // Dimensions
    dimensions,
    breakpoint,
    
    // Responsive utilities
    responsive,
    rDimension,
    rFontSize,
    rSpacing,
    
    // Layout configurations
    layoutConfig,
    gridConfig,
    containerWidth,
    safeAreaPadding,
    
    // Animation & interaction
    animationDuration,
    touchTargetSize,
    
    // Breakpoint checks
    isBreakpoint,
    isExactBreakpoint,
    
    // Platform info
    platform: PLATFORM,
    
    // Screen state
    isLandscape: dimensions.isLandscape,
    isPortrait: dimensions.isPortrait,
    aspectRatio: dimensions.aspectRatio,
  };
};

// Hook for dynamic column calculations
export const useColumns = (
  defaultColumns: Partial<Record<keyof typeof BREAKPOINTS, number>> = {}
) => {
  const { responsive, dimensions, gridConfig } = useResponsive();
  
  const columns = responsive({
    mobile: 1,
    mobileL: 1,
    tablet: 2,
    laptop: 3,
    desktop: 4,
    desktopL: 4,
    ultraWide: 6,
    ...defaultColumns,
  });
  
  const columnWidth = useMemo(
    () => calculateColumnWidth(1, dimensions.width),
    [dimensions.width]
  );
  
  const getItemWidth = useCallback(
    (columnsToSpan: number = 1, includeGutter: boolean = true) => {
      return calculateColumnWidth(columnsToSpan, dimensions.width, includeGutter);
    },
    [dimensions.width]
  );
  
  return {
    columns,
    columnWidth,
    getItemWidth,
    gutter: gridConfig.gutter,
    margin: gridConfig.margin,
  };
};

// Hook for orientation changes
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    getScreenDimensions().isPortrait ? 'portrait' : 'landscape'
  );
  
  useEffect(() => {
    const updateOrientation = ({ window }: { window: ScaledSize }) => {
      setOrientation(window.width > window.height ? 'landscape' : 'portrait');
    };
    
    const subscription = Dimensions.addEventListener('change', updateOrientation);
    return () => subscription?.remove();
  }, []);
  
  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
};

// Hook for screen metrics
export const useScreenMetrics = () => {
  const { dimensions, breakpoint } = useResponsive();
  const [metrics, setMetrics] = useState({
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    windowWidth: dimensions.width,
    windowHeight: dimensions.height,
    scale: 1,
    fontScale: 1,
  });
  
  useEffect(() => {
    const screen = Dimensions.get('screen');
    const window = Dimensions.get('window');
    
    setMetrics({
      screenWidth: screen.width,
      screenHeight: screen.height,
      windowWidth: window.width,
      windowHeight: window.height,
      scale: screen.scale || 1,
      fontScale: screen.fontScale || 1,
    });
  }, [dimensions]);
  
  const density = useMemo(() => {
    const scale = metrics.scale;
    if (scale <= 1) return 'mdpi';
    if (scale <= 1.5) return 'hdpi';
    if (scale <= 2) return 'xhdpi';
    if (scale <= 3) return 'xxhdpi';
    return 'xxxhdpi';
  }, [metrics.scale]);
  
  return {
    ...metrics,
    density,
    breakpoint,
    isHighDensity: metrics.scale >= 2,
  };
};

// Hook for adaptive layouts
export const useAdaptiveLayout = () => {
  const { layoutConfig, breakpoint, dimensions } = useResponsive();
  const [layoutMode, setLayoutMode] = useState<'stack' | 'drawer' | 'tabs'>('stack');
  
  useEffect(() => {
    if (layoutConfig.sidebar) {
      setLayoutMode('drawer');
    } else if (breakpoint === 'tablet') {
      setLayoutMode('tabs');
    } else {
      setLayoutMode('stack');
    }
  }, [layoutConfig, breakpoint]);
  
  const shouldShowSidebar = layoutConfig.sidebar;
  const navigationPosition = layoutConfig.navigation;
  const isCompact = dimensions.width < BREAKPOINTS.tablet;
  const isExpanded = dimensions.width >= BREAKPOINTS.laptop;
  
  return {
    layoutMode,
    shouldShowSidebar,
    navigationPosition,
    isCompact,
    isExpanded,
    columns: layoutConfig.columns,
    cardColumns: layoutConfig.cardColumns,
    analyticsColumns: layoutConfig.analyticsColumns,
  };
};

// Hook for responsive styles
export const useResponsiveStyles = () => {
  const {
    rDimension,
    rFontSize,
    rSpacing,
    responsive,
    breakpoint,
    dimensions,
  } = useResponsive();
  
  const styles = useMemo(() => ({
    // Padding helpers
    padding: {
      xs: rSpacing(4),
      sm: rSpacing(8),
      md: rSpacing(16),
      lg: rSpacing(24),
      xl: rSpacing(32),
      xxl: rSpacing(48),
    },
    
    // Margin helpers
    margin: {
      xs: rSpacing(4),
      sm: rSpacing(8),
      md: rSpacing(16),
      lg: rSpacing(24),
      xl: rSpacing(32),
      xxl: rSpacing(48),
    },
    
    // Font size helpers
    fontSize: {
      xs: rFontSize(10),
      sm: rFontSize(12),
      md: rFontSize(14),
      lg: rFontSize(16),
      xl: rFontSize(20),
      xxl: rFontSize(24),
      xxxl: rFontSize(32),
    },
    
    // Border radius helpers
    borderRadius: {
      sm: rDimension(4),
      md: rDimension(8),
      lg: rDimension(12),
      xl: rDimension(16),
      full: 9999,
    },
    
    // Shadow helpers
    shadow: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: rDimension(1) },
        shadowOpacity: 0.1,
        shadowRadius: rDimension(2),
        elevation: responsive({ mobile: 2, tablet: 3, desktop: 4 }),
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: rDimension(2) },
        shadowOpacity: 0.15,
        shadowRadius: rDimension(4),
        elevation: responsive({ mobile: 4, tablet: 6, desktop: 8 }),
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: rDimension(4) },
        shadowOpacity: 0.2,
        shadowRadius: rDimension(8),
        elevation: responsive({ mobile: 8, tablet: 12, desktop: 16 }),
      },
    },
  }), [rDimension, rFontSize, rSpacing, responsive]);
  
  return styles;
};

// Export all hooks
export default {
  useResponsive,
  useColumns,
  useOrientation,
  useScreenMetrics,
  useAdaptiveLayout,
  useResponsiveStyles,
};