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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
  const navigation = useNavigation();
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
      description: language === 'ja' ? 'メインダッシュボード' : 'Main Dashboard',
      onPress: () => {
        onClose();
        navigation.navigate('Home' as never);
      }
    },
    {
      id: 'visitList',
      title: language === 'ja' ? '来園記録' : 'Visit Records',
      icon: 'list',
      color: colors.purple[500],
      description: language === 'ja' ? '過去の来園記録を表示' : 'View past visit records',
      onPress: () => {
        onClose();
        navigation.navigate('VisitList' as never);
      }
    },
    {
      id: 'record',
      title: t('nav.record'),
      icon: 'add-circle',
      color: colors.green[500],
      description: language === 'ja' ? '新しい来園を記録' : 'Record new visit',
      onPress: () => {
        onClose();
        navigation.navigate('Record' as never);
      }
    },
    {
      id: 'analytics',
      title: t('nav.analytics'),
      icon: 'stats-chart',
      color: colors.blue[500],
      description: language === 'ja' ? 'データ分析と統計' : 'Data analysis & statistics',
      onPress: () => {
        onClose();
        navigation.navigate('Analytics' as never);
      }
    },
    {
      id: 'profile',
      title: t('nav.profile'),
      icon: 'person',
      color: colors.orange[500],
      description: language === 'ja' ? 'プロフィールと設定' : 'Profile & settings',
      onPress: () => {
        onClose();
        navigation.navigate('Profile' as never);
      }
    },
  ];

  // 今日の日付を日本時間で取得
  const getTodayInJST = () => {
    const now = new Date();
    const jstOffset = 9 * 60; // JST is UTC+9
    const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000));
    return jstTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const quickActions: MenuItem[] = [
    {
      id: 'disneyland',
      title: t('home.tokyoDisneyland'),
      icon: 'fort-awesome',
      iconLibrary: 'FontAwesome5',
      color: colors.pink[500],
      description: language === 'ja' ? '来園記録を追加' : 'Add visit record',
      onPress: () => {
        const today = getTodayInJST();
        console.log('Navigating to Record screen with LAND park and date:', today);
        onClose();
        navigation.navigate('Record' as never, {
          parkType: ParkType.LAND,
          date: today
        } as never);
      }
    },
    {
      id: 'disneysea',
      title: t('home.tokyoDisneysea'),
      icon: 'globe',
      iconLibrary: 'FontAwesome5',
      color: colors.teal[500],
      description: language === 'ja' ? '来園記録を追加' : 'Add visit record',
      onPress: () => {
        const today = getTodayInJST();
        console.log('Navigating to Record screen with SEA park and date:', today);
        onClose();
        navigation.navigate('Record' as never, {
          parkType: ParkType.SEA,
          date: today
        } as never);
      }
    },
  ];

  useEffect(() => {
    if (visible) {
      // 開くときは完全に左側から開始
      slideAnim.setValue(-screenWidth);
      fadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -screenWidth,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
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
            transform: [
              { translateX: slideAnim },
            ],
            opacity: fadeAnim,
          },
        ]}
      >
          <LinearGradient
            colors={['#ffffff', '#faf8ff']}
            style={styles.drawerGradient}
          >
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.appInfo}>
              <View style={styles.appIcon}>
                <Image 
                  source={require('../../assets/icon.png')} 
                  style={styles.appIconImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.appText}>
                <Text style={styles.appTitle}>TDR Days</Text>
                <Text style={styles.appSubtitle}>
                  {language === 'ja' ? 'ディズニー来園記録' : 'Disney Resort Diary'}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Navigation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'ja' ? 'メインメニュー' : 'Main Menu'}
              </Text>
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
              <Text style={styles.sectionTitle}>
                {language === 'ja' ? 'クイックアクション' : 'Quick Actions'}
              </Text>
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
              <Text style={styles.sectionTitle}>
                {language === 'ja' ? '設定' : 'Settings'}
              </Text>
              
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
                    {language === 'ja' ? 'Language / 言語' : 'Language / 言語'}
                  </Text>
                  <Text style={styles.menuDescription}>
                    {language === 'ja' ? '現在: 日本語 → English に変更' : 'Current: English → 日本語 に変更'}
                  </Text>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168, 85, 247, 0.1)',
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  appIconImage: {
    width: '100%',
    height: '100%',
  },
  appText: {
    flex: 1,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
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
    color: colors.gray[600],
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
    backgroundColor: '#ffffff',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
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
    color: colors.gray[800],
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: colors.gray[600],
  },
});

export default DrawerMenu;