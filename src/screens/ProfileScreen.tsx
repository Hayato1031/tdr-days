import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
// import * as Haptics from 'expo-haptics'; // Uncomment when installed
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { Header } from '../components/Header';
import { SwipeableScreen } from '../components/SwipeableScreen';
import { DrawerMenu } from '../components/DrawerMenu';
import ThemeCustomizer from '../components/ThemeCustomizer';

const { width } = Dimensions.get('window');

export const ProfileScreen = () => {
  const { theme, themeConfig, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const isDark = theme.mode === 'dark';
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLanguageToggle = () => {
    const newLanguage: Language = language === 'ja' ? 'en' : 'ja';
    setLanguage(newLanguage);
  };

  const menuItems = [
    { icon: 'person', label: t('profile.editProfile'), section: 'account' },
    { icon: 'notifications', label: t('profile.notifications'), section: 'account' },
    { icon: 'shield', label: t('profile.privacy'), section: 'account' },
    { icon: 'color-palette', label: t('profile.themeStudio'), section: 'preferences', action: () => {
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Uncomment when installed
      setShowThemeCustomizer(true);
    }, badge: themeConfig.designStyle !== 'material' ? themeConfig.designStyle : null },
    { icon: 'language', label: t('profile.language'), section: 'preferences', 
      value: language === 'ja' ? t('profile.japanese') : t('profile.english'),
      action: handleLanguageToggle },
    { icon: 'calendar', label: t('profile.dateFormat'), section: 'preferences', value: t('date.format') },
    { icon: 'cloud-upload', label: t('profile.backupData'), section: 'data' },
    { icon: 'cloud-download', label: t('profile.restoreData'), section: 'data' },
    { icon: 'trash', label: t('profile.clearCache'), section: 'data' },
    { icon: 'help-circle', label: t('profile.helpSupport'), section: 'other' },
    { icon: 'information-circle', label: t('profile.about'), section: 'other' },
    { icon: 'log-out', label: t('profile.signOut'), section: 'other', isDestructive: true },
  ];

  const sections = [
    { key: 'account', title: t('profile.account') },
    { key: 'preferences', title: t('profile.preferences') },
    { key: 'data', title: t('profile.dataStorage') },
    { key: 'other', title: t('profile.other') },
  ];

  return (
    <SwipeableScreen onSwipeFromLeft={() => setMenuVisible(true)}>
      <Header 
        title={t('nav.profile')} 
        onMenuOpen={() => setMenuVisible(true)}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
        showsVerticalScrollIndicator={false}
      >
      {/* Clean Profile Header */}
      <View style={[
        styles.profileHeader,
        {
          backgroundColor: colors.background.primary,
        }
      ]}>
        <View style={[
          styles.profileContent,
          {
            backgroundColor: colors.background.card,
            borderRadius: 20,
            margin: 20,
            padding: 32,
            borderWidth: 1,
            borderColor: colors.utility.borderLight,
          }
        ]}>
          <View style={styles.avatarContainer}>
            <View style={[
              styles.avatarGradient,
              {
                backgroundColor: colors.purple.bright + '15',
                borderWidth: 2,
                borderColor: colors.purple.bright + '30',
              }
            ]}>
              <Ionicons name="person" size={48} color={colors.purple.bright} />
            </View>
          </View>
          <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
            {t('profile.disneyExplorer')}
          </Text>
          <Text style={[styles.profileEmail, { color: theme.colors.text.secondary }]}>
            {t('profile.email')}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.purple.bright }]}>
                42
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                {t('profile.days')}
              </Text>
            </View>
            <View style={[
              styles.statDivider,
              { backgroundColor: colors.utility.borderLight }
            ]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.blue[500] }]}>
                156
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                {t('profile.attractions')}
              </Text>
            </View>
            <View style={[
              styles.statDivider,
              { backgroundColor: colors.utility.borderLight }
            ]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.green[500] }]}>
                284
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                {t('profile.photos')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Menu Sections */}
      {sections.map((section) => (
        <View key={section.key} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
            {section.title}
          </Text>
          <View
            style={[
              styles.sectionContent,
              {
                backgroundColor: isDark
                  ? theme.colors.background.secondary
                  : theme.colors.background.elevated,
              },
            ]}
          >
            {menuItems
              .filter((item) => item.section === section.key)
              .map((item, index, arr) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    index === arr.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={item.action}
                  activeOpacity={0.7}
                  // Add haptic feedback if available
                  onPressIn={() => {
                    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={styles.menuItemContent}>
                    <View
                      style={[
                        styles.menuIconContainer,
                        item.isDestructive && styles.menuIconDestructive,
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={
                          item.isDestructive
                            ? colors.semantic.error.main
                            : colors.purple[500]
                        }
                      />
                    </View>
                    <View style={styles.menuLabelContainer}>
                      <Text
                        style={[
                          styles.menuLabel,
                          { color: theme.colors.text.primary },
                          item.isDestructive && { color: colors.semantic.error.main },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.badge && (
                        <View
                          style={[
                            styles.menuBadge,
                            {
                              backgroundColor: themeConfig.accentColor,
                              borderRadius: theme.borderRadius?.full || 9999,
                            },
                          ]}
                        >
                          <Text style={styles.menuBadgeText}>{item.badge}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {item.hasSwitch ? (
                    <Switch
                      value={isDark}
                      onValueChange={toggleTheme}
                      trackColor={{
                        false: colors.utility.gridLight,
                        true: colors.purple[300],
                      }}
                      thumbColor={isDark ? colors.purple[500] : colors.utility.white}
                    />
                  ) : item.value ? (
                    <Text style={[styles.menuValue, { color: theme.colors.text.secondary }]}>
                      {item.value}
                    </Text>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.colors.text.secondary}
                    />
                  )}
                </TouchableOpacity>
              ))}
          </View>
        </View>
      ))}

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.colors.text.secondary }]}>
          {t('profile.version')}
        </Text>
        <Text style={[styles.versionSubtext, { color: theme.colors.text.disabled }]}>
          {t('profile.madeWithLove')}
        </Text>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 100 }} />
      </ScrollView>

      {/* Theme Customizer Modal */}
      <ThemeCustomizer
        visible={showThemeCustomizer}
        onClose={() => setShowThemeCustomizer(false)}
      />
      
      <DrawerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </SwipeableScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 0,
    marginBottom: 24,
  },
  profileContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 16,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    transition: 'background-color 0.2s ease',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIconDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  menuLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  menuBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuValue: {
    fontSize: 14,
    marginRight: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
  },
});