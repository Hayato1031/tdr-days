import React, { ReactNode, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
  Animated,
} from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../contexts/ThemeContext';

interface ResponsiveContainerProps extends Omit<ScrollViewProps, 'style'> {
  children: ReactNode;
  maxWidth?: number;
  padding?: boolean;
  scroll?: boolean;
  center?: boolean;
  fullHeight?: boolean;
  style?: ViewStyle;
  animated?: boolean;
  contentContainerStyle?: ViewStyle;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth,
  padding = true,
  scroll = true,
  center = true,
  fullHeight = false,
  style,
  animated = false,
  contentContainerStyle,
  ...scrollViewProps
}) => {
  const {
    dimensions,
    breakpoint,
    gridConfig,
    containerWidth,
    safeAreaPadding,
    rSpacing,
  } = useResponsive();
  const { theme } = useTheme();

  const containerStyles = useMemo<ViewStyle>(() => {
    const baseStyles: ViewStyle = {
      flex: fullHeight ? 1 : undefined,
      width: '100%',
      maxWidth: maxWidth || containerWidth,
      alignSelf: center ? 'center' : undefined,
    };

    if (padding) {
      baseStyles.paddingHorizontal = gridConfig.margin;
      baseStyles.paddingTop = safeAreaPadding.top;
      baseStyles.paddingBottom = safeAreaPadding.bottom;
    }

    return baseStyles;
  }, [
    fullHeight,
    maxWidth,
    containerWidth,
    center,
    padding,
    gridConfig.margin,
    safeAreaPadding,
  ]);

  const contentStyles = useMemo<ViewStyle>(() => {
    return {
      flexGrow: scroll ? 1 : undefined,
      paddingBottom: scroll && padding ? rSpacing(16) : undefined,
      ...contentContainerStyle,
    };
  }, [scroll, padding, rSpacing, contentContainerStyle]);

  const Container = animated ? Animated.View : View;
  const ScrollContainer = animated ? Animated.ScrollView : ScrollView;

  if (!scroll) {
    return (
      <Container style={[containerStyles, style]}>
        {children}
      </Container>
    );
  }

  return (
    <ScrollContainer
      style={[styles.scrollView, { backgroundColor: theme.colors.background.primary }]}
      contentContainerStyle={[containerStyles, contentStyles]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...scrollViewProps}
    >
      {children}
    </ScrollContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});

// Responsive Section Component
interface ResponsiveSectionProps {
  children: ReactNode;
  style?: ViewStyle;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveSection: React.FC<ResponsiveSectionProps> = ({
  children,
  style,
  spacing = 'md',
}) => {
  const { rSpacing } = useResponsive();
  
  const spacingValues = {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  return (
    <View
      style={[
        {
          marginBottom: rSpacing(spacingValues[spacing]),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Responsive Row Component
interface ResponsiveRowProps {
  children: ReactNode;
  style?: ViewStyle;
  wrap?: boolean;
  spacing?: number;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
}

export const ResponsiveRow: React.FC<ResponsiveRowProps> = ({
  children,
  style,
  wrap = true,
  spacing,
  align = 'stretch',
  justify = 'flex-start',
}) => {
  const { gridConfig } = useResponsive();
  
  const gap = spacing !== undefined ? spacing : gridConfig.gutter;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: wrap ? 'wrap' : 'nowrap',
          alignItems: align,
          justifyContent: justify,
          marginHorizontal: -gap / 2,
        },
        style,
      ]}
    >
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            paddingHorizontal: gap / 2,
            marginBottom: wrap ? gap : 0,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

// Responsive Column Component
interface ResponsiveColumnProps {
  children: ReactNode;
  style?: ViewStyle;
  span?: number;
  offset?: number;
}

export const ResponsiveColumn: React.FC<ResponsiveColumnProps> = ({
  children,
  style,
  span = 1,
  offset = 0,
}) => {
  const { dimensions, gridConfig } = useResponsive();
  
  const calculateColumnWidth = (columns: number) => {
    const availableWidth = dimensions.width - (gridConfig.margin * 2);
    const totalGutters = (gridConfig.columns - 1) * gridConfig.gutter;
    const columnWidth = (availableWidth - totalGutters) / gridConfig.columns;
    return Math.floor(columnWidth * columns + gridConfig.gutter * (columns - 1));
  };
  
  const width = calculateColumnWidth(span);
  const marginLeft = offset > 0 ? calculateColumnWidth(offset) + gridConfig.gutter : 0;

  return (
    <View
      style={[
        {
          width,
          marginLeft,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default ResponsiveContainer;