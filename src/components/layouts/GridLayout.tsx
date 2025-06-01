import React, { ReactNode, useMemo } from 'react';
import {
  View,
  ViewStyle,
  FlatList,
  Dimensions,
  ListRenderItem,
  FlatListProps,
  StyleSheet,
} from 'react-native';
import { useColumns, useResponsive } from '../../hooks/useResponsive';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';

interface GridLayoutProps<T = any> extends Omit<FlatListProps<T>, 'renderItem' | 'numColumns'> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columns?: Partial<Record<'mobile' | 'mobileL' | 'tablet' | 'laptop' | 'desktop' | 'desktopL' | 'ultraWide', number>>;
  spacing?: number;
  animated?: boolean;
  staggered?: boolean;
  aspectRatio?: number;
  style?: ViewStyle;
}

export function GridLayout<T = any>({
  data,
  renderItem,
  columns: customColumns,
  spacing,
  animated = true,
  staggered = false,
  aspectRatio,
  style,
  ...flatListProps
}: GridLayoutProps<T>) {
  const { columns, gutter } = useColumns(customColumns);
  const { dimensions, animationDuration } = useResponsive();
  
  const gridSpacing = spacing !== undefined ? spacing : gutter;
  const animationProgress = useSharedValue(0);

  // Calculate item dimensions
  const itemDimensions = useMemo(() => {
    const availableWidth = dimensions.width - (gridSpacing * (columns + 1));
    const itemWidth = availableWidth / columns;
    const itemHeight = aspectRatio ? itemWidth / aspectRatio : undefined;
    
    return { width: itemWidth, height: itemHeight };
  }, [dimensions.width, columns, gridSpacing, aspectRatio]);

  // Animate on column change
  useAnimatedReaction(
    () => columns,
    (current, previous) => {
      if (previous !== undefined && current !== previous) {
        animationProgress.value = 0;
        animationProgress.value = withSpring(1, {
          damping: 20,
          stiffness: 90,
        });
      }
    }
  );

  const renderGridItem: ListRenderItem<T> = ({ item, index }) => {
    const content = renderItem(item, index);
    
    if (!animated) {
      return (
        <View
          style={[
            styles.gridItem,
            {
              width: itemDimensions.width,
              height: itemDimensions.height,
              marginLeft: gridSpacing / 2,
              marginRight: gridSpacing / 2,
              marginBottom: gridSpacing,
            },
          ]}
        >
          {content}
        </View>
      );
    }

    return (
      <AnimatedGridItem
        index={index}
        width={itemDimensions.width}
        height={itemDimensions.height}
        spacing={gridSpacing}
        staggered={staggered}
        animationProgress={animationProgress}
        duration={animationDuration()}
      >
        {content}
      </AnimatedGridItem>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderGridItem}
      numColumns={columns}
      key={`grid-${columns}`} // Force re-render on column change
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      contentContainerStyle={[
        {
          paddingHorizontal: gridSpacing / 2,
          paddingTop: gridSpacing,
        },
        flatListProps.contentContainerStyle,
      ]}
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      {...flatListProps}
    />
  );
}

// Animated Grid Item Component
interface AnimatedGridItemProps {
  children: ReactNode;
  index: number;
  width: number;
  height?: number;
  spacing: number;
  staggered: boolean;
  animationProgress: Animated.SharedValue<number>;
  duration: number;
}

const AnimatedGridItem: React.FC<AnimatedGridItemProps> = ({
  children,
  index,
  width,
  height,
  spacing,
  staggered,
  animationProgress,
  duration,
}) => {
  const delay = staggered ? index * 50 : 0;
  
  const animatedStyle = useAnimatedStyle(() => {
    const progress = animationProgress.value;
    
    const scale = interpolate(
      progress,
      [0, 1],
      [0.8, 1]
    );
    
    const opacity = interpolate(
      progress,
      [0, 1],
      [0, 1]
    );
    
    const translateY = interpolate(
      progress,
      [0, 1],
      [20, 0]
    );

    return {
      transform: [
        { scale: withSpring(scale, { damping: 15 }) },
        { translateY: withSpring(translateY, { damping: 15 }) },
      ],
      opacity: withSpring(opacity),
    };
  });

  return (
    <Animated.View
      style={[
        styles.gridItem,
        {
          width,
          height,
          marginLeft: spacing / 2,
          marginRight: spacing / 2,
          marginBottom: spacing,
        },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Masonry Grid Layout for variable height items
interface MasonryGridLayoutProps<T = any> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columns?: Partial<Record<'mobile' | 'mobileL' | 'tablet' | 'laptop' | 'desktop' | 'desktopL' | 'ultraWide', number>>;
  spacing?: number;
  style?: ViewStyle;
}

export function MasonryGridLayout<T = any>({
  data,
  renderItem,
  columns: customColumns,
  spacing,
  style,
}: MasonryGridLayoutProps<T>) {
  const { columns, gutter } = useColumns(customColumns);
  const { dimensions } = useResponsive();
  
  const gridSpacing = spacing !== undefined ? spacing : gutter;

  // Distribute items across columns
  const columnData = useMemo(() => {
    const cols: T[][] = Array(columns).fill(null).map(() => []);
    
    data.forEach((item, index) => {
      const columnIndex = index % columns;
      cols[columnIndex].push(item);
    });
    
    return cols;
  }, [data, columns]);

  const columnWidth = useMemo(() => {
    const availableWidth = dimensions.width - (gridSpacing * (columns + 1));
    return availableWidth / columns;
  }, [dimensions.width, columns, gridSpacing]);

  return (
    <View style={[styles.masonryContainer, style]}>
      <View style={[styles.row, { marginHorizontal: -gridSpacing / 2 }]}>
        {columnData.map((columnItems, columnIndex) => (
          <View
            key={`column-${columnIndex}`}
            style={{
              width: columnWidth,
              marginHorizontal: gridSpacing / 2,
            }}
          >
            {columnItems.map((item, index) => {
              const originalIndex = index * columns + columnIndex;
              return (
                <View
                  key={`item-${originalIndex}`}
                  style={{ marginBottom: gridSpacing }}
                >
                  {renderItem(item, originalIndex)}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  gridItem: {
    overflow: 'hidden',
  },
  masonryContainer: {
    flex: 1,
  },
});

export default GridLayout;