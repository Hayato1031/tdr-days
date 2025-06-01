import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

export interface HeatMapData {
  date: Date;
  value: number;
  label?: string;
  description?: string;
}

export interface HeatMapProps {
  data: HeatMapData[];
  title: string;
  color?: string;
  maxValue?: number;
  showWeekdays?: boolean;
  showMonthLabels?: boolean;
  cellSize?: number;
  onCellPress?: (data: HeatMapData) => void;
  animationDuration?: number;
  animationDelay?: number;
  startDate?: Date;
  endDate?: Date;
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const HeatMap: React.FC<HeatMapProps> = ({
  data,
  title,
  color = colors.purple[500],
  maxValue,
  showWeekdays = true,
  showMonthLabels = true,
  cellSize = 16,
  onCellPress,
  animationDuration = 1000,
  animationDelay = 0,
  startDate,
  endDate,
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cellAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Calculate date range
  const now = new Date();
  const defaultStartDate = new Date(now.getFullYear(), 0, 1); // Start of year
  const defaultEndDate = new Date(now.getFullYear(), 11, 31); // End of year
  
  const chartStartDate = startDate || defaultStartDate;
  const chartEndDate = endDate || defaultEndDate;

  // Calculate maximum value for intensity
  const chartMaxValue = maxValue || Math.max(...data.map(d => d.value), 1);

  // Create data map for quick lookup
  const dataMap = new Map<string, HeatMapData>();
  data.forEach(item => {
    const dateKey = item.date.toISOString().split('T')[0];
    dataMap.set(dateKey, item);
  });

  useEffect(() => {
    // Initialize cell animations
    const cellKeys = Object.keys(cellAnimations);
    cellKeys.forEach(key => {
      cellAnimations[key].setValue(0);
    });

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: animationDelay,
        useNativeDriver: false,
      }),
      Animated.stagger(
        5,
        Object.values(cellAnimations).map(anim =>
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

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const grid: Array<Array<Date | null>> = [];
    const current = new Date(chartStartDate);
    
    // Start from the first Sunday of the week containing start date
    const startDayOfWeek = current.getDay();
    current.setDate(current.getDate() - startDayOfWeek);

    while (current <= chartEndDate) {
      const week: Array<Date | null> = [];
      
      for (let i = 0; i < 7; i++) {
        if (current >= chartStartDate && current <= chartEndDate) {
          week.push(new Date(current));
        } else {
          week.push(null);
        }
        current.setDate(current.getDate() + 1);
      }
      
      grid.push(week);
    }

    return grid;
  };

  // Get cell intensity based on value
  const getCellIntensity = (date: Date | null) => {
    if (!date) return 0;
    
    const dateKey = date.toISOString().split('T')[0];
    const cellData = dataMap.get(dateKey);
    
    if (!cellData) return 0;
    
    return cellData.value / chartMaxValue;
  };

  // Get cell color based on intensity
  const getCellColor = (intensity: number) => {
    if (intensity === 0) {
      return isDark ? '#1f2937' : '#f3f4f6'; // gray-800 : gray-100
    }
    
    const alpha = Math.max(0.1, intensity);
    return `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  };

  // Get animation value for cell
  const getCellAnimation = (date: Date | null) => {
    if (!date) return new Animated.Value(1);
    
    const dateKey = date.toISOString().split('T')[0];
    
    if (!cellAnimations[dateKey]) {
      cellAnimations[dateKey] = new Animated.Value(0);
    }
    
    return cellAnimations[dateKey];
  };

  // Render calendar cell
  const renderCell = (date: Date | null, weekIndex: number, dayIndex: number) => {
    if (!date) {
      return (
        <View
          key={`empty-${weekIndex}-${dayIndex}`}
          style={[styles.cell, { width: cellSize, height: cellSize }]}
        />
      );
    }

    const dateKey = date.toISOString().split('T')[0];
    const cellData = dataMap.get(dateKey);
    const intensity = getCellIntensity(date);
    const cellColor = getCellColor(intensity);
    const animation = getCellAnimation(date);

    const animatedScale = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    const animatedOpacity = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <AnimatedTouchableOpacity
        key={dateKey}
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: cellColor,
            transform: [{ scale: animatedScale }],
            opacity: animatedOpacity,
          },
        ]}
        onPress={() => cellData && onCellPress?.(cellData)}
        disabled={!cellData || !onCellPress}
        activeOpacity={0.7}
      >
        {cellData && cellData.value > 0 && (
          <View style={styles.cellContent}>
            <Text style={[styles.cellText, { color: intensity > 0.5 ? 'white' : theme.colors.text.primary }]}>
              {date.getDate()}
            </Text>
          </View>
        )}
      </AnimatedTouchableOpacity>
    );
  };

  // Render month labels
  const renderMonthLabels = () => {
    if (!showMonthLabels) return null;

    const grid = generateCalendarGrid();
    const monthLabels: Array<{ month: string; x: number }> = [];
    let currentMonth = -1;
    let weekIndex = 0;

    grid.forEach((week, index) => {
      const firstValidDate = week.find(date => date !== null);
      if (firstValidDate) {
        const month = firstValidDate.getMonth();
        if (month !== currentMonth) {
          monthLabels.push({
            month: months[month],
            x: index * (cellSize + 2),
          });
          currentMonth = month;
        }
      }
    });

    return (
      <View style={styles.monthLabels}>
        {monthLabels.map((label, index) => (
          <Text
            key={index}
            style={[
              styles.monthLabel,
              {
                color: theme.colors.text.secondary,
                left: label.x,
              },
            ]}
          >
            {label.month}
          </Text>
        ))}
      </View>
    );
  };

  // Render weekday labels
  const renderWeekdayLabels = () => {
    if (!showWeekdays) return null;

    return (
      <View style={styles.weekdayLabels}>
        {weekdays.map((day, index) => (
          <Text
            key={day}
            style={[
              styles.weekdayLabel,
              {
                color: theme.colors.text.tertiary,
                height: cellSize,
                lineHeight: cellSize,
              },
            ]}
          >
            {day}
          </Text>
        ))}
      </View>
    );
  };

  // Render intensity legend
  const renderLegend = () => {
    const intensityLevels = [0, 0.25, 0.5, 0.75, 1];

    return (
      <View style={styles.legend}>
        <Text style={[styles.legendLabel, { color: theme.colors.text.tertiary }]}>
          Less
        </Text>
        <View style={styles.legendColors}>
          {intensityLevels.map((intensity, index) => (
            <View
              key={index}
              style={[
                styles.legendCell,
                {
                  backgroundColor: getCellColor(intensity),
                  width: cellSize * 0.8,
                  height: cellSize * 0.8,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.legendLabel, { color: theme.colors.text.tertiary }]}>
          More
        </Text>
      </View>
    );
  };

  const grid = generateCalendarGrid();

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

        <View style={styles.chartContainer}>
          {renderMonthLabels()}
          
          <View style={styles.calendarContainer}>
            {renderWeekdayLabels()}
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.calendarScroll}
            >
              <View style={styles.calendar}>
                {grid.map((week, weekIndex) => (
                  <View key={weekIndex} style={styles.week}>
                    {week.map((date, dayIndex) => 
                      renderCell(date, weekIndex, dayIndex)
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {renderLegend()}
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
    gap: spacing[3],
  },
  monthLabels: {
    height: 20,
    position: 'relative',
    marginLeft: 40, // Account for weekday labels
  },
  monthLabel: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '500',
  },
  calendarContainer: {
    flexDirection: 'row',
  },
  weekdayLabels: {
    width: 40,
    gap: 2,
  },
  weekdayLabel: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  calendarScroll: {
    flex: 1,
  },
  calendar: {
    flexDirection: 'row',
    gap: 2,
  },
  week: {
    gap: 2,
  },
  cell: {
    borderRadius: borderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 8,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  legendLabel: {
    fontSize: 12,
  },
  legendColors: {
    flexDirection: 'row',
    gap: 2,
  },
  legendCell: {
    borderRadius: borderRadius.xs,
  },
});