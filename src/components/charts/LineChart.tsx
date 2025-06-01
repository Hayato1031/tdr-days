import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Svg, { G, Path, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

export interface LineChartData {
  x: string | number;
  y: number;
  label?: string;
}

export interface LineChartProps {
  data: LineChartData[];
  title: string;
  color?: string;
  showDots?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  height?: number;
  onPointPress?: (point: LineChartData, index: number) => void;
  animationDuration?: number;
  animationDelay?: number;
  showGradient?: boolean;
  strokeWidth?: number;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  color = colors.purple[500],
  showDots = true,
  showGrid = true,
  showLabels = true,
  height = 250,
  onPointPress,
  animationDuration = 1200,
  animationDelay = 0,
  showGradient = true,
  strokeWidth = 3,
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
  const pathAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  const chartWidth = screenWidth - spacing[5] * 4; // Account for container padding
  const chartHeight = height - 80; // Account for labels and padding
  const padding = 40;

  // Calculate chart bounds with safety checks
  const values = data.map(d => d.y).filter(y => typeof y === 'number' && !isNaN(y));
  const minY = values.length > 0 ? Math.min(...values) : 0;
  const maxY = values.length > 0 ? Math.max(...values) : 0;
  const yRange = maxY - minY || 1;

  useEffect(() => {
    // Reset animations
    pathAnim.setValue(0);
    fadeAnim.setValue(0);
    dotsAnim.setValue(0);

    // Start animations
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: animationDelay,
        useNativeDriver: false,
      }),
      Animated.timing(pathAnim, {
        toValue: 1,
        duration: animationDuration,
        delay: animationDelay + 200,
        useNativeDriver: false,
      }),
      Animated.timing(dotsAnim, {
        toValue: 1,
        duration: 600,
        delay: animationDelay + 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, [data, animationDelay, animationDuration]);

  // Convert data points to SVG coordinates
  const getPointCoordinates = (index: number, value: number) => {
    // Safety checks for invalid values
    if (typeof value !== 'number' || isNaN(value)) {
      value = 0;
    }
    
    const x = data.length > 1 
      ? padding + (index / (data.length - 1)) * (chartWidth - padding * 2)
      : chartWidth / 2; // Center single point
    const y = padding + ((maxY - value) / yRange) * (chartHeight - padding * 2);
    
    // Ensure coordinates are valid numbers
    return { 
      x: isNaN(x) ? chartWidth / 2 : x, 
      y: isNaN(y) ? chartHeight / 2 : y 
    };
  };

  // Create SVG path for the line
  const createPath = () => {
    if (data.length === 0) return '';

    let path = '';
    data.forEach((point, index) => {
      const { x, y } = getPointCoordinates(index, point.y);
      
      // Safety check for coordinates
      if (isNaN(x) || isNaN(y)) return;
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        // Use smooth curves
        const prevPoint = getPointCoordinates(index - 1, data[index - 1].y);
        const controlX = (prevPoint.x + x) / 2;
        
        // Safety check for control point
        if (!isNaN(controlX) && !isNaN(prevPoint.y)) {
          path += ` Q ${controlX} ${prevPoint.y} ${x} ${y}`;
        } else {
          path += ` L ${x} ${y}`;
        }
      }
    });

    return path;
  };

  // Create gradient area path
  const createGradientPath = () => {
    if (data.length === 0) return '';

    let path = createPath();
    
    // Close the path for gradient fill
    const lastPoint = getPointCoordinates(data.length - 1, data[data.length - 1].y);
    const firstPoint = getPointCoordinates(0, data[0].y);
    
    // Safety checks for closing coordinates
    if (!isNaN(lastPoint.x) && !isNaN(firstPoint.x)) {
      path += ` L ${lastPoint.x} ${chartHeight - padding}`;
      path += ` L ${firstPoint.x} ${chartHeight - padding}`;
      path += ' Z';
    }

    return path;
  };

  // Render grid lines
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridLines = 5;
    const yStep = (chartHeight - padding * 2) / gridLines;
    const xStep = (chartWidth - padding * 2) / Math.max(data.length - 1, 1);

    return (
      <G opacity={0.2}>
        {/* Horizontal grid lines */}
        {Array.from({ length: gridLines + 1 }).map((_, index) => {
          const y = padding + index * yStep;
          const value = maxY - (index * yRange) / gridLines;
          
          return (
            <G key={`h-${index}`}>
              <Line
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke={isDark ? '#374151' : '#d1d5db'} // gray-700 : gray-300
                strokeWidth={1}
              />
              {showLabels && (
                <SvgText
                  x={padding - 8}
                  y={y + 4}
                  fontSize="10"
                  fill={theme.colors.text.tertiary}
                  textAnchor="end"
                >
                  {Math.round(value).toLocaleString()}
                </SvgText>
              )}
            </G>
          );
        })}

        {/* Vertical grid lines */}
        {data.map((point, index) => {
          const x = padding + index * xStep;
          
          return (
            <G key={`v-${index}`}>
              <Line
                x1={x}
                y1={padding}
                x2={x}
                y2={chartHeight - padding}
                stroke={isDark ? '#374151' : '#d1d5db'} // gray-700 : gray-300
                strokeWidth={1}
              />
              {showLabels && index % Math.ceil(data.length / 6) === 0 && (
                <SvgText
                  x={x}
                  y={chartHeight - padding + 20}
                  fontSize="10"
                  fill={theme.colors.text.tertiary}
                  textAnchor="middle"
                >
                  {point.label || point.x}
                </SvgText>
              )}
            </G>
          );
        })}
      </G>
    );
  };

  // Render data points
  const renderDots = () => {
    if (!showDots) return null;

    return data.map((point, index) => {
      const { x, y } = getPointCoordinates(index, point.y);
      
      return (
        <TouchableOpacity
          key={index}
          onPress={() => onPointPress?.(point, index)}
          disabled={!onPointPress}
        >
          <AnimatedG opacity={dotsAnim}>
            <Circle
              cx={x}
              cy={y}
              r={6}
              fill={color}
              stroke={isDark ? '#111827' : '#f9fafb'} // gray-900 : gray-50
              strokeWidth={2}
            />
            <Circle
              cx={x}
              cy={y}
              r={3}
              fill={isDark ? '#111827' : '#f9fafb'} // gray-900 : gray-50
            />
          </AnimatedG>
        </TouchableOpacity>
      );
    });
  };

  const animatedPathLength = pathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1000], // Approximate path length
  });

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
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <SvgGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.1" />
              </SvgGradient>
            </Defs>

            {renderGrid()}

            {/* Gradient area */}
            {showGradient && (
              <AnimatedPath
                d={createGradientPath()}
                fill="url(#lineGradient)"
                opacity={pathAnim}
              />
            )}

            {/* Main line */}
            <AnimatedPath
              d={createPath()}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={[1000]}
              strokeDashoffset={animatedPathLength.interpolate({
                inputRange: [0, 1000],
                outputRange: [1000, 0],
              })}
            />

            {renderDots()}
          </Svg>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: color }]} />
            <Text style={[styles.legendText, { color: theme.colors.text.secondary }]}>
              {data.length} data points
            </Text>
          </View>
          
          <View style={styles.legendStats}>
            <Text style={[styles.legendStat, { color: theme.colors.text.tertiary }]}>
              Min: {minY.toLocaleString()}
            </Text>
            <Text style={[styles.legendStat, { color: theme.colors.text.tertiary }]}>
              Max: {maxY.toLocaleString()}
            </Text>
            <Text style={[styles.legendStat, { color: theme.colors.text.tertiary }]}>
              Avg: {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.y, 0) / data.length).toLocaleString() : '0'}
            </Text>
          </View>
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
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  legendStats: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  legendStat: {
    fontSize: 12,
  },
});