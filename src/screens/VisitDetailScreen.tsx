import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useVisits } from '../hooks/useVisits';
import { useActions } from '../hooks/useActions';
import { Visit, ParkType, TimelineAction, ActionCategory } from '../types/models';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { Header } from '../components/Header';
import { SwipeableScreen } from '../components/SwipeableScreen';
import { DrawerMenu } from '../components/DrawerMenu';

interface RouteParams {
  visitId: string;
}

const VisitDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { getVisit, deleteVisit, companions } = useVisits();
  const { getActionsByVisit } = useActions();
  
  const { visitId } = route.params as RouteParams;
  const [visit, setVisit] = useState<Visit | null>(null);
  const [actions, setActions] = useState<TimelineAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    loadVisitData();
  }, [visitId]);

  const loadVisitData = async () => {
    try {
      setIsLoading(true);
      const [visitData, actionsData] = await Promise.all([
        getVisit(visitId),
        getActionsByVisit(visitId)
      ]);
      
      setVisit(visitData);
      setActions(actionsData || []);
    } catch (error) {
      Alert.alert('エラー', '来園記録の読み込みに失敗しました');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVisit = () => {
    Alert.alert(
      '来園記録を削除',
      'この来園記録を削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVisit(visitId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('エラー', '来園記録の削除に失敗しました');
            }
          }
        }
      ]
    );
  };

  const handleShareVisit = async () => {
    if (!visit) return;

    const shareText = `${formatDate(visit.date)}の${getParkName(visit.parkType)}来園記録\n\n` +
      `アクション数: ${actions.length}件\n` +
      `写真数: ${getTotalPhotoCount()}枚\n` +
      (visit.notes ? `\nメモ: ${visit.notes}` : '') +
      '\n\n#TDRDays #ディズニー';

    try {
      await Share.share({
        message: shareText,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getParkName = (parkType: ParkType): string => {
    return parkType === ParkType.LAND ? 'ディズニーランド' : 'ディズニーシー';
  };

  const getParkIcon = (parkType: ParkType): string => {
    return parkType === ParkType.LAND ? 'castle' : 'boat';
  };

  const getParkColor = (parkType: ParkType): string => {
    return parkType === ParkType.LAND ? colors.orange[500] : colors.blue[500];
  };

  const getCategoryIcon = (category: ActionCategory): string => {
    switch (category) {
      case ActionCategory.ATTRACTION:
        return 'rocket';
      case ActionCategory.RESTAURANT:
        return 'restaurant';
      case ActionCategory.SHOW:
        return 'musical-notes';
      case ActionCategory.GREETING:
        return 'hand-left';
      case ActionCategory.SHOPPING:
        return 'bag';
      default:
        return 'ellipse';
    }
  };

  const getCategoryName = (category: ActionCategory): string => {
    switch (category) {
      case ActionCategory.ATTRACTION:
        return 'アトラクション';
      case ActionCategory.RESTAURANT:
        return 'レストラン';
      case ActionCategory.SHOW:
        return 'ショー';
      case ActionCategory.GREETING:
        return 'グリーティング';
      case ActionCategory.SHOPPING:
        return 'ショッピング';
      default:
        return 'その他';
    }
  };

  const getTotalPhotoCount = (): number => {
    return actions.reduce((total, action) => total + action.photos.length, 0);
  };

  const getVisitDuration = (): string | null => {
    if (!visit?.startTime || !visit?.endTime) return null;
    
    const start = new Date(visit.startTime);
    const end = new Date(visit.endTime);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}時間${minutes}分`;
  };

  const getCompanionNames = (): string => {
    if (!visit?.companionIds.length) return '一人';
    
    const visitCompanions = companions.filter(c => 
      visit.companionIds.includes(c.id)
    );
    
    return visitCompanions.map(c => c.name).join(', ');
  };

  if (isLoading) {
    return (
      <SwipeableScreen onSwipeFromLeft={() => setMenuVisible(true)}>
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
          <Header 
            title="来園記録詳細" 
            showBackButton 
            onBackPress={() => navigation.goBack()}
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

  if (!visit) {
    return (
      <SwipeableScreen onSwipeFromLeft={() => setMenuVisible(true)}>
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
          <Header 
            title="来園記録詳細" 
            showBackButton 
            onBackPress={() => navigation.goBack()}
            onMenuOpen={() => setMenuVisible(true)}
          />
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
              来園記録が見つかりません
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

  return (
    <SwipeableScreen onSwipeFromLeft={() => setMenuVisible(true)}>
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Header 
          title="来園記録詳細" 
          showBackButton 
          onBackPress={() => navigation.goBack()}
          onMenuOpen={() => setMenuVisible(true)}
          rightActions={[
            {
              icon: 'share-outline',
              onPress: handleShareVisit,
            },
            {
              icon: 'trash-outline',
              onPress: handleDeleteVisit,
            },
          ]}
        />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Park Header */}
        <LinearGradient
          colors={[
            getParkColor(visit.parkType) + '20',
            getParkColor(visit.parkType) + '10',
          ]}
          style={styles.parkHeader}
        >
          <View style={styles.parkInfo}>
            <View style={[
              styles.parkIcon,
              { backgroundColor: getParkColor(visit.parkType) + '30' }
            ]}>
              <Ionicons 
                name={getParkIcon(visit.parkType) as any} 
                size={32} 
                color={getParkColor(visit.parkType)} 
              />
            </View>
            <View style={styles.parkDetails}>
              <Text style={[styles.parkName, { color: theme.colors.text.primary }]}>
                {getParkName(visit.parkType)}
              </Text>
              <Text style={[styles.visitDate, { color: theme.colors.text.secondary }]}>
                {formatDate(visit.date)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Visit Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            来園情報
          </Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="people" size={20} color={theme.colors.text.secondary} />
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                同行者
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                {getCompanionNames()}
              </Text>
            </View>

            {visit.startTime && visit.endTime && (
              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color={theme.colors.text.secondary} />
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                  滞在時間
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                  {getVisitDuration()}
                </Text>
              </View>
            )}

            {visit.weather && (
              <View style={styles.infoItem}>
                <Ionicons name="partly-sunny" size={20} color={theme.colors.text.secondary} />
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                  天気
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                  {visit.weather}
                </Text>
              </View>
            )}
          </View>

          {visit.notes && (
            <View style={styles.notesContainer}>
              <Text style={[styles.notesLabel, { color: theme.colors.text.secondary }]}>
                メモ
              </Text>
              <Text style={[styles.notesText, { color: theme.colors.text.primary }]}>
                {visit.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Statistics */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            統計情報
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.1)', 'rgba(147, 51, 234, 0.1)']}
                style={styles.statCardGradient}
              >
                <Ionicons name="list" size={24} color={colors.purple[500]} />
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {actions.length}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  アクション
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(34, 197, 94, 0.1)', 'rgba(22, 163, 74, 0.1)']}
                style={styles.statCardGradient}
              >
                <Ionicons name="image" size={24} color={colors.green[500]} />
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {getTotalPhotoCount()}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  写真
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Actions */}
        {actions.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              アクション履歴
            </Text>
            
            {actions
              .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
              .map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionItem}
                onPress={() => {
                  // TODO: Navigate to action detail when implemented
                  console.log('Navigate to action detail:', action.id);
                }}
              >
                <View style={styles.actionHeader}>
                  <View style={styles.actionIcon}>
                    <Ionicons 
                      name={getCategoryIcon(action.category) as any} 
                      size={16} 
                      color={colors.purple[500]} 
                    />
                  </View>
                  <View style={styles.actionDetails}>
                    <Text style={[styles.actionName, { color: theme.colors.text.primary }]}>
                      {action.locationName}
                    </Text>
                    <Text style={[styles.actionCategory, { color: theme.colors.text.secondary }]}>
                      {getCategoryName(action.category)} • {action.area}
                    </Text>
                    <Text style={[styles.actionTime, { color: theme.colors.text.tertiary }]}>
                      {new Date(action.time).toLocaleTimeString('ja-JP', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  <View style={styles.actionMeta}>
                    {action.photos.length > 0 && (
                      <View style={styles.photoCount}>
                        <Ionicons name="image" size={12} color={theme.colors.text.tertiary} />
                        <Text style={[styles.photoCountText, { color: theme.colors.text.tertiary }]}>
                          {action.photos.length}
                        </Text>
                      </View>
                    )}
                    <Ionicons 
                      name="chevron-forward" 
                      size={16} 
                      color={theme.colors.text.tertiary} 
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  parkHeader: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[6],
  },
  parkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parkIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  parkDetails: {
    flex: 1,
  },
  parkName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  visitDate: {
    fontSize: 16,
  },
  section: {
    margin: spacing[4],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing[4],
  },
  infoGrid: {
    gap: spacing[4],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    marginLeft: spacing[3],
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginLeft: spacing[2],
  },
  notesContainer: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  notesLabel: {
    fontSize: 14,
    marginBottom: spacing[2],
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: spacing[4],
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: spacing[2],
  },
  statLabel: {
    fontSize: 12,
    marginTop: spacing[1],
  },
  actionItem: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  actionDetails: {
    flex: 1,
  },
  actionName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing[1],
  },
  actionCategory: {
    fontSize: 14,
    marginBottom: spacing[1],
  },
  actionTime: {
    fontSize: 12,
  },
  actionMeta: {
    alignItems: 'flex-end',
  },
  photoCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  photoCountText: {
    fontSize: 12,
    marginLeft: spacing[1],
  },
});

export default VisitDetailScreen;