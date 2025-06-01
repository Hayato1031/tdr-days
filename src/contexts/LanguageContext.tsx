import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supported languages
export type Language = 'ja' | 'en';

// Language Context Interface
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isLoading: boolean;
}

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = '@tdr_days_language';

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations = {
  ja: {
    // Common
    'common.loading': '読み込み中...',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.add': '追加',
    'common.search': '検索',
    'common.filter': 'フィルター',
    'common.settings': '設定',
    'common.back': '戻る',
    'common.next': '次へ',
    'common.previous': '前へ',
    'common.complete': '完了',
    'common.ok': 'OK',
    'common.yes': 'はい',
    'common.no': 'いいえ',

    // Navigation
    'nav.home': 'ホーム',
    'nav.record': '記録',
    'nav.analytics': '分析',
    'nav.profile': 'プロフィール',

    // Home Screen
    'home.welcome': 'ようこそ',
    'home.appTitle': 'TDR Days',
    'home.tagline': '✨ あなたの魔法のディズニージャーニーが待っています ✨',
    'home.totalVisits': '総来園回数',
    'home.allTime': '通算',
    'home.activities': 'アクティビティ',
    'home.logged': '記録済み',
    'home.disneyland': 'ディズニーランド',
    'home.disneysea': 'ディズニーシー',
    'home.visits': '回',
    'home.chooseAdventure': 'あなたの冒険を選択',
    'home.selectPark': 'パークを選択して魔法の思い出を探索しましょう',
    'home.tokyoDisneyland': '東京ディズニーランド',
    'home.landDescription': '夢が叶う魔法の王国',
    'home.tokyoDisneysea': '東京ディズニーシー',
    'home.seaDescription': '冒険と想像の驚異を発見',
    'home.quickActions': 'クイックアクション',
    'home.newVisit': '新しい来園',
    'home.analytics': '分析',
    'home.photos': '写真',
    'home.favorites': 'お気に入り',
    'home.recentMagic': '最近の魔法',
    'home.startJourney': '魔法の旅を始めましょう',
    'home.firstVisitMessage': '最初のディズニー来園を記録して、忘れられない思い出を作り始めましょう！',
    'home.recordFirstVisit': '最初の来園を記録',
    'home.noVisitsFound': '来園記録が見つかりません',
    'home.adjustFilters': 'フィルターを調整してより多くの来園記録を表示してください',
    'home.addFirstVisit': '最初のディズニー来園を追加してください！',

    // Record Screen
    'record.title': '来園を記録',
    'record.subtitle': 'あなたのディズニーの一日の魔法を記録',
    'record.complete': '% 完了',
    'record.weather': '天気',
    'record.sunny': '晴れ',
    'record.cloudy': '曇り',
    'record.rainy': '雨',
    'record.snowy': '雪',
    'record.notes': 'メモ',
    'record.notesPlaceholder': '今日の魔法の瞬間、お気に入りのアトラクション、思い出をシェアしてください...',
    'record.saveVisit': '来園を保存',
    'record.savingVisit': '来園を保存中...',
    'record.incompleteForm': 'フォームが未完成です',
    'record.selectDateAndPark': '少なくとも日付とパークを選択してください。',
    'record.success': '成功！',
    'record.successMessage': '来園が正常に記録されました！',
    'record.error': 'エラー',
    'record.errorMessage': '来園の保存に失敗しました。もう一度お試しください。',

    // Analytics Screen
    'analytics.title': '分析ダッシュボード',
    'analytics.subtitle': 'あなたのディズニーパターンを発見',
    'analytics.totalVisits': '総来園回数',
    'analytics.totalActions': '総アクティビティ数',
    'analytics.photosTaken': '撮影写真数',
    'analytics.avgVisitDuration': '平均滞在時間',
    'analytics.allTime': '全期間',
    'analytics.thisPeriod': 'この期間',
    'analytics.perVisit': '来園あたり',
    'analytics.memoriesCaptured': '記録された思い出',
    'analytics.hoursPerVisit': '来園あたりの時間',
    'analytics.monthly': '月別',
    'analytics.yearly': '年別',
    'analytics.custom': 'カスタム',
    'analytics.loading': '分析データを読み込み中...',
    'analytics.parkVisitsDistribution': 'パーク来園分布',
    'analytics.activityBreakdown': 'アクティビティ内訳',
    'analytics.visitsOverTime': '来園数推移',
    'analytics.popularAreas': '人気エリア',
    'analytics.visitCalendar': '来園カレンダー',
    'analytics.topAttractions': 'トップアトラクション',
    'analytics.favoriteRestaurants': 'お気に入りレストラン',
    'analytics.favoriteCompanions': 'お気に入りの同行者',
    'analytics.exportSuccess': '分析データエクスポート',
    'analytics.exportError': 'エクスポートエラー',
    'analytics.exportErrorMessage': '分析データの生成に失敗しました。',
    'analytics.visits': '回',
    'analytics.visitsTogether': '一緒に来園',

    // Profile Screen
    'profile.disneyExplorer': 'ディズニーエクスプローラー',
    'profile.email': 'explorer@tdrdays.com',
    'profile.days': '日',
    'profile.attractions': 'アトラクション',
    'profile.photos': '写真',
    'profile.account': 'アカウント',
    'profile.editProfile': 'プロフィール編集',
    'profile.notifications': '通知',
    'profile.privacy': 'プライバシー',
    'profile.preferences': '設定',
    'profile.darkMode': 'ダークモード',
    'profile.themeStudio': 'テーマスタジオ',
    'profile.language': '言語',
    'profile.dateFormat': '日付形式',
    'profile.dataStorage': 'データ・ストレージ',
    'profile.backupData': 'データバックアップ',
    'profile.restoreData': 'データ復元',
    'profile.clearCache': 'キャッシュクリア',
    'profile.other': 'その他',
    'profile.helpSupport': 'ヘルプ・サポート',
    'profile.about': 'アプリについて',
    'profile.signOut': 'サインアウト',
    'profile.version': 'TDR Days v1.0.0',
    'profile.madeWithLove': 'ディズニーファンのために ❤️ で作成',
    'profile.japanese': '日本語',
    'profile.english': 'English',

    // Parks
    'park.disneyland': 'ディズニーランド',
    'park.disneysea': 'ディズニーシー',

    // Date formats
    'date.format': 'YYYY/MM/DD',
  },
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.settings': 'Settings',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.complete': 'Complete',
    'common.ok': 'OK',
    'common.yes': 'Yes',
    'common.no': 'No',

    // Navigation
    'nav.home': 'Home',
    'nav.record': 'Record',
    'nav.analytics': 'Analytics',
    'nav.profile': 'Profile',

    // Home Screen
    'home.welcome': 'Welcome to',
    'home.appTitle': 'TDR Days',
    'home.tagline': '✨ Your magical Disney journey awaits ✨',
    'home.totalVisits': 'Total Visits',
    'home.allTime': 'All time',
    'home.activities': 'Activities',
    'home.logged': 'Logged',
    'home.disneyland': 'Disneyland',
    'home.disneysea': 'DisneySea',
    'home.visits': 'Visits',
    'home.chooseAdventure': 'Choose Your Adventure',
    'home.selectPark': 'Select a park to explore your magical memories',
    'home.tokyoDisneyland': 'Tokyo Disneyland',
    'home.landDescription': 'The magical kingdom where dreams come true',
    'home.tokyoDisneysea': 'Tokyo DisneySea',
    'home.seaDescription': 'Discover the wonders of adventure and imagination',
    'home.quickActions': 'Quick Actions',
    'home.newVisit': 'New Visit',
    'home.analytics': 'Analytics',
    'home.photos': 'Photos',
    'home.favorites': 'Favorites',
    'home.recentMagic': 'Recent Magic',
    'home.startJourney': 'Start Your Magical Journey',
    'home.firstVisitMessage': 'Record your first Disney visit and begin creating unforgettable memories!',
    'home.recordFirstVisit': 'Record First Visit',
    'home.noVisitsFound': 'No visits found',
    'home.adjustFilters': 'Try adjusting your filters to see more visits',
    'home.addFirstVisit': 'Start by adding your first Disney visit!',

    // Record Screen
    'record.title': 'Record Your Visit',
    'record.subtitle': 'Capture the magic of your Disney day',
    'record.complete': '% Complete',
    'record.weather': 'Weather',
    'record.sunny': 'Sunny',
    'record.cloudy': 'Cloudy',
    'record.rainy': 'Rainy',
    'record.snowy': 'Snowy',
    'record.notes': 'Notes',
    'record.notesPlaceholder': 'Share your magical moments, favorite attractions, or memories from today...',
    'record.saveVisit': 'Save Visit',
    'record.savingVisit': 'Saving Visit...',
    'record.incompleteForm': 'Incomplete Form',
    'record.selectDateAndPark': 'Please select at least a date and park.',
    'record.success': 'Success!',
    'record.successMessage': 'Your visit has been recorded successfully!',
    'record.error': 'Error',
    'record.errorMessage': 'Failed to save visit. Please try again.',

    // Analytics Screen
    'analytics.title': 'Analytics Dashboard',
    'analytics.subtitle': 'Discover your Disney patterns',
    'analytics.totalVisits': 'Total Visits',
    'analytics.totalActions': 'Total Actions',
    'analytics.photosTaken': 'Photos Taken',
    'analytics.avgVisitDuration': 'Avg Visit Duration',
    'analytics.allTime': 'All time',
    'analytics.thisPeriod': 'This period',
    'analytics.perVisit': 'per visit',
    'analytics.memoriesCaptured': 'Memories captured',
    'analytics.hoursPerVisit': 'Hours per visit',
    'analytics.monthly': 'Monthly',
    'analytics.yearly': 'Yearly',
    'analytics.custom': 'Custom',
    'analytics.loading': 'Loading analytics...',
    'analytics.parkVisitsDistribution': 'Park Visits Distribution',
    'analytics.activityBreakdown': 'Activity Breakdown',
    'analytics.visitsOverTime': 'Visits Over Time',
    'analytics.popularAreas': 'Popular Areas',
    'analytics.visitCalendar': 'Visit Calendar',
    'analytics.topAttractions': 'Top Attractions',
    'analytics.favoriteRestaurants': 'Favorite Restaurants',
    'analytics.favoriteCompanions': 'Favorite Companions',
    'analytics.exportSuccess': 'Analytics Export',
    'analytics.exportError': 'Export Error',
    'analytics.exportErrorMessage': 'Failed to generate analytics data.',
    'analytics.visits': 'visits',
    'analytics.visitsTogether': 'visits together',

    // Profile Screen
    'profile.disneyExplorer': 'Disney Explorer',
    'profile.email': 'explorer@tdrdays.com',
    'profile.days': 'Days',
    'profile.attractions': 'Attractions',
    'profile.photos': 'Photos',
    'profile.account': 'Account',
    'profile.editProfile': 'Edit Profile',
    'profile.notifications': 'Notifications',
    'profile.privacy': 'Privacy',
    'profile.preferences': 'Preferences',
    'profile.darkMode': 'Dark Mode',
    'profile.themeStudio': 'Theme Studio',
    'profile.language': 'Language',
    'profile.dateFormat': 'Date Format',
    'profile.dataStorage': 'Data & Storage',
    'profile.backupData': 'Backup Data',
    'profile.restoreData': 'Restore Data',
    'profile.clearCache': 'Clear Cache',
    'profile.other': 'Other',
    'profile.helpSupport': 'Help & Support',
    'profile.about': 'About',
    'profile.signOut': 'Sign Out',
    'profile.version': 'TDR Days v1.0.0',
    'profile.madeWithLove': 'Made with ❤️ for Disney fans',
    'profile.japanese': '日本語',
    'profile.english': 'English',

    // Parks
    'park.disneyland': 'Disneyland',
    'park.disneysea': 'DisneySea',

    // Date formats
    'date.format': 'MM/DD/YYYY',
  },
};

// Language Provider Props
interface LanguageProviderProps {
  children: ReactNode;
}

// Language Provider Component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ja'); // Default to Japanese
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && (savedLanguage === 'ja' || savedLanguage === 'en')) {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedLanguage();
  }, []);

  // Set language and save to storage
  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    // Simple key-based lookup
    const currentLangTranslations = translations[language];
    
    if (currentLangTranslations && currentLangTranslations[key]) {
      let value = currentLangTranslations[key];
      
      // Replace parameters if provided
      if (params) {
        return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
          return str.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), paramValue);
        }, value);
      }
      
      return value;
    }
    
    // Fallback to English
    const englishTranslations = translations.en;
    if (englishTranslations && englishTranslations[key]) {
      let value = englishTranslations[key];
      
      // Replace parameters if provided
      if (params) {
        return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
          return str.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), paramValue);
        }, value);
      }
      
      return value;
    }
    
    return key; // Return the key itself as fallback
  };

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};

// Export types
export type TranslationKey = string;
export default LanguageContext;