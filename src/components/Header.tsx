// 統一感のある美しいヘッダーコンポーネント
// 全ページで使用する共通ヘッダー

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { useResponsive } from '../hooks/useResponsive';

interface HeaderAction {
  icon: string;
  onPress: () => void;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  rightActions?: HeaderAction[];
  variant?: 'default' | 'minimal' | 'hero';
  onMenuOpen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightComponent,
  rightActions,
  variant = 'default',
  onMenuOpen
}) => {
  const { theme, themeConfig } = useTheme();
  const { t } = useLanguage();
  const { rSpacing, rFontSize, isBreakpoint } = useResponsive();

  const isTabletOrLarger = isBreakpoint('tablet');
  const isHeroVariant = variant === 'hero';
  const isMinimalVariant = variant === 'minimal';

  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
  const headerHeight = statusBarHeight + 60; // Fixed height calculation

  return (
    <>
      <View style={[styles.container, { height: headerHeight }]}>
        {/* Beautiful Background Gradient */}
        <LinearGradient
          colors={['#fefbff', '#f8f4ff', '#f3e8ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Floating Decorative Elements */}
          <View style={styles.decorativeElements}>
            <View style={[styles.floatingDot, { top: statusBarHeight + 10, right: 30, backgroundColor: colors.purple[200] + '30' }]} />
            <View style={[styles.floatingDot, { top: statusBarHeight + 20, right: 80, backgroundColor: colors.pink[200] + '30' }]} />
            <View style={[styles.floatingDot, { top: statusBarHeight + 30, right: 50, backgroundColor: colors.blue[200] + '30' }]} />
          </View>

          {/* Status Bar Spacer */}
          <View style={{ height: statusBarHeight }} />
          
          {/* Header Content */}
          <View style={styles.content}>
            {/* Left Section - Beautiful Glass Button */}
            <View style={styles.leftSection}>
              {showBackButton ? (
                <TouchableOpacity
                  style={styles.modernButton}
                  onPress={onBackPress}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      theme.mode === 'dark' 
                        ? ['rgba(45, 45, 45, 0.95)', 'rgba(30, 30, 30, 0.85)']
                        : ['rgba(255, 255, 255, 0.95)', 'rgba(250, 250, 250, 0.85)']
                    }
                    style={styles.modernButtonGradient}
                  >
                    <View style={[
                      styles.modernButtonInner,
                      {
                        backgroundColor: theme.mode === 'dark' 
                          ? 'rgba(40, 40, 40, 0.98)' 
                          : 'rgba(255, 255, 255, 0.98)',
                        borderColor: theme.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.08)',
                      }
                    ]}>
                      <Ionicons 
                        name="arrow-back" 
                        size={20} 
                        color={theme.mode === 'dark' ? colors.gray[300] : colors.gray[700]} 
                      />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.modernButton}
                  onPress={() => onMenuOpen?.()}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      theme.mode === 'dark' 
                        ? ['rgba(45, 45, 45, 0.95)', 'rgba(30, 30, 30, 0.85)']
                        : ['rgba(255, 255, 255, 0.95)', 'rgba(250, 250, 250, 0.85)']
                    }
                    style={styles.modernButtonGradient}
                  >
                    <View style={[
                      styles.modernButtonInner,
                      {
                        backgroundColor: theme.mode === 'dark' 
                          ? 'rgba(40, 40, 40, 0.98)' 
                          : 'rgba(255, 255, 255, 0.98)',
                        borderColor: theme.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.08)',
                      }
                    ]}>
                      <Ionicons 
                        name="menu" 
                        size={20} 
                        color={theme.mode === 'dark' ? colors.gray[300] : colors.gray[700]} 
                      />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Center Section - Enhanced Typography */}
            <View style={styles.centerSection}>
              <Text 
                style={[
                  styles.title,
                  {
                    fontSize: rFontSize(20),
                    color: colors.gray[800],
                    fontWeight: '700',
                    letterSpacing: 0.3,
                  }
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle && (
                <Text 
                  style={[
                    styles.subtitle,
                    {
                      fontSize: rFontSize(14),
                      color: colors.gray[600],
                      marginTop: 2,
                    }
                  ]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              )}
            </View>

            {/* Right Section - Glass Action Buttons */}
            <View style={styles.rightSection}>
              {rightComponent ? (
                rightComponent
              ) : rightActions && rightActions.length > 0 ? (
                <View style={styles.rightActions}>
                  {rightActions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.modernButton, { marginLeft: index > 0 ? 8 : 0 }]}
                      onPress={action.onPress}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={
                          theme.mode === 'dark' 
                            ? ['rgba(45, 45, 45, 0.95)', 'rgba(30, 30, 30, 0.85)']
                            : ['rgba(255, 255, 255, 0.95)', 'rgba(250, 250, 250, 0.85)']
                        }
                        style={styles.modernButtonGradient}
                      >
                        <View style={[
                          styles.modernButtonInner,
                          {
                            backgroundColor: theme.mode === 'dark' 
                              ? 'rgba(40, 40, 40, 0.98)' 
                              : 'rgba(255, 255, 255, 0.98)',
                            borderColor: theme.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.1)'
                              : 'rgba(0, 0, 0, 0.08)',
                          }
                        ]}>
                          <Ionicons 
                            name={action.icon as any} 
                            size={18} 
                            color={theme.mode === 'dark' ? colors.gray[300] : colors.gray[700]} 
                          />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ width: 44 }} />
              )}
            </View>
          </View>

          {/* Beautiful Bottom Shadow */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.05)']}
            style={styles.bottomShadow}
            pointerEvents="none"
          />
        </LinearGradient>

        {/* Elegant Bottom Border */}
        <View style={[
          styles.bottomBorder, 
          { 
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            height: 1,
          }
        ]} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradient: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  floatingDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  content: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 0,
  },
  leftSection: {
    width: 52,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rightSection: {
    minWidth: 52,
    alignItems: 'flex-end',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  modernButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    padding: 1.5,
  },
  modernButtonInner: {
    flex: 1,
    borderRadius: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  glassButtonGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 0,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButton: {
    // Additional styling for back button if needed
  },
  title: {
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  subtitle: {
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
  },
  bottomBorder: {
    width: '100%',
  },
});

export default Header;