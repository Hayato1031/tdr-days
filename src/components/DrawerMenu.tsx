// 美しいドロワーメニューコンポーネント
// ハンバーガーメニューから開くサイドメニュー

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { useResponsive } from '../hooks/useResponsive';
import { ParkType } from '../types/models';

const { width: screenWidth } = Dimensions.get('window');

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  iconLibrary?: 'Ionicons' | 'FontAwesome5';
  color: string;
  description?: string;
  onPress: () => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({ visible, onClose }) => {
  const { theme, themeConfig, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { rSpacing, rFontSize } = useResponsive();
  
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // メニューアイテム
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      title: t('nav.home'),
      icon: 'home',
      color: colors.purple.bright,
      description: 'メインダッシュボード',
      onPress: () => {
        // Navigation to Home
        onClose();
      }
    },
    {
      id: 'record',
      title: t('nav.record'),
      icon: 'add-circle',
      color: colors.green[500],
      description: '新しい来園を記録',
      onPress: () => {
        // Navigation to Record
        onClose();
      }
    },
    {
      id: 'analytics',
      title: t('nav.analytics'),
      icon: 'stats-chart',
      color: colors.blue[500],
      description: 'データ分析と統計',
      onPress: () => {
        // Navigation to Analytics
        onClose();
      }
    },
    {
      id: 'profile',
      title: t('nav.profile'),
      icon: 'person',
      color: colors.orange[500],
      description: 'プロフィールと設定',
      onPress: () => {
        // Navigation to Profile
        onClose();
      }
    },
  ];

  const quickActions: MenuItem[] = [
    {
      id: 'disneyland',
      title: t('home.tokyoDisneyland'),
      icon: 'fort-awesome',
      iconLibrary: 'FontAwesome5',
      color: colors.pink[500],
      description: '来園記録を追加',
      onPress: () => {
        // Quick record for Disneyland
        onClose();
      }
    },
    {
      id: 'disneysea',
      title: t('home.tokyoDisneysea'),
      icon: 'globe',
      iconLibrary: 'FontAwesome5',
      color: colors.teal[500],
      description: '来園記録を追加',
      onPress: () => {
        // Quick record for DisneySea
        onClose();
      }
    },
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -screenWidth,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleLanguageToggle = () => {
    const newLanguage = language === 'ja' ? 'en' : 'ja';
    setLanguage(newLanguage);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Drawer Content */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[colors.background.primary, colors.background.gradientPurple]}
          style={styles.drawerGradient}
        >
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.appInfo}>
              <View style={[styles.appIcon, { backgroundColor: themeConfig.accentColor }]}>
                <Ionicons name="castle" size={24} color={colors.utility.white} />
              </View>
              <View style={styles.appText}>
                <Text style={styles.appTitle}>TDR Days</Text>
                <Text style={styles.appSubtitle}>ディズニー来園記録</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Navigation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>メインメニュー</Text>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    {item.description && (
                      <Text style={styles.menuDescription}>{item.description}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>クイックアクション</Text>
              {quickActions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                    {item.iconLibrary === 'FontAwesome5' ? (
                      <FontAwesome5 name={item.icon as any} size={20} color={item.color} />
                    ) : (
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    )}
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    {item.description && (
                      <Text style={styles.menuDescription}>{item.description}</Text>
                    )}
                  </View>
                  <Ionicons name="add" size={16} color={colors.text.tertiary} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>設定</Text>
              
              {/* Theme Toggle */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={toggleTheme}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.purple.bright + '15' }]}>
                  <Ionicons 
                    name={theme.mode === 'dark' ? 'sunny' : 'moon'} 
                    size={20} 
                    color={colors.purple.bright} 
                  />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>
                    {theme.mode === 'dark' ? 'ライトモード' : 'ダークモード'}
                  </Text>
                  <Text style={styles.menuDescription}>テーマを切り替え</Text>
                </View>
              </TouchableOpacity>

              {/* Language Toggle */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleLanguageToggle}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.blue[500] + '15' }]}>
                  <Ionicons name="language" size={20} color={colors.blue[500]} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>
                    {language === 'ja' ? 'English' : '日本語'}
                  </Text>
                  <Text style={styles.menuDescription}>言語を切り替え</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Bottom Spacing */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: screenWidth * 0.85,
    maxWidth: 320,
    shadowColor: colors.effects.shadowMedium,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  drawerGradient: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.utility.borderLight,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appText: {
    flex: 1,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  appSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: colors.background.card,
    shadowColor: colors.effects.shadowSoft,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});

export default DrawerMenu;