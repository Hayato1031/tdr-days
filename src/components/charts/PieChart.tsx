import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/theme';

export interface PieChartData {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

export interface PieChartProps {
  data: PieChartData[];
  title: string;
  size?: number;
  innerRadius?: number;
  showPercentages?: boolean;
  showLegend?: boolean;
  onSegmentPress?: (segment: PieChartData, index: number) => void;
  animationDuration?: number;
  animationDelay?: number;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  size = 200,
  innerRadius = 0,
  showPercentages = true,
  showLegend = true,
  onSegmentPress,
  animationDuration = 1000,
  animationDelay = 0,
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  // Early return for invalid data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.card }]}>
        <View style={styles.gradient}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {title}
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.colors.text.secondary }]}>
            No data available
          </Text>
        </View>
      </View>
    );
  }
  
  // Removed animation values to prevent interpolation errors

  // Calculate total and percentages with safety checks
  const total = data.reduce((sum, item) => {
    const value = typeof item.value === 'number' && !isNaN(item.value) ? item.value : 0;
    return sum + value;
  }, 0);
  
  const dataWithPercentages = data
    .filter(item => typeof item.value === 'number' && !isNaN(item.value) && item.value > 0)
    .map(item => ({
      ...item,
      value: Math.max(0, item.value), // Ensure positive values
      percentage: total > 0 ? (item.value / total) * 100 : 0,
    }));

  // Removed animation useEffect to avoid interpolation issues

  // Create SVG path for each segment with comprehensive safety checks
  const createPath = (startAngle: number, endAngle: number, radius: number) => {
    try {
      // Safety checks for NaN values and edge cases
      if (isNaN(startAngle) || isNaN(endAngle) || isNaN(radius) || 
          radius <= 0 || !isFinite(startAngle) || !isFinite(endAngle) || !isFinite(radius)) {
        return `M 0 0 L 0 0 Z`; // Return minimal safe path
      }

      // Additional angle validation
      if (Math.abs(endAngle - startAngle) < 0.01) {
        return `M 0 0 L 0 0 Z`; // Too small to render
      }

      const center = size / 2;
      
      // Clamp angles to prevent extreme values
      const clampedStartAngle = Math.max(-720, Math.min(720, startAngle));
      const clampedEndAngle = Math.max(-720, Math.min(720, endAngle));
      
      const startAngleRad = (clampedStartAngle - 90) * (Math.PI / 180);
      const endAngleRad = (clampedEndAngle - 90) * (Math.PI / 180);

      const x1 = center + radius * Math.cos(startAngleRad);
      const y1 = center + radius * Math.sin(startAngleRad);
      const x2 = center + radius * Math.cos(endAngleRad);
      const y2 = center + radius * Math.sin(endAngleRad);

      // Check for NaN and extreme values in calculated coordinates
      if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2) ||
          !isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2) ||
          Math.abs(x1) > 10000 || Math.abs(y1) > 10000 || 
          Math.abs(x2) > 10000 || Math.abs(y2) > 10000) {
        return `M 0 0 L 0 0 Z`;
      }

      const angleDiff = clampedEndAngle - clampedStartAngle;
      const largeArcFlag = Math.abs(angleDiff) <= 180 ? 0 : 1;

      // Format coordinates to avoid floating point precision issues
      const formatCoord = (coord: number) => Math.round(coord * 100) / 100;

      let path = `M ${formatCoord(center)} ${formatCoord(center)} L ${formatCoord(x1)} ${formatCoord(y1)} A ${formatCoord(radius)} ${formatCoord(radius)} 0 ${largeArcFlag} 1 ${formatCoord(x2)} ${formatCoord(y2)} Z`;

      // Add inner radius for donut chart
      if (innerRadius > 0 && !isNaN(innerRadius) && innerRadius < radius) {
        const ix1 = center + innerRadius * Math.cos(startAngleRad);
        const iy1 = center + innerRadius * Math.sin(startAngleRad);
        const ix2 = center + innerRadius * Math.cos(endAngleRad);
        const iy2 = center + innerRadius * Math.sin(endAngleRad);

        // Check for NaN in inner coordinates with additional validations
        if (!isNaN(ix1) && !isNaN(iy1) && !isNaN(ix2) && !isNaN(iy2) &&
            isFinite(ix1) && isFinite(iy1) && isFinite(ix2) && isFinite(iy2)) {
          path = `M ${formatCoord(x1)} ${formatCoord(y1)} A ${formatCoord(radius)} ${formatCoord(radius)} 0 ${largeArcFlag} 1 ${formatCoord(x2)} ${formatCoord(y2)} L ${formatCoord(ix2)} ${formatCoord(iy2)} A ${formatCoord(innerRadius)} ${formatCoord(innerRadius)} 0 ${largeArcFlag} 0 ${formatCoord(ix1)} ${formatCoord(iy1)} Z`;
        }
      }

      return path;
    } catch (error) {
      console.error('Error in createPath:', error);
      return `M 0 0 L 0 0 Z`; // Return safe fallback
    }
  };

  // Calculate positions for percentage labels with safety checks
  const getLabelPosition = (startAngle: number, endAngle: number) => {
    if (isNaN(startAngle) || isNaN(endAngle)) {
      return { x: 0, y: 0 };
    }

    const center = size / 2;
    const middleAngle = (startAngle + endAngle) / 2;
    const labelRadius = (size / 2 - innerRadius) / 2 + innerRadius;
    const angleRad = (middleAngle - 90) * (Math.PI / 180);

    const x = center + labelRadius * Math.cos(angleRad);
    const y = center + labelRadius * Math.sin(angleRad);

    return {
      x: isNaN(x) ? center : x,
      y: isNaN(y) ? center : y,
    };
  };

  // Render segments with safety checks
  const renderSegments = () => {
    if (total <= 0 || dataWithPercentages.length === 0) {
      return null; // Don't render anything if no valid data
    }

    let currentAngle = 0;

    return dataWithPercentages.map((item, index) => {
      // Safety checks for item values
      if (!item || typeof item.value !== 'number' || isNaN(item.value) || item.value <= 0) {
        return null;
      }

      const angle = (item.value / total) * 360;
      
      // Safety check for calculated angle
      if (isNaN(angle) || angle <= 0) {
        return null;
      }

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      // Create the segment path (no animation to avoid interpolation issues)
      const segmentPath = createPath(startAngle, endAngle, size / 2);
      
      // Validate path before rendering
      if (!segmentPath || segmentPath.includes('NaN') || segmentPath.includes('Infinity')) {
        console.warn('Invalid path generated, skipping segment:', { startAngle, endAngle, size });
        return null;
      }
      
      // Debug logging for visibility issues
      console.log('PieChart segment:', {
        index,
        item: item.label,
        value: item.value,
        color: item.color,
        angle,
        startAngle,
        endAngle,
        path: segmentPath.substring(0, 50) + '...'
      });

      const labelPos = getLabelPosition(startAngle, endAngle);
      
      currentAngle += angle;

      return (
        <G key={`segment-${index}`}>
          <TouchableOpacity
            onPress={() => onSegmentPress?.(item, index)}
            disabled={!onSegmentPress}
          >
            {/* Simple static path rendering - no animation to avoid interpolation errors */}
            <Path
              d={segmentPath}
              fill={item.color || '#9333ea'}
              stroke="#ffffff"
              strokeWidth={3}
              opacity={1}
            />
          </TouchableOpacity>
          
          {showPercentages && item.percentage > 5 && !isNaN(labelPos.x) && !isNaN(labelPos.y) && (
            <SvgText
              x={labelPos.x}
              y={labelPos.y}
              fontSize="16"
              fontWeight="700"
              fill="#ffffff"
              textAnchor="middle"
              alignmentBaseline="middle"
              stroke="#000000"
              strokeWidth={0.5}
            >
              {item.percentage.toFixed(0)}%
            </SvgText>
          )}
        </G>
      );
    }).filter(Boolean); // Remove null items
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
          <Svg 
            width={size} 
            height={size}
            viewBox={`0 0 ${size} ${size}`}
          >
            <G>
              {renderSegments()}
            </G>
            
            {/* Center total for donut charts */}
            {innerRadius > 0 && (
              <G>
                <SvgText
                  x={size / 2}
                  y={size / 2 - 8}
                  fontSize="24"
                  fontWeight="700"
                  fill={theme.colors.text.primary}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {total.toLocaleString()}
                </SvgText>
                <SvgText
                  x={size / 2}
                  y={size / 2 + 12}
                  fontSize="14"
                  fill={theme.colors.text.secondary}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  Total
                </SvgText>
              </G>
            )}
          </Svg>
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