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

export interface RankingItem {
  id: string;
  name: string;
  value: number;
  subtitle?: string;
  description?: string;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  trend?: 'up' | 'down' | 'neutral';
  badge?: string;
}

export interface TopRankingListProps {
  data: RankingItem[];
  title: string;
  maxValue?: number;
  showProgress?: boolean;
  showTrend?: boolean;
  showIcons?: boolean;
  limit?: number;
  onItemPress?: (item: RankingItem, index: number) => void;
  animationDuration?: number;
  animationDelay?: number;
  colors?: string[];
}

// Default color palette with additional colors
const defaultColorPalette = [
  colors.purple[500],
  '#3b82f6', // blue
  '#22c55e', // green
  '#facc15', // yellow
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#10b981', // emerald
];

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const TopRankingList: React.FC<TopRankingListProps> = ({
  data,
  title,
  maxValue,
  showProgress = true,
  showTrend = true,
  showIcons = true,
  limit = 10,
  onItemPress,
  animationDuration = 600,
  animationDelay = 0,
  colors: customColors = defaultColorPalette,
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const displayData = data.slice(0, limit);
  const itemAnimations = useRef<Animated.Value[]>([]).current;
  
  // Ensure animation array matches data length
  if (itemAnimations.length !== displayData.length) {
    itemAnimations.length = 0;
    displayData.forEach(() => {
      itemAnimations.push(new Animated.Value(0));
    });
  }

  const chartMaxValue = maxValue || (data.length > 0 ? Math.max(...data.map(item => item?.value || 0), 1) : 1);

  useEffect(() => {
    // Reset animations
    fadeAnim.setValue(0);
    itemAnimations.forEach(anim => anim.setValue(0));

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: animationDelay,
        useNativeDriver: false,
      }),
      Animated.stagger(
        80,
        itemAnimations.map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: animationDuration,
            delay: animationDelay + 200,
            useNativeDriver: false,
          })
        )
      ),
    ]).start();
  }, [data, limit, animationDelay, animationDuration]);

  // Get ranking position styles
  const getRankingStyles = (index: number) => {
    const position = index + 1;
    
    switch (position) {
      case 1:
        return {
          backgroundColor: '#ffd700', // gold
          textColor: colors.text.dark.primary,
          icon: 'trophy',
          size: 'large',
        };
      case 2:
        return {
          backgroundColor: '#94a3b8', // gray-400
          textColor: colors.text.dark.primary,
          icon: 'medal',
          size: 'medium',
        };
      case 3:
        return {
          backgroundColor: '#cd7c0f', // bronze
          textColor: colors.text.dark.primary,
          icon: 'medal',
          size: 'medium',
        };
      default:
        return {
          backgroundColor: theme.colors.background.elevated,
          textColor: theme.colors.text.primary,
          icon: 'bar-chart',
          size: 'small',
        };
    }
  };

  // Get progress bar width
  const getProgressWidth = (value: number) => {
    if (!value || !chartMaxValue || chartMaxValue === 0) return 0;
    return Math.min(100, Math.max(0, (value / chartMaxValue) * 100));
  };

  // Get trend icon and color
  const getTrendInfo = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return {
          icon: 'trending-up' as keyof typeof Ionicons.glyphMap,
          color: colors.semantic.success.main,
        };
      case 'down':
        return {
          icon: 'trending-down' as keyof typeof Ionicons.glyphMap,
          color: colors.semantic.error.main,
        };
      default:
        return {
          icon: 'remove' as keyof typeof Ionicons.glyphMap,
          color: theme.colors.text.tertiary,
        };
    }
  };

  // Render ranking item
  const renderItem = (item: RankingItem, index: number) => {
    if (!item || index >= itemAnimations.length) {
      return null;
    }
    
    const rankingStyle = getRankingStyles(index);
    const itemColor = item.color || customColors[index % customColors.length];
    const progressWidth = getProgressWidth(item.value || 0);
    const trendInfo = getTrendInfo(item.trend);
    
    const animatedOpacity = itemAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const animatedTranslateX = itemAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    const animatedProgressWidth = itemAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, progressWidth],
    });

    const ItemContent = () => (
      <View style={styles.itemContent}>
        {/* Ranking number and icon */}
        <View style={styles.rankingContainer}>
          <LinearGradient
            colors={
              index < 3
                ? [rankingStyle.backgroundColor, `${rankingStyle.backgroundColor}CC`]
                : [itemColor, `${itemColor}CC`]
            }
            style={[
              styles.rankingBadge,
              rankingStyle.size === 'large' && styles.rankingBadgeLarge,
              rankingStyle.size === 'medium' && styles.rankingBadgeMedium,
            ]}
          >
            {showIcons && index < 3 ? (
              <Ionicons
                name={rankingStyle.icon as keyof typeof Ionicons.glyphMap}
                size={rankingStyle.size === 'large' ? 20 : 16}
                color={rankingStyle.textColor}
              />
            ) : (
              <Text
                style={[
                  styles.rankingNumber,
                  {
                    color: index < 3 ? rankingStyle.textColor : colors.text.dark.primary,
                    fontSize: rankingStyle.size === 'large' ? 16 : 14,
                  },
                ]}
              >
                {index + 1}
              </Text>
            )}
          </LinearGradient>
        </View>

        {/* Item details */}
        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <Text
              style={[
                styles.itemName,
                {
                  color: theme.colors.text.primary,
                  fontSize: index < 3 ? 16 : 15,
                  fontWeight: index < 3 ? '600' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            
            {item.badge && (
              <View style={[styles.badge, { backgroundColor: `${itemColor}20` }]}>
                <Text style={[styles.badgeText, { color: itemColor }]}>
                  {item.badge}
                </Text>
              </View>
            )}
          </View>

          {item.subtitle && (
            <Text
              style={[styles.itemSubtitle, { color: theme.colors.text.secondary }]}
              numberOfLines={1}
            >
              {item.subtitle}
            </Text>
          )}

          {item.description && (
            <Text
              style={[styles.itemDescription, { color: theme.colors.text.tertiary }]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          )}

          {/* Progress bar */}
          {showProgress && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: isDark ? colors.gray[700] : colors.gray[200] },
                ]}
              >
                <AnimatedView
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: itemColor,
                      width: animatedProgressWidth.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              
              <Text style={[styles.progressValue, { color: theme.colors.text.secondary }]}>
                {item.value.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Trend and value */}
        <View style={styles.itemMeta}>
          {showTrend && item.trend && (
            <View style={styles.trendContainer}>
              <Ionicons
                name={trendInfo.icon}
                size={14}
                color={trendInfo.color}
              />
            </View>
          )}
          
          {!showProgress && (
            <Text
              style={[
                styles.itemValue,
                {
                  color: theme.colors.text.primary,
                  fontSize: index < 3 ? 18 : 16,
                  fontWeight: index < 3 ? '700' : '600',
                },
              ]}
            >
              {item.value.toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    );

    if (onItemPress) {
      return (
        <AnimatedTouchableOpacity
          key={item.id}
          style={[
            styles.itemContainer,
            {
              backgroundColor: isDark
                ? theme.colors.background.elevated
                : theme.colors.background.primary,
              opacity: animatedOpacity,
              transform: [{ translateX: animatedTranslateX }],
            },
          ]}
          onPress={() => onItemPress(item, index)}
          activeOpacity={0.7}
        >
          <ItemContent />
        </AnimatedTouchableOpacity>
      );
    }

    return (
      <AnimatedView
        key={item.id}
        style={[
          styles.itemContainer,
          {
            backgroundColor: isDark
              ? theme.colors.background.elevated
              : theme.colors.background.primary,
            opacity: animatedOpacity,
            transform: [{ translateX: animatedTranslateX }],
          },
        ]}
      >
        <ItemContent />
      </AnimatedView>
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

        <View style={styles.listContainer}>
          <View style={styles.list}>
            {displayData.map(renderItem).filter(Boolean)}
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
    flex: 1,
    padding: spacing[5],
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  listContainer: {
    // Fixed height container instead of flex for non-scrollable content
  },
  list: {
    gap: spacing[3],
  },
  itemContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  rankingContainer: {
    alignItems: 'center',
  },
  rankingBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankingBadgeLarge: {
    width: 40,
    height: 40,
  },
  rankingBadgeMedium: {
    width: 36,
    height: 36,
  },
  rankingNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemDetails: {
    flex: 1,
    gap: spacing[1],
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.pill,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 11,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.pill,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  itemMeta: {
    alignItems: 'center',
    gap: spacing[1],
  },
  trendContainer: {
    padding: spacing[1],
  },
  itemValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 50,
  },
});