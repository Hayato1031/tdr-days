import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
  description?: string;
}

export interface BarChartProps {
  data: BarChartData[];
  title: string;
  orientation?: 'vertical' | 'horizontal';
  maxValue?: number;
  showValues?: boolean;
  showGrid?: boolean;
  barColors?: string[];
  onBarPress?: (item: BarChartData, index: number) => void;
  animationDuration?: number;
  animationDelay?: number;
  height?: number;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  orientation = 'vertical',
  maxValue,
  showValues = true,
  showGrid = true,
  barColors = [
    colors.purple[500],
    '#3b82f6', // blue
    '#22c55e', // green
    '#facc15', // yellow
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
  ],
  onBarPress,
  animationDuration = 800,
  animationDelay = 0,
  height = 250,
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  // Early return for invalid data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.card }]}>
        <LinearGradient colors={['rgba(168, 85, 247, 0.03)', 'rgba(147, 51, 234, 0.02)', 'transparent']} style={styles.gradient}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>{title}</Text>
          <Text style={[styles.title, { color: theme.colors.text.secondary, fontSize: 14 }]}>No data available</Text>
        </LinearGradient>
      </View>
    );
  }
  
  // Animation values
  const animatedValues = useRef(
    data.map(() => new Animated.Value(0))
  ).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Calculate max value with safety checks
  const validValues = data.map(item => item.value).filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
  const chartMaxValue = maxValue || (validValues.length > 0 ? Math.max(...validValues) : 1);
  const chartWidth = screenWidth - spacing[5] * 2 - spacing[5] * 2; // Account for container padding

  useEffect(() => {
    // Reset animations when data changes
    animatedValues.forEach(anim => anim.setValue(0));
    fadeAnim.setValue(0);

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: animationDelay,
        useNativeDriver: false,
      }),
      Animated.stagger(
        50,
        animatedValues.map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: animationDuration,
            delay: animationDelay + 200,
            useNativeDriver: false,
          })
        )
      ),
    ]).start();
  }, [data, animationDelay, animationDuration]);

  const renderVerticalBar = (item: BarChartData, index: number) => {
    // Safety checks for item values
    const safeValue = typeof item.value === 'number' && !isNaN(item.value) ? Math.max(0, item.value) : 0;
    
    const barWidth = (chartWidth - spacing[2] * (data.length - 1)) / data.length;
    const maxBarHeight = height - 60; // Account for labels
    const barHeight = chartMaxValue > 0 ? (safeValue / chartMaxValue) * maxBarHeight : 0;
    const color = item.color || barColors[index % barColors.length];

    const animatedHeight = animatedValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, barHeight],
    });

    const animatedOpacity = animatedValues[index].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.7, 1],
    });

    return (
      <TouchableOpacity
        key={index}
        style={[styles.barContainer, { width: barWidth }]}
        onPress={() => onBarPress?.(item, index)}
        disabled={!onBarPress}
      >
        <View style={[styles.verticalBarWrapper, { height: maxBarHeight }]}>
          {showValues && (
            <Animated.Text
              style={[
                styles.barValue,
                {
                  color: theme.colors.text.primary,
                  opacity: animatedOpacity,
                  marginBottom: spacing[1],
                },
              ]}
            >
              {safeValue.toLocaleString()}
            </Animated.Text>
          )}
          
          <AnimatedView
            style={[
              styles.verticalBar,
              {
                height: animatedHeight,
                backgroundColor: color,
                opacity: animatedOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={[`${color}FF`, `${color}CC`, `${color}99`]}
              style={styles.barGradient}
            />
          </AnimatedView>
        </View>
        
        <Text
          style={[
            styles.barLabel,
            { color: theme.colors.text.secondary },
          ]}
          numberOfLines={2}
        >
          {item.label}
        </Text>
        
        {item.description && (
          <Text
            style={[
              styles.barDescription,
              { color: theme.colors.text.tertiary },
            ]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderHorizontalBar = (item: BarChartData, index: number) => {
    // Safety checks for item values
    const safeValue = typeof item.value === 'number' && !isNaN(item.value) ? Math.max(0, item.value) : 0;
    
    const barHeight = 32;
    const maxBarWidth = chartWidth - 100; // Account for labels
    const barWidth = chartMaxValue > 0 ? (safeValue / chartMaxValue) * maxBarWidth : 0;
    const color = item.color || barColors[index % barColors.length];

    const animatedWidth = animatedValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, barWidth],
    });

    const animatedOpacity = animatedValues[index].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.7, 1],
    });

    return (
      <TouchableOpacity
        key={index}
        style={styles.horizontalBarContainer}
        onPress={() => onBarPress?.(item, index)}
        disabled={!onBarPress}
      >
        <View style={styles.horizontalBarLabelContainer}>
          <Text
            style={[
              styles.horizontalBarLabel,
              { color: theme.colors.text.primary },
            ]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
          {item.description && (
            <Text
              style={[
                styles.horizontalBarDescription,
                { color: theme.colors.text.tertiary },
              ]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          )}
        </View>
        
        <View style={styles.horizontalBarWrapper}>
          <AnimatedView
            style={[
              styles.horizontalBar,
              {
                width: animatedWidth,
                height: barHeight,
                backgroundColor: color,
                opacity: animatedOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={[`${color}FF`, `${color}CC`, `${color}99`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.barGradient}
            />
          </AnimatedView>
          
          {showValues && (
            <Animated.Text
              style={[
                styles.horizontalBarValue,
                {
                  color: theme.colors.text.primary,
                  opacity: animatedOpacity,
                },
              ]}
            >
              {safeValue.toLocaleString()}
            </Animated.Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderGrid = () => {
    if (!showGrid || orientation === 'horizontal') return null;

    const gridLines = 5;
    const gridHeight = height - 60;
    const gridStep = gridHeight / gridLines;

    return (
      <View style={[styles.grid, { height: gridHeight }]}>
        {Array.from({ length: gridLines + 1 }).map((_, index) => {
          const value = (chartMaxValue / gridLines) * (gridLines - index);
          return (
            <View
              key={index}
              style={[
                styles.gridLine,
                {
                  top: index * gridStep,
                  borderTopColor: theme.colors.border.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.gridValue,
                  { color: theme.colors.text.tertiary },
                ]}
              >
                {Math.round(value).toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? theme.colors.background.secondary
            : theme.colors.background.elevated,
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={[
          'rgba(168, 85, 247, 0.03)',
          'rgba(147, 51, 234, 0.02)',
          'transparent',
        ]}
        style={styles.gradient}
      >
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {title}
        </Text>

        <View style={[styles.chartContainer, { height }]}>
          {renderGrid()}
          
          {orientation === 'vertical' ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.verticalChart}
            >
              <View style={styles.barsContainer}>
                {data.map(renderVerticalBar)}
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.horizontalChart}
            >
              <View style={styles.horizontalBarsContainer}>
                {data.map(renderHorizontalBar)}
              </View>
            </ScrollView>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginVertical: spacing[2],
  },
  gradient: {
    padding: spacing[5],
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  chartContainer: {
    position: 'relative',
  },
  grid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    opacity: 0.3,
  },
  gridValue: {
    fontSize: 10,
    position: 'absolute',
    left: -30,
    top: -6,
  },
  verticalChart: {
    flex: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    paddingHorizontal: spacing[2],
    paddingTop: spacing[4],
  },
  barContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  verticalBarWrapper: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  verticalBar: {
    borderRadius: borderRadius.md,
    minHeight: 4,
  },
  barGradient: {
    flex: 1,
    borderRadius: borderRadius.md,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing[2],
  },
  barDescription: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing[1],
  },
  horizontalChart: {
    flex: 1,
  },
  horizontalBarsContainer: {
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  horizontalBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  horizontalBarLabelContainer: {
    width: 80,
  },
  horizontalBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  horizontalBarDescription: {
    fontSize: 10,
    marginTop: spacing[0.5],
  },
  horizontalBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  horizontalBar: {
    borderRadius: borderRadius.sm,
    minWidth: 4,
  },
  horizontalBarValue: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
  },
});