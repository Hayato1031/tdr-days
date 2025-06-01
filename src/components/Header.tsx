// 統一感のある美しいヘッダーコンポーネント
// 全ページで使用する共通ヘッダー

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { useResponsive } from '../hooks/useResponsive';
import { DrawerMenu } from './DrawerMenu';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  variant?: 'default' | 'minimal' | 'hero';
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightComponent,
  variant = 'default'
}) => {
  const { theme, themeConfig } = useTheme();
  const { t } = useLanguage();
  const { rSpacing, rFontSize, isBreakpoint } = useResponsive();
  const [menuVisible, setMenuVisible] = useState(false);

  const isTabletOrLarger = isBreakpoint('tablet');
  const isHeroVariant = variant === 'hero';
  const isMinimalVariant = variant === 'minimal';

  return (
    <>
      <View style={[styles.container, { height: isHeroVariant ? 120 : 80 }]}>
        <LinearGradient
          colors={
            isMinimalVariant 
              ? [colors.background.primary, colors.background.secondary]
              : isHeroVariant
              ? [themeConfig.accentColor, themeConfig.accentColor + 'CC', themeConfig.accentColor + '99']
              : [colors.background.gradientPurple, colors.background.primary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Status Bar Spacer */}
          <View style={{ height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24 }} />
          
          {/* Header Content */}
          <View style={styles.content}>
            {/* Left Section */}
            <View style={styles.leftSection}>
              {showBackButton ? (
                <TouchableOpacity
                  style={[styles.iconButton, styles.backButton]}
                  onPress={onBackPress}
                >
                  <Ionicons 
                    name="arrow-back" 
                    size={24} 
                    color={isHeroVariant ? colors.utility.white : colors.text.primary} 
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setMenuVisible(true)}
                >
                  <Ionicons 
                    name="menu" 
                    size={24} 
                    color={isHeroVariant ? colors.utility.white : colors.text.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Center Section */}
            <View style={styles.centerSection}>
              <Text 
                style={[
                  styles.title,
                  {
                    fontSize: isHeroVariant ? rFontSize(22) : rFontSize(18),
                    color: isHeroVariant ? colors.utility.white : colors.text.primary,
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
                      color: isHeroVariant ? colors.utility.white + 'CC' : colors.text.secondary,
                    }
                  ]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              )}
            </View>

            {/* Right Section */}
            <View style={styles.rightSection}>
              {rightComponent || <View style={styles.iconButton} />}
            </View>
          </View>
        </LinearGradient>

        {/* Bottom Border for minimal variant */}
        {isMinimalVariant && (
          <View style={[styles.bottomBorder, { backgroundColor: colors.utility.border }]} />
        )}
      </View>

      {/* Drawer Menu */}
      <DrawerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1000,
  },
  gradient: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  leftSection: {
    width: 48,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rightSection: {
    width: 48,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  bottomBorder: {
    height: 1,
    width: '100%',
  },
});

export default Header;