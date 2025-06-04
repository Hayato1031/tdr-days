import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  SectionList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useVisits } from '../hooks/useVisits';
import { Visit, ParkType } from '../types/models';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { Header } from '../components/Header';
import { SwipeableScreen } from '../components/SwipeableScreen';
import { DrawerMenu } from '../components/DrawerMenu';

interface VisitSection {
  title: string;
  data: Visit[];
}

export const VisitListScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { visits, isLoading, refreshData } = useVisits();
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Auto-refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      handleRefresh();
    });

    return unsubscribe;
  }, [navigation]);

  // 日本時間での今日の日付を取得
  const getTodayInJST = () => {
    const now = new Date();
    const jstOffset = 9 * 60; // JST is UTC+9
    const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000));
    return jstTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // 日本時間での日付文字列を取得
  const getDateStringInJST = (date: Date): string => {
    const visitDate = new Date(date);
    const jstOffset = 9 * 60; // JST is UTC+9
    const jstTime = new Date(visitDate.getTime() + (jstOffset * 60 * 1000));
    return jstTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const getRelativeTimeLabel = (date: Date): string => {
    const todayJST = getTodayInJST();
    const visitDateJST = getDateStringInJST(date);
    
    // 日付文字列での比較
    const today = new Date(todayJST);
    const visitDate = new Date(visitDateJST);
    const diffInDays = Math.floor((today.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));


    if (diffInDays === 0) return language === 'ja' ? '今日' : 'Today';
    if (diffInDays === 1) return language === 'ja' ? '昨日' : 'Yesterday';
    if (diffInDays <= 7) return language === 'ja' ? '1週間以内' : 'Within a week';
    if (diffInDays <= 30) return language === 'ja' ? '1ヶ月以内' : 'Within a month';
    if (diffInDays <= 90) return language === 'ja' ? '3ヶ月以内' : 'Within 3 months';
    if (diffInDays <= 180) return language === 'ja' ? '6ヶ月以内' : 'Within 6 months';
    if (diffInDays <= 365) return language === 'ja' ? '1年以内' : 'Within a year';
    return language === 'ja' ? '1年以上前' : 'Over a year ago';
  };

  const getSectionOrder = (title: string): number => {
    const orderJa: { [key: string]: number } = {
      '今日': 1, '昨日': 2, '1週間以内': 3, '1ヶ月以内': 4,
      '3ヶ月以内': 5, '6ヶ月以内': 6, '1年以内': 7, '1年以上前': 8,
    };
    const orderEn: { [key: string]: number } = {
      'Today': 1, 'Yesterday': 2, 'Within a week': 3, 'Within a month': 4,
      'Within 3 months': 5, 'Within 6 months': 6, 'Within a year': 7, 'Over a year ago': 8,
    };
    return (language === 'ja' ? orderJa[title] : orderEn[title]) || 999;
  };

  const visitSections: VisitSection[] = useMemo(() => {
    const sortedVisits = [...visits].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const sectionsMap = new Map<string, Visit[]>();

    sortedVisits.forEach(visit => {
      const label = getRelativeTimeLabel(visit.date);
      if (!sectionsMap.has(label)) {
        sectionsMap.set(label, []);
      }
      sectionsMap.get(label)!.push(visit);
    });

    return Array.from(sectionsMap.entries())
      .map(([title, data]) => ({ title, data }))
      .sort((a, b) => getSectionOrder(a.title) - getSectionOrder(b.title));
  }, [visits]);

  const formatDate = (date: Date): string => {
    const locale = language === 'ja' ? 'ja-JP' : 'en-US';
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getParkName = (parkType: ParkType): string => {
    if (language === 'ja') {
      return parkType === ParkType.LAND ? 'ディズニーランド' : 'ディズニーシー';
    } else {
      return parkType === ParkType.LAND ? 'Disneyland' : 'DisneySea';
    }
  };

  const getParkIcon = (parkType: ParkType): string => {
    return parkType === ParkType.LAND ? 'castle' : 'boat';
  };

  const getParkColor = (parkType: ParkType): string => {
    return parkType === ParkType.LAND ? colors.orange[500] : colors.blue[500];
  };

  const renderVisitItem = ({ item }: { item: Visit }) => (
    <TouchableOpacity
      style={[
        styles.visitCard,
        { backgroundColor: theme.colors.background.card }
      ]}
      onPress={() => (navigation as any).navigate('VisitDetail', { visitId: item.id })}
    >
      <LinearGradient
        colors={[
          'rgba(168, 85, 247, 0.05)',
          'rgba(147, 51, 234, 0.05)'
        ]}
        style={styles.visitCardGradient}
      >
        <View style={styles.visitHeader}>
          <View style={styles.visitInfo}>
            <View style={styles.parkInfo}>
              <View style={[
                styles.parkIcon,
                { backgroundColor: getParkColor(item.parkType) + '20' }
              ]}>
                {item.parkType === ParkType.LAND ? (
                  <FontAwesome5 
                    name="fort-awesome" 
                    size={20} 
                    color={getParkColor(item.parkType)} 
                  />
                ) : (
                  <FontAwesome5 
                    name="globe" 
                    size={20} 
                    color={getParkColor(item.parkType)} 
                  />
                )}
              </View>
              <Text style={[styles.parkName, { color: theme.colors.text.primary }]}>
                {getParkName(item.parkType)}
              </Text>
            </View>
            <Text style={[styles.visitDate, { color: theme.colors.text.secondary }]}>
              {formatDate(item.date)}
            </Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={theme.colors.text.secondary} 
          />
        </View>


        <View style={styles.visitStats}>
          {item.actionCount !== undefined && (
            <View style={styles.statItem}>
              <Ionicons name="list" size={14} color={theme.colors.text.secondary} />
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                {language === 'ja' ? `${item.actionCount}件のアクション` : `${item.actionCount} actions`}
              </Text>
            </View>
          )}
          {item.totalPhotoCount !== undefined && (
            <View style={styles.statItem}>
              <Ionicons name="image" size={14} color={theme.colors.text.secondary} />
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                {language === 'ja' ? `${item.totalPhotoCount}枚の写真` : `${item.totalPhotoCount} photos`}
              </Text>
            </View>
          )}
          {item.startTime && item.endTime && (
            <View style={styles.statItem}>
              <Ionicons name="time" size={14} color={theme.colors.text.secondary} />
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                {new Date(item.startTime).toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} - {new Date(item.endTime).toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: VisitSection }) => (
    <View style={[
      styles.sectionHeader,
      { backgroundColor: theme.colors.background.primary }
    ]}>
      <LinearGradient
        colors={['rgba(168, 85, 247, 0.1)', 'rgba(147, 51, 234, 0.1)']}
        style={styles.sectionHeaderGradient}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          {section.title}
        </Text>
        <Text style={[styles.sectionCount, { color: theme.colors.text.secondary }]}>
          {language === 'ja' ? `${section.data.length}件` : `${section.data.length} records`}
        </Text>
      </LinearGradient>
    </View>
  );

  if (isLoading && visits.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Header 
          title={language === 'ja' ? '来園記録' : 'Visit Records'} 
          onMenuOpen={() => setMenuVisible(true)}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            {language === 'ja' ? '読み込み中...' : 'Loading...'}
          </Text>
        </View>
      </View>
    );
  }

  if (visits.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Header 
          title={language === 'ja' ? '来園記録' : 'Visit Records'} 
          onMenuOpen={() => setMenuVisible(true)}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={theme.colors.text.secondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
            {language === 'ja' ? 'まだ来園記録がありません' : 'No visit records yet'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
            {language === 'ja' ? '最初の来園記録を作成しましょう' : "Let's create your first visit record"}
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              // Record画面に遷移して今日の日付を設定
              const today = new Date();
              (navigation as any).navigate('Record', {
                initialDate: today.toISOString().split('T')[0]
              });
            }}
          >
            <LinearGradient
              colors={['#a855f7', '#9333ea']}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add" size={20} color={colors.utility.white} />
              <Text style={styles.createButtonText}>
                {language === 'ja' ? '新しい記録を作成' : 'Create New Record'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SwipeableScreen onSwipeFromLeft={() => setMenuVisible(true)}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
        <Header 
          title={language === 'ja' ? '来園記録' : 'Visit Records'} 
          onMenuOpen={() => setMenuVisible(true)}
        />
        <SectionList
        sections={visitSections}
        renderItem={renderVisitItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: spacing[4], 
          paddingBottom: (Platform.OS === 'ios' ? 65 : 60) + insets.bottom + 20 
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.purple[500]}
          />
        }
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      />
      </View>
      
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
  sectionList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: spacing[6],
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  createButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
  },
  createButtonText: {
    color: colors.utility.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing[2],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  sectionHeader: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  sectionHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionCount: {
    fontSize: 14,
  },
  visitCard: {
    marginBottom: spacing[3],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  visitCardGradient: {
    padding: spacing[4],
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  visitInfo: {
    flex: 1,
  },
  parkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  parkIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  parkName: {
    fontSize: 16,
    fontWeight: '600',
  },
  visitDate: {
    fontSize: 14,
  },
  visitStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: spacing[1],
  },
});

