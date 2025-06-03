import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TimelineAction, ActionCategory } from '../types/models';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface ActionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  action: TimelineAction | null;
  onEdit?: (action: TimelineAction) => void;
}

export const ActionDetailModal: React.FC<ActionDetailModalProps> = ({
  visible,
  onClose,
  action,
  onEdit,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (!action) return null;

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
      default:
        return colors.gray[500];
    }
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
        return language === 'ja' ? 'グリーティング' : 'Character Greeting';
      case ActionCategory.SHOPPING:
        return language === 'ja' ? 'ショッピング' : 'Shopping';
      default:
        return language === 'ja' ? 'その他' : 'Other';
    }
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        {/* Header */}
        <LinearGradient
          colors={[
            getCategoryColor(action.category) + '20',
            getCategoryColor(action.category) + '10',
          ]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(action.category) }]}>
                <Ionicons 
                  name={getCategoryIcon(action.category) as any} 
                  size={24} 
                  color="white" 
                />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.locationName, { color: theme.colors.text.primary }]}>
                  {action.locationName}
                </Text>
                <Text style={[styles.categoryText, { color: theme.colors.text.secondary }]}>
                  {getCategoryName(action.category)} • {action.area}
                </Text>
                <Text style={[styles.timeText, { color: theme.colors.text.secondary }]}>
                  {formatTime(action.time)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => onEdit?.(action)}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Details Section */}
          <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? '詳細情報' : 'Details'}
            </Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="time" size={16} color={theme.colors.text.secondary} />
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? '時刻' : 'Time'}
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {formatTime(action.time)}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="location" size={16} color={theme.colors.text.secondary} />
                <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? 'エリア' : 'Area'}
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {action.area}
                </Text>
              </View>

              {/* Attraction specific details */}
              {action.category === ActionCategory.ATTRACTION && (
                <>
                  {action.waitTime && (
                    <View style={styles.detailItem}>
                      <Ionicons name="hourglass" size={16} color={theme.colors.text.secondary} />
                      <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                        {language === 'ja' ? '待ち時間' : 'Wait Time'}
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                        {language === 'ja' ? `${action.waitTime}分` : `${action.waitTime}min`}
                      </Text>
                    </View>
                  )}
                  
                  {action.duration && (
                    <View style={styles.detailItem}>
                      <Ionicons name="stopwatch" size={16} color={theme.colors.text.secondary} />
                      <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                        {language === 'ja' ? '体験時間' : 'Duration'}
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                        {language === 'ja' ? `${action.duration}分` : `${action.duration}min`}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

          </View>

          {/* Notes Section */}
          {action.notes && (
            <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {language === 'ja' ? 'メモ' : 'Notes'}
              </Text>
              <Text style={[styles.notesText, { color: theme.colors.text.primary }]}>
                {action.notes}
              </Text>
            </View>
          )}

          {/* Photos Section */}
          {action.photos.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {language === 'ja' 
                  ? `写真 (${action.photos.length}枚)` 
                  : `Photos (${action.photos.length})`
                }
              </Text>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.photosContainer}
                contentContainerStyle={styles.photosContent}
              >
                {action.photos.map((photo, index) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.photoItem}
                    onPress={() => setSelectedPhotoIndex(index)}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.photo} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Photo Full Screen Modal */}
        {selectedPhotoIndex !== null && (
          <Modal
            visible={true}
            animationType="fade"
            onRequestClose={() => setSelectedPhotoIndex(null)}
          >
            <View style={styles.photoModal}>
              <TouchableOpacity
                style={styles.photoModalClose}
                onPress={() => setSelectedPhotoIndex(null)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: selectedPhotoIndex * screenWidth, y: 0 }}
              >
                {action.photos.map((photo, index) => (
                  <View key={photo.id} style={styles.photoModalItem}>
                    <Image 
                      source={{ uri: photo.uri }} 
                      style={styles.photoModalImage} 
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </ScrollView>
              
              <View style={styles.photoCounter}>
                <Text style={styles.photoCounterText}>
                  {(selectedPhotoIndex || 0) + 1} / {action.photos.length}
                </Text>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing[8],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  closeButton: {
    padding: spacing[2],
    marginRight: spacing[2],
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  headerText: {
    flex: 1,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  categoryText: {
    fontSize: 14,
    marginBottom: spacing[1],
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    padding: spacing[2],
    marginLeft: spacing[2],
  },
  content: {
    flex: 1,
  },
  section: {
    margin: spacing[4],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  detailsGrid: {
    gap: spacing[3],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    marginLeft: spacing[2],
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginLeft: spacing[2],
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  photosContainer: {
    marginTop: spacing[2],
  },
  photosContent: {
    paddingRight: spacing[2],
  },
  photoItem: {
    marginRight: spacing[2],
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
  },
  photoModal: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    padding: spacing[2],
  },
  photoModalItem: {
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalImage: {
    width: screenWidth,
    height: '80%',
  },
  photoCounter: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  photoCounterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});