import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  SectionList,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
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
  const { visits, isLoading, refreshData } = useVisits();
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getRelativeTimeLabel = (date: Date): string => {
    const now = new Date();
    const visitDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return '今日';
    if (diffInDays === 1) return '昨日';
    if (diffInDays <= 7) return '1週間以内';
    if (diffInDays <= 30) return '1ヶ月以内';
    if (diffInDays <= 90) return '3ヶ月以内';
    if (diffInDays <= 180) return '6ヶ月以内';
    if (diffInDays <= 365) return '1年以内';
    return '1年以上前';
  };

  const getSectionOrder = (title: string): number => {
    const order: { [key: string]: number } = {
      '今日': 1,
      '昨日': 2,
      '1週間以内': 3,
      '1ヶ月以内': 4,
      '3ヶ月以内': 5,
      '6ヶ月以内': 6,
      '1年以内': 7,
      '1年以上前': 8,
    };
    return order[title] || 999;
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
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
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
                {item.parkType === ParkType.LAND ? 'ディズニーランド' : 'ディズニーシー'}
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

        {item.notes && (
          <Text 
            style={[styles.visitNotes, { color: theme.colors.text.secondary }]}
            numberOfLines={2}
          >
            {item.notes}
          </Text>
        )}

        <View style={styles.visitStats}>
          {item.actionCount !== undefined && (
            <View style={styles.statItem}>
              <Ionicons name="list" size={14} color={theme.colors.text.secondary} />
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                {item.actionCount}件のアクション
              </Text>
            </View>
          )}
          {item.totalPhotoCount !== undefined && (
            <View style={styles.statItem}>
              <Ionicons name="image" size={14} color={theme.colors.text.secondary} />
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                {item.totalPhotoCount}枚の写真
              </Text>
            </View>
          )}
          {item.startTime && item.endTime && (
            <View style={styles.statItem}>
              <Ionicons name="time" size={14} color={theme.colors.text.secondary} />
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                {new Date(item.startTime).toLocaleTimeString('ja-JP', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} - {new Date(item.endTime).toLocaleTimeString('ja-JP', { 
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
          {section.data.length}件
        </Text>
      </LinearGradient>
    </View>
  );

  if (isLoading && visits.length === 0) {
    return (
      <SwipeableScreen onSwipeFromLeft={() => setMenuVisible(true)}>
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
          <Header 
            title="来園記録" 
            onMenuOpen={() => setMenuVisible(true)}
          />
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
              読み込み中...
            </Text>
          </View>
        </View>
        
        <DrawerMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
        />
      </SwipeableScreen>
    );
  }

  if (visits.length === 0) {
    return (
      <SwipeableScreen onSwipeFromLeft={() => setMenuVisible(true)}>
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
          <Header 
            title="来園記録" 
            onMenuOpen={() => setMenuVisible(true)}
          />
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={theme.colors.text.secondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
            まだ来園記録がありません
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
            最初の来園記録を作成しましょう
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              // Navigate to main tabs and then record screen
              navigation.navigate('Main' as never);
            }}
          >
            <LinearGradient
              colors={['#a855f7', '#9333ea']}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add" size={20} color={colors.utility.white} />
              <Text style={styles.createButtonText}>新しい記録を作成</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
        
        <DrawerMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
        />
      </SwipeableScreen>
    );
  }

  return (
    <SwipeableScreen onSwipeFromLeft={() => setMenuVisible(true)}>
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Header 
          title="来園記録" 
          onMenuOpen={() => setMenuVisible(true)}
        />
        <SectionList
        sections={visitSections}
        renderItem={renderVisitItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.purple[500]}
          />
        }
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={true}
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
  visitNotes: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing[3],
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

