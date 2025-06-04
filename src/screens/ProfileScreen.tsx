import React, { useState, useEffect } from 'react';
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
  Alert,
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
import { ProfileEditModal } from '../components/ProfileEditModal';
import { HelpSupportModal } from '../components/HelpSupportModal';
import { AboutAppModal } from '../components/AboutAppModal';
import { TermsOfServiceModal } from '../components/TermsOfServiceModal';
import { CompanionManagerModal } from '../components/CompanionManagerModal';
import { profileService, UserProfile } from '../services/profileService';
import { useVisits } from '../hooks/useVisits';
import { useActions } from '../hooks/useActions';
import { resetDailyGreeting, getNewRandomGreeting, forceSetGreeting } from '../utils/greetings';
import { ActionCategory } from '../types/models';
import { getVersionString, getCopyrightString } from '../constants/app';

const { width } = Dimensions.get('window');

export const ProfileScreen = () => {
  const { theme, themeConfig, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const isDark = theme.mode === 'dark';
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showAboutApp, setShowAboutApp] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showCompanionManager, setShowCompanionManager] = useState(false);
  
  // Get actual data from hooks
  const { visits, deleteAllVisits, companions, createCompanion, deleteCompanion, updateCompanion } = useVisits();
  const { actions, deleteAllActions } = useActions();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await profileService.getProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  const handleLanguageToggle = () => {
    const newLanguage: Language = language === 'ja' ? 'en' : 'ja';
    setLanguage(newLanguage);
  };

  const handleDeleteAllVisits = () => {
    Alert.alert(
      language === 'ja' ? '来園記録を全削除' : 'Delete All Visit Records',
      language === 'ja' ? 'すべての来園記録とアクションが削除されます。この操作は取り消せません。本当に削除しますか？' : 'All visit records and actions will be deleted. This action cannot be undone. Are you sure you want to delete?',
      [
        {
          text: language === 'ja' ? 'キャンセル' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'ja' ? '削除' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllActions();
              await deleteAllVisits();
              Alert.alert(
                language === 'ja' ? '完了' : 'Complete', 
                language === 'ja' ? 'すべての来園記録が削除されました。' : 'All visit records have been deleted.'
              );
            } catch (error) {
              console.error('Error deleting all visits:', error);
              Alert.alert(
                language === 'ja' ? 'エラー' : 'Error', 
                language === 'ja' ? '削除に失敗しました。' : 'Failed to delete.'
              );
            }
          },
        },
      ]
    );
  };

  const handleResetGreeting = async () => {
    try {
      // Reset the cache first
      await resetDailyGreeting();
      
      // Then get a new greeting
      const newGreeting = await getNewRandomGreeting();
      
      // Store the new greeting in the cache for display
      await forceSetGreeting(newGreeting);
      
      Alert.alert(
        language === 'ja' ? '新しい挨拶' : 'New Greeting',
        language === 'ja' 
          ? `挨拶: ${newGreeting.text}${newGreeting.area ? `\nエリア: ${newGreeting.area}` : ''}\n\nホーム画面に戻ると反映されます。`
          : `Greeting: ${newGreeting.text}${newGreeting.area ? `\nArea: ${newGreeting.area}` : ''}\n\nReturn to home screen to see the change.`
      );
    } catch (error) {
      Alert.alert(
        language === 'ja' ? 'エラー' : 'Error',
        language === 'ja' ? 'リセットに失敗しました' : 'Failed to reset'
      );
    }
  };

  const menuItems = [
    { 
      icon: 'person', 
      label: language === 'ja' ? 'プロフィール編集' : 'Edit Profile', 
      section: 'account', 
      action: () => setShowProfileEdit(true) 
    },
    { 
      icon: 'people', 
      label: language === 'ja' ? '同行者管理' : 'Manage Companions', 
      section: 'account', 
      value: `${companions.length}${language === 'ja' ? '人' : ''}`,
      action: () => setShowCompanionManager(true) 
    },
    { 
      icon: 'language', 
      label: language === 'ja' ? '言語設定' : 'Language', 
      section: 'preferences', 
      value: language === 'ja' ? '日本語 → English' : 'English → 日本語',
      action: handleLanguageToggle 
    },
    { 
      icon: 'trash', 
      label: language === 'ja' ? '来園記録を全削除' : 'Delete All Visit Records', 
      section: 'data', 
      action: handleDeleteAllVisits, 
      isDestructive: true 
    },
    // Only show greeting reset in development
    ...(__DEV__ ? [{ 
      icon: 'refresh', 
      label: language === 'ja' ? '挨拶をリセット (テスト用)' : 'Reset Greeting (Test)', 
      section: 'data', 
      action: handleResetGreeting 
    }] : []),
    { 
      icon: 'help-circle', 
      label: language === 'ja' ? 'ヘルプ・サポート' : 'Help & Support', 
      section: 'other', 
      action: () => setShowHelpSupport(true) 
    },
    { 
      icon: 'information-circle', 
      label: language === 'ja' ? 'アプリについて' : 'About App', 
      section: 'other', 
      action: () => setShowAboutApp(true) 
    },
    { 
      icon: 'document-text', 
      label: language === 'ja' ? '利用規約' : 'Terms of Service', 
      section: 'other', 
      action: () => setShowTerms(true) 
    },
  ];

  const sections = [
    { 
      key: 'account', 
      title: language === 'ja' ? 'アカウント' : 'Account' 
    },
    { 
      key: 'preferences', 
      title: language === 'ja' ? '設定' : 'Preferences' 
    },
    { 
      key: 'data', 
      title: language === 'ja' ? 'データ管理' : 'Data Management' 
    },
    { 
      key: 'other', 
      title: language === 'ja' ? 'その他' : 'Other' 
    },
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
              {userProfile?.avatarUri ? (
                <Image source={{ uri: userProfile.avatarUri }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={48} color={colors.purple.bright} />
              )}
            </View>
          </View>
          <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
            {userProfile?.name || t('profile.disneyExplorer')}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.purple.bright }]}>
                {visits.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                {language === 'ja' ? '来園数' : 'Visits'}
              </Text>
            </View>
            <View style={[
              styles.statDivider,
              { backgroundColor: colors.utility.borderLight }
            ]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.blue[500] }]}>
                {actions.filter(action => action.category === ActionCategory.ATTRACTION).length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                {language === 'ja' ? 'アトラクション' : 'Attractions'}
              </Text>
            </View>
            <View style={[
              styles.statDivider,
              { backgroundColor: colors.utility.borderLight }
            ]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.green[500] }]}>
                {actions.reduce((total, action) => total + action.photos.length, 0)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                {language === 'ja' ? '写真数' : 'Photos'}
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
          {getVersionString()}
        </Text>
        <Text style={[styles.versionSubtext, { color: theme.colors.text.disabled }]}>
          {getCopyrightString()}
        </Text>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 100 }} />
      </ScrollView>

      
      {/* Profile Edit Modal */}
      <ProfileEditModal
        visible={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        onUpdate={handleProfileUpdate}
        currentProfile={userProfile}
      />
      
      {/* Help Support Modal */}
      <HelpSupportModal
        visible={showHelpSupport}
        onClose={() => setShowHelpSupport(false)}
      />
      
      {/* About App Modal */}
      <AboutAppModal
        visible={showAboutApp}
        onClose={() => setShowAboutApp(false)}
      />
      
      {/* Terms of Service Modal */}
      <TermsOfServiceModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
      />
      
      {/* Companion Manager Modal */}
      <CompanionManagerModal
        visible={showCompanionManager}
        onClose={() => setShowCompanionManager(false)}
        companions={companions}
        onCompanionCreate={createCompanion}
        onCompanionDelete={deleteCompanion}
        onCompanionUpdate={async (id, name) => {
          await updateCompanion(id, { name });
        }}
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
    paddingTop: 20,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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