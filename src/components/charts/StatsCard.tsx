import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { colors } from '../../styles/colors';
import { spacing, borderRadius } from '../../styles/theme';

export interface StatsCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  onPress?: () => void;
  animationDelay?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  previousValue,
  icon,
  color = colors.purple[500],
  trend,
  subtitle,
  onPress,
  animationDelay = 0,
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  // Remove animations entirely for stability
  // const scaleAnim = useRef(new Animated.Value(1)).current;
  // const fadeAnim = useRef(new Animated.Value(1)).current;
  // const slideAnim = useRef(new Animated.Value(0)).current;

  // Calculate percentage change
  const calculateChange = () => {
    if (!previousValue || !value) return null;
    
    const current = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const previous = typeof previousValue === 'string' ? parseFloat(previousValue) || 0 : previousValue;
    
    if (previous === 0) return null;
    
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    };
  };

  const change = calculateChange();
  const trendDirection = trend || change?.direction || 'neutral';

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return colors.semantic.success.main;
      case 'down':
        return colors.semantic.error.main;
      default:
        return theme.colors.text.tertiary;
    }
  };

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const CardContent = () => (
    <LinearGradient
      colors={[
        `${color}08`,
        `${color}04`,
        'transparent'
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons
            name={icon}
            size={24}
            color={color}
          />
        </View>
        
        {(change || trend) && (
          <View style={[styles.trendContainer, { backgroundColor: `${getTrendColor()}15` }]}>
            <Ionicons
              name={getTrendIcon()}
              size={12}
              color={getTrendColor()}
            />
            {change && (
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {change.percentage}%
              </Text>
            )}
          </View>
        )}
      </View>

      <View>
        <Text style={[styles.value, { color: theme.colors.text.primary }]}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        
        <Text style={[styles.title, { color: theme.colors.text.secondary }]}>
          {title}
        </Text>
        
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.colors.text.tertiary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </LinearGradient>
  );

  const cardStyle = [
    styles.container,
    {
      backgroundColor: isDark
        ? theme.colors.background.secondary
        : theme.colors.background.elevated,
    },
  ];

  if (onPress) {
    return (
      <View style={cardStyle}>
        <TouchableOpacity
          onPress={onPress}
          style={styles.touchable}
          activeOpacity={0.7}
        >
          <CardContent />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={cardStyle}>
      <CardContent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    minHeight: 140,
  },
  touchable: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    padding: spacing[4],
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.pill,
    gap: spacing[1],
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacing[1],
    lineHeight: 36,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing[0.5],
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
});