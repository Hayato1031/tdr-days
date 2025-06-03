import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Image,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useVisits } from '../hooks/useVisits';
import { useActions } from '../hooks/useActions';
import { Visit, ParkType, TimelineAction, ActionCategory, LandArea, SeaArea } from '../types/models';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { Header } from '../components/Header';
import { SwipeableScreen } from '../components/SwipeableScreen';
import { DrawerMenu } from '../components/DrawerMenu';
import { ActionModal } from '../components/ActionModal';
import { ActionDetailModal } from '../components/ActionDetailModal';

interface RouteParams {
  visitId: string;
}

export const VisitDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { getVisit, deleteVisit, companions } = useVisits();
  const { getActionsByVisit } = useActions();
  
  const { visitId } = route.params as RouteParams;
  const [visit, setVisit] = useState<Visit | null>(null);
  const [actions, setActions] = useState<TimelineAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [editingAction, setEditingAction] = useState<TimelineAction | undefined>();
  const [actionDetailModalVisible, setActionDetailModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<TimelineAction | undefined>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [sortedActions, setSortedActions] = useState<TimelineAction[]>([]);

  useEffect(() => {
    loadVisitData();
  }, [visitId]);

  useEffect(() => {
    // Use actions as-is (in order they were added/arranged)
    setSortedActions([...actions]);
  }, [actions]);

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
      Alert.alert(
        language === 'ja' ? 'エラー' : 'Error', 
        language === 'ja' ? '来園記録の読み込みに失敗しました' : 'Failed to load visit record'
      );
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVisit = () => {
    Alert.alert(
      language === 'ja' ? '来園記録を削除' : 'Delete Visit Record',
      language === 'ja' ? 'この来園記録を削除しますか？この操作は取り消せません。' : 'Are you sure you want to delete this visit record? This action cannot be undone.',
      [
        { text: language === 'ja' ? 'キャンセル' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ja' ? '削除' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVisit(visitId);
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                language === 'ja' ? 'エラー' : 'Error', 
                language === 'ja' ? '来園記録の削除に失敗しました' : 'Failed to delete visit record'
              );
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
    const locale = language === 'ja' ? 'ja-JP' : 'en-US';
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getParkName = (parkType: ParkType): string => {
    if (language === 'ja') {
      return parkType === ParkType.LAND ? 'ディズニーランド' : 'ディズニーシー';
    } else {
      return parkType === ParkType.LAND ? 'Tokyo Disneyland' : 'Tokyo DisneySea';
    }
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
      case ActionCategory.CUSTOM:
        return 'create';
      default:
        return 'ellipse';
    }
  };

  const getCategoryColor = (category: ActionCategory): string => {
    switch (category) {
      case ActionCategory.ATTRACTION:
        return colors.purple[500];
      case ActionCategory.RESTAURANT:
        return colors.orange[500];
      case ActionCategory.SHOW:
        return colors.pink[500];
      case ActionCategory.GREETING:
        return colors.yellow[500];
      case ActionCategory.SHOPPING:
        return colors.green[500];
      case ActionCategory.CUSTOM:
        return colors.blue[500];
      default:
        return colors.gray[500];
    }
  };

  const translateAreaName = (area: string): string => {
    if (language === 'ja') return area;
    
    const areaTranslations: { [key: string]: string } = {
      // Disneyland areas
      'ワールドバザール': 'World Bazaar',
      'アドベンチャーランド': 'Adventureland', 
      'ウエスタンランド': 'Westernland',
      'クリッターカントリー': 'Critter Country',
      'ファンタジーランド': 'Fantasyland',
      'トゥーンタウン': 'Toontown',
      'トゥモローランド': 'Tomorrowland',
      // DisneySea areas
      'メディテレーニアンハーバー': 'Mediterranean Harbor',
      'アメリカンウォーターフロント': 'American Waterfront',
      'ポートディスカバリー': 'Port Discovery',
      'ロストリバーデルタ': 'Lost River Delta',
      'アラビアンコースト': 'Arabian Coast',
      'マーメイドラグーン': 'Mermaid Lagoon',
      'ミステリアスアイランド': 'Mysterious Island',
      'ファンタジースプリングス': 'Fantasy Springs',
    };
    
    return areaTranslations[area] || area;
  };

  const translateFacilityName = (name: string): string => {
    if (language === 'ja') return name;
    
    const facilityTranslations: { [key: string]: string } = {
      // Popular attractions - Disneyland
      'ビッグサンダーマウンテン': 'Big Thunder Mountain',
      'スプラッシュマウンテン': 'Splash Mountain',
      'スペースマウンテン': 'Space Mountain',
      'プーさんのハニーハント': 'Pooh\'s Hunny Hunt',
      'ホーンテッドマンション': 'Haunted Mansion',
      'イッツ・ア・スモールワールド': 'It\'s a Small World',
      'ジャングルクルーズ': 'Jungle Cruise',
      'カリブの海賊': 'Pirates of the Caribbean',
      'ビッグサンダーマウンテン': 'Big Thunder Mountain Railroad',
      // Popular attractions - DisneySea
      'タワー・オブ・テラー': 'Tower of Terror',
      'センター・オブ・ジ・アース': 'Journey to the Center of the Earth',
      'トイ・ストーリー・マニア!': 'Toy Story Midway Mania!',
      'インディ・ジョーンズ・アドベンチャー': 'Indiana Jones Adventure',
      'レイジングスピリッツ': 'Raging Spirits',
      'フランダーのフライングフィッシュコースター': 'Flounder\'s Flying Fish Coaster',
      '20000リーグ・アンダー・ザ・シー': '20,000 Leagues Under the Sea',
      // Popular restaurants
      'クイーン・オブ・ハートのバンケットホール': 'Queen of Hearts Banquet Hall',
      'クリスタルパレス・レストラン': 'Crystal Palace Restaurant',
      'ブルーバイユー・レストラン': 'Blue Bayou Restaurant',
      'マゼランズ': 'Magellan\'s',
      'リストランテ・ディ・カナレット': 'Ristorante di Canaletto',
      'ケープコッド・クックオフ': 'Cape Cod Cook-Off',
      // Shows
      'ビッグバンドビート': 'Big Band Beat',
      'ミッキーとダッフィーのスプリングヴォヤッジ': 'Mickey and Duffy\'s Spring Voyage',
      'フェアリーテイル・フォレスト': 'Fairytale Forest',
      'エレクトリカルパレード・ドリームライツ': 'Tokyo Disneyland Electrical Parade Dreamlights',
    };
    
    return facilityTranslations[name] || name;
  };

  const getCategoryName = (category: ActionCategory): string => {
    switch (category) {
      case ActionCategory.ATTRACTION:
        return language === 'ja' ? 'アトラクション' : 'Attraction';
      case ActionCategory.RESTAURANT:
        return language === 'ja' ? 'レストラン' : 'Restaurant';
      case ActionCategory.SHOW:
        return language === 'ja' ? 'ショー' : 'Show';
      case ActionCategory.GREETING:
        return language === 'ja' ? 'グリーティング' : 'Greeting';
      case ActionCategory.SHOPPING:
        return language === 'ja' ? 'ショッピング' : 'Shopping';
      case ActionCategory.CUSTOM:
        return language === 'ja' ? 'カスタム' : 'Custom';
      default:
        return language === 'ja' ? 'その他' : 'Other';
    }
  };

  const getTotalPhotoCount = (): number => {
    return actions.reduce((total, action) => total + action.photos.length, 0);
  };

  const handleAddAction = () => {
    setEditingAction(undefined);
    setActionModalVisible(true);
  };

  const handleActionPress = (action: TimelineAction) => {
    setSelectedAction(action);
    setActionDetailModalVisible(true);
  };

  const handleEditAction = (action: TimelineAction) => {
    setEditingAction(action);
    setActionModalVisible(true);
    setActionDetailModalVisible(false);
  };

  const handleActionSave = (savedAction: TimelineAction) => {
    if (editingAction) {
      // Update existing action
      setActions(prev => prev.map(a => a.id === savedAction.id ? savedAction : a));
    } else {
      // Add new action
      setActions(prev => [...prev, savedAction]);
    }
    setActionModalVisible(false);
    setEditingAction(undefined);
  };

  const handleActionModalClose = () => {
    setActionModalVisible(false);
    setEditingAction(undefined);
  };


  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };


  const moveAction = (fromIndex: number, toIndex: number) => {
    const newActions = [...sortedActions];
    const [movedAction] = newActions.splice(fromIndex, 1);
    newActions.splice(toIndex, 0, movedAction);
    setSortedActions(newActions);
    setActions(newActions);
  };

  const renderTimelineItem = (action: TimelineAction, index: number) => {
    const isFirst = index === 0;
    const isLast = index === sortedActions.length - 1;
    const categoryColor = getCategoryColor(action.category);
    
    return (
      <View key={action.id} style={styles.timelineItem}>
        {/* Step Number */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepNumber, { backgroundColor: categoryColor }]}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          
          {/* Arrow pointing down to next item */}
          {!isLast && (
            <View style={styles.stepConnector}>
              <View style={[styles.stepLine, { backgroundColor: theme.colors.border }]} />
              <Ionicons 
                name="chevron-down" 
                size={16} 
                color={theme.colors.border} 
                style={styles.stepArrow}
              />
            </View>
          )}
        </View>

        {/* Move Buttons (only in edit mode) */}
        {isEditMode && (
          <View style={styles.moveButtons}>
            {!isFirst && (
              <TouchableOpacity
                style={[styles.moveButton, { backgroundColor: theme.colors.background.secondary }]}
                onPress={() => moveAction(index, index - 1)}
              >
                <Ionicons name="chevron-up" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
            {!isLast && (
              <TouchableOpacity
                style={[styles.moveButton, { backgroundColor: theme.colors.background.secondary }]}
                onPress={() => moveAction(index, index + 1)}
              >
                <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Card */}
        <TouchableOpacity
          style={[
            styles.actionCard, 
            { backgroundColor: theme.colors.background.card },
          ]}
          onPress={() => handleActionPress(action)}
          activeOpacity={0.7}
          disabled={isEditMode}
        >
          <View style={styles.actionCardHeader}>
            <View style={styles.actionCardTitle}>
              <Ionicons 
                name={getCategoryIcon(action.category) as any} 
                size={16} 
                color={categoryColor} 
              />
              <Text style={[styles.actionCategory, { color: categoryColor }]}>
                {getCategoryName(action.category)}
              </Text>
            </View>
            {action.time && (
              <Text style={[styles.actionTime, { color: theme.colors.text.secondary }]}>
                {new Date(action.time).toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            )}
          </View>

          <Text style={[styles.actionName, { color: theme.colors.text.primary }]}>
            {action.customTitle || (action.locationName ? translateFacilityName(action.locationName) : getCategoryName(action.category))}
          </Text>
          
          <Text style={[styles.actionArea, { color: theme.colors.text.secondary }]}>
            {translateAreaName(action.area)}
          </Text>

          {/* Action Details */}
          <View style={styles.actionCardDetails}>

            {action.waitTime && (
              <View style={styles.actionDetail}>
                <Ionicons name="hourglass" size={12} color={theme.colors.text.secondary} />
                <Text style={[styles.actionDetailText, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' 
                    ? `待ち${action.waitTime}分` 
                    : `${action.waitTime}min wait`
                  }
                </Text>
              </View>
            )}

            {action.photos.length > 0 && (
              <View style={styles.actionDetail}>
                <Ionicons name="image" size={12} color={theme.colors.text.secondary} />
                <Text style={[styles.actionDetailText, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' 
                    ? `${action.photos.length}枚` 
                    : `${action.photos.length} photos`
                  }
                </Text>
              </View>
            )}
          </View>

          {/* Photo Preview */}
          {action.photos.length > 0 && (
            <View style={styles.photoPreview}>
              {action.photos.slice(0, 3).map((photo, photoIndex) => (
                <View 
                  key={photo.id} 
                  style={[
                    styles.photoPreviewItem, 
                    { zIndex: 3 - photoIndex, marginLeft: photoIndex > 0 ? -spacing[2] : 0 }
                  ]}
                >
                  <Image 
                    source={{ uri: photo.uri }} 
                    style={styles.photoPreviewImage} 
                  />
                </View>
              ))}
              {action.photos.length > 3 && (
                <View style={[styles.photoPreviewMore, { backgroundColor: theme.colors.background.secondary }]}>
                  <Text style={[styles.photoPreviewMoreText, { color: theme.colors.text.secondary }]}>
                    +{action.photos.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}

          {action.notes && (
            <Text 
              style={[styles.actionNotes, { color: theme.colors.text.secondary }]}
              numberOfLines={2}
            >
              {action.notes}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const getVisitDuration = (): string | null => {
    if (!visit?.startTime || !visit?.endTime) return null;
    
    const start = new Date(visit.startTime);
    const end = new Date(visit.endTime);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (language === 'ja') {
      return `${hours}時間${minutes}分`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  const getCompanionNames = (): string => {
    if (!visit?.companionIds.length) {
      return language === 'ja' ? '一人' : 'Solo';
    }
    
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
            title={language === 'ja' ? '来園記録詳細' : 'Visit Details'} 
            showBackButton 
            onBackPress={() => navigation.goBack()}
            onMenuOpen={() => setMenuVisible(true)}
          />
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
              {language === 'ja' ? '読み込み中...' : 'Loading...'}
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
            title={language === 'ja' ? '来園記録詳細' : 'Visit Details'} 
            showBackButton 
            onBackPress={() => navigation.goBack()}
            onMenuOpen={() => setMenuVisible(true)}
          />
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? '来園記録が見つかりません' : 'Visit record not found'}
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
          title={language === 'ja' ? '来園記録詳細' : 'Visit Details'} 
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
              {visit.parkType === ParkType.LAND ? (
                <FontAwesome5 
                  name="fort-awesome" 
                  size={32} 
                  color={getParkColor(visit.parkType)} 
                />
              ) : (
                <FontAwesome5 
                  name="globe" 
                  size={32} 
                  color={getParkColor(visit.parkType)} 
                />
              )}
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
        <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? '来園情報' : 'Visit Information'}
            </Text>
            <TouchableOpacity
              style={[styles.editRecordButton, { backgroundColor: colors.purple[500] }]}
              onPress={() => {
                // Navigate back to the main tab navigator first, then to Record screen
                navigation.navigate('Main' as never, {
                  screen: 'Record',
                  params: {
                    visitId: visitId,
                    parkType: visit.parkType,
                    date: new Date(visit.date).toISOString().split('T')[0]
                  }
                } as never);
              }}
            >
              <Ionicons name="pencil" size={14} color="white" />
              <Text style={styles.editRecordButtonText}>
                {language === 'ja' ? '編集' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="people" size={20} color={theme.colors.text.secondary} />
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                {language === 'ja' ? '同行者' : 'Companions'}
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                {getCompanionNames()}
              </Text>
            </View>

            {visit.startTime && visit.endTime && (
              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color={theme.colors.text.secondary} />
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? '滞在時間' : 'Duration'}
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
                  {language === 'ja' ? '天気' : 'Weather'}
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
                {language === 'ja' ? 'メモ' : 'Notes'}
              </Text>
              <Text style={[styles.notesText, { color: theme.colors.text.primary }]}>
                {visit.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Statistics */}
        <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            {language === 'ja' ? '統計情報' : 'Statistics'}
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
                  {language === 'ja' ? 'アクション' : 'Actions'}
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
                  {language === 'ja' ? '写真' : 'Photos'}
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Photo Gallery */}
        {getTotalPhotoCount() > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {language === 'ja' 
                  ? `今日の写真 (${getTotalPhotoCount()}枚)` 
                  : `Photos (${getTotalPhotoCount()})` 
                }
              </Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.photoGalleryContainer}
              contentContainerStyle={styles.photoGalleryContent}
            >
              {sortedActions
                .filter(action => action.photos.length > 0)
                .map(action => 
                  action.photos.map((photo, photoIndex) => (
                    <TouchableOpacity
                      key={`${action.id}-${photo.id}`}
                      style={styles.photoGalleryItem}
                      onPress={() => {
                        setSelectedAction(action);
                        setActionDetailModalVisible(true);
                      }}
                    >
                      <Image 
                        source={{ uri: photo.uri }} 
                        style={styles.photoGalleryImage} 
                      />
                      <View style={styles.photoGalleryOverlay}>
                        <View style={[styles.photoGalleryCategory, { backgroundColor: getCategoryColor(action.category) }]}>
                          <Ionicons 
                            name={getCategoryIcon(action.category) as any} 
                            size={12} 
                            color="white" 
                          />
                        </View>
                        <Text style={styles.photoGalleryTime}>
                          {new Date(action.time).toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
            </ScrollView>
          </View>
        )}

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? 'アクション履歴' : 'Action History'}
            </Text>
            <View style={styles.actionButtons}>
              {actions.length > 1 && (
                <TouchableOpacity
                  style={[
                    styles.editButton, 
                    { 
                      backgroundColor: isEditMode ? colors.orange[500] : theme.colors.background.secondary,
                      borderColor: isEditMode ? colors.orange[500] : theme.colors.border,
                    }
                  ]}
                  onPress={toggleEditMode}
                >
                  <Ionicons 
                    name={isEditMode ? "checkmark" : "reorder-three"} 
                    size={14} 
                    color={isEditMode ? "white" : theme.colors.text.secondary} 
                  />
                  <Text style={[
                    styles.editButtonText, 
                    { color: isEditMode ? "white" : theme.colors.text.secondary }
                  ]}>
                    {isEditMode 
                      ? (language === 'ja' ? '完了' : 'Done') 
                      : (language === 'ja' ? '並替' : 'Sort')
                    }
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.blue[500] }]}
                onPress={handleAddAction}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={styles.addButtonText}>
                  {language === 'ja' ? '追加' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {isEditMode && (
            <View style={[styles.editModeNotice, { backgroundColor: colors.orange[500] + '20' }]}>
              <Ionicons name="information-circle" size={16} color={colors.orange[500]} />
              <Text style={[styles.editModeNoticeText, { color: colors.orange[500] }]}>
                {language === 'ja' 
                  ? '右側の矢印ボタンで並び替えできます' 
                  : 'Use arrow buttons on the right to reorder'
                }
              </Text>
            </View>
          )}
          
          {sortedActions.length > 0 ? (
            <View style={styles.timeline}>
              {sortedActions.map((action, index) => renderTimelineItem(action, index))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.text.secondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>
                {language === 'ja' 
                  ? 'まだアクションが記録されていません' 
                  : 'No actions recorded yet'
                }
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.text.secondary }]}>
                {language === 'ja' 
                  ? '上の「追加」ボタンから最初のアクションを追加しましょう' 
                  : 'Add your first action using the "Add" button above'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      </View>
      
      <DrawerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
      
      {visit && (
        <ActionModal
          visible={actionModalVisible}
          onClose={handleActionModalClose}
          visitId={visitId}
          parkType={visit.parkType}
          action={editingAction}
          onSave={handleActionSave}
        />
      )}

      <ActionDetailModal
        visible={actionDetailModalVisible}
        onClose={() => setActionDetailModalVisible(false)}
        action={selectedAction || null}
        onEdit={handleEditAction}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing[1],
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing[1],
  },
  editRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  editRecordButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing[1],
  },
  editModeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    marginBottom: spacing[3],
  },
  editModeNoticeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: spacing[2],
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
  timeline: {
    paddingLeft: spacing[2],
    paddingRight: spacing[2],
  },
  timelineItem: {
    flexDirection: 'column',
    marginBottom: spacing[4],
    position: 'relative',
  },
  stepIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  stepConnector: {
    alignItems: 'center',
    marginTop: spacing[2],
  },
  stepLine: {
    width: 2,
    height: spacing[6],
  },
  stepArrow: {
    marginTop: -4,
  },
  moveButtons: {
    position: 'absolute',
    right: 0,
    top: spacing[2],
    flexDirection: 'column',
    gap: spacing[1],
    zIndex: 2,
  },
  moveButton: {
    padding: spacing[1],
    borderRadius: borderRadius.sm,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCard: {
    marginLeft: 40, // Space for step indicator
    marginRight: 8, // Reduced space for wider cards
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  actionCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  actionTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionCategory: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  actionArea: {
    fontSize: 14,
    marginBottom: spacing[3],
  },
  actionCardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  actionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  actionDetailText: {
    fontSize: 12,
  },
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  photoPreviewItem: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  photoPreviewMore: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing[2],
    borderWidth: 2,
    borderColor: 'white',
  },
  photoPreviewMoreText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionNotes: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  photoGalleryContainer: {
    marginTop: spacing[2],
  },
  photoGalleryContent: {
    paddingRight: spacing[2],
  },
  photoGalleryItem: {
    marginRight: spacing[2],
    position: 'relative',
  },
  photoGalleryImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
  },
  photoGalleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    padding: spacing[2],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoGalleryCategory: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGalleryTime: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing[3],
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: spacing[2],
    textAlign: 'center',
    lineHeight: 20,
  },
});

