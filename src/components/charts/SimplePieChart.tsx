import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/theme';

export interface SimplePieChartData {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

export interface SimplePieChartProps {
  data: SimplePieChartData[];
  title: string;
  size?: number;
  showLegend?: boolean;
  onSegmentPress?: (segment: SimplePieChartData, index: number) => void;
}

export const SimplePieChart: React.FC<SimplePieChartProps> = ({
  data,
  title,
  size = 200,
  showLegend = true,
  onSegmentPress,
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  // Early return for invalid data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.card }]}>
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
          <Text style={[styles.emptyMessage, { color: theme.colors.text.secondary }]}>
            No data available
          </Text>
        </LinearGradient>
      </View>
    );
  }

  // Calculate total and percentages
  const total = data.reduce((sum, item) => {
    const value = typeof item.value === 'number' && !isNaN(item.value) ? item.value : 0;
    return sum + value;
  }, 0);
  
  const dataWithPercentages = data
    .filter(item => typeof item.value === 'number' && !isNaN(item.value) && item.value > 0)
    .map(item => ({
      ...item,
      value: Math.max(0, item.value),
      percentage: total > 0 ? (item.value / total) * 100 : 0,
    }));

  // Create pie segments using CSS-like approach
  const renderPieChart = () => {
    const radius = size / 2;
    const segments = [];
    let currentAngle = 0;

    dataWithPercentages.forEach((item, index) => {
      const percentage = item.percentage;
      const angle = (percentage / 100) * 360;
      
      // Use CSS conic-gradient approach with Views
      segments.push(
        <TouchableOpacity
          key={index}
          onPress={() => onSegmentPress?.(item, index)}
          disabled={!onSegmentPress}
          style={[
            styles.segment,
            {
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: item.color,
              transform: [
                { rotate: `${currentAngle}deg` },
              ],
            },
          ]}
        >
          {/* Segment slice using clip path simulation */}
          <View
            style={[
              styles.segmentSlice,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: item.color,
                // Use overflow hidden to create slice effect
              },
            ]}
          />
        </TouchableOpacity>
      );
      
      currentAngle += angle;
    });

    return segments;
  };

  // Render using simple colored bars instead of complex pie
  const renderSimpleBars = () => {
    return dataWithPercentages.map((item, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => onSegmentPress?.(item, index)}
        disabled={!onSegmentPress}
        style={[
          styles.barContainer,
          {
            backgroundColor: item.color,
            width: `${item.percentage}%`,
            minWidth: 60,
            height: 40,
            marginVertical: 4,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Text style={[styles.barText, { color: '#ffffff', fontWeight: '600' }]}>
          {item.label}
        </Text>
        <Text style={[styles.barPercentage, { color: '#ffffff', fontSize: 12 }]}>
          {item.percentage.toFixed(1)}%
        </Text>
      </TouchableOpacity>
    ));
  };

  // Render legend
  const renderLegend = () => {
    if (!showLegend) return null;

    return (
      <View style={styles.legend}>
        {dataWithPercentages.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.legendItem}
            onPress={() => onSegmentPress?.(item, index)}
            disabled={!onSegmentPress}
          >
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <View style={styles.legendText}>
              <Text style={[styles.legendLabel, { color: theme.colors.text.primary }]}>
                {item.label}
              </Text>
              <Text style={[styles.legendValue, { color: theme.colors.text.secondary }]}>
                {item.value.toLocaleString()} ({item.percentage.toFixed(1)}%)
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? theme.colors.background.secondary
            : theme.colors.background.card,
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

        <View style={styles.chartContainer}>
          {/* Use simple horizontal bars instead of complex pie chart */}
          <View style={styles.barsContainer}>
            {renderSimpleBars()}
          </View>
        </View>

        {renderLegend()}
      </LinearGradient>
    </View>
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
    paddingVertical: spacing[3],
  },
  barsContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  barContainer: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  barText: {
    fontSize: 14,
    fontWeight: '600',
  },
  barPercentage: {
    fontSize: 12,
    marginTop: 2,
  },
  segment: {
    // For potential future pie implementation
  },
  segmentSlice: {
    // For potential future pie implementation
  },
  legend: {
    gap: spacing[3],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: borderRadius.full,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing[0.5],
  },
  legendValue: {
    fontSize: 12,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing[4],
  },
});