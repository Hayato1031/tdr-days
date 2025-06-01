import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TimelineAction as TimelineActionType, ActionCategory } from '../types/models';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';

interface TimelineActionProps {
  action: TimelineActionType;
  isLast?: boolean;
  onPress: () => void;
  onLongPress: () => void;
  isDragActive?: boolean;
  dragHandleProps?: any;
}

export const TimelineAction: React.FC<TimelineActionProps> = ({
  action,
  isLast = false,
  onPress,
  onLongPress,
  isDragActive = false,
  dragHandleProps,
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnimation, {
      toValue: isDragActive ? 1.05 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [isDragActive, scaleAnimation]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getCategoryIcon = () => {
    switch (action.category) {
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
        return 'calendar';
    }
  };

  const getCategoryColor = () => {
    switch (action.category) {
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

  const getDurationText = () => {
    if (action.duration) {
      const hours = Math.floor(action.duration / 60);
      const minutes = action.duration % 60;
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    return null;
  };

  const getWaitTimeText = () => {
    if (action.waitTime && action.waitTime > 0) {
      return `Wait: ${action.waitTime}m`;
    }
    return null;
  };

  const getRatingStars = () => {
    if (!action.rating) return null;
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < action.rating! ? 'star' : 'star-outline'}
        size={12}
        color={colors.yellow[500]}
        style={{ marginRight: 2 }}
      />
    ));
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnimation }],
          opacity: isDragActive ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.timelineRow}>
        {/* Timeline Connector */}
        <View style={styles.timelineConnector}>
          <View
            style={[
              styles.timelineNode,
              {
                backgroundColor: getCategoryColor(),
                borderColor: theme.colors.background.primary,
              },
            ]}
          >
            <Ionicons
              name={getCategoryIcon() as any}
              size={14}
              color="white"
            />
          </View>
          {!isLast && (
            <View
              style={[
                styles.timelineLine,
                { backgroundColor: theme.colors.border },
              ]}
            />
          )}
        </View>

        {/* Action Card */}
        <TouchableOpacity
          style={[
            styles.actionCard,
            {
              backgroundColor: isDark
                ? theme.colors.background.secondary
                : theme.colors.background.elevated,
              shadowColor: isDragActive ? getCategoryColor() : theme.colors.shadow,
            },
          ]}
          onPress={onPress}
          onLongPress={onLongPress}
          activeOpacity={0.7}
          {...dragHandleProps}
        >
          <LinearGradient
            colors={[
              `${getCategoryColor()}10`,
              `${getCategoryColor()}05`,
            ]}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Text
                  style={[
                    styles.timeText,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  {formatTime(action.time)}
                </Text>
                <Text
                  style={[
                    styles.locationText,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {action.locationName}
                </Text>
              </View>

              <View style={styles.headerRight}>
                {/* Photos indicator */}
                {action.photos.length > 0 && (
                  <View style={styles.photoIndicator}>
                    {action.photos.slice(0, 3).map((photo, index) => (
                      <View
                        key={photo.id}
                        style={[
                          styles.photoThumbnail,
                          { marginLeft: index > 0 ? -8 : 0 },
                        ]}
                      >
                        <Image
                          source={{ uri: photo.thumbnailUri || photo.uri }}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                      </View>
                    ))}
                    {action.photos.length > 3 && (
                      <View
                        style={[
                          styles.photoThumbnail,
                          styles.morePhotos,
                          { backgroundColor: `${getCategoryColor()}20`, marginLeft: -8 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.morePhotosText,
                            { color: getCategoryColor() },
                          ]}
                        >
                          +{action.photos.length - 3}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Drag handle */}
                <TouchableOpacity
                  style={styles.dragHandle}
                  {...dragHandleProps}
                >
                  <Ionicons
                    name="reorder-two"
                    size={16}
                    color={theme.colors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Meta information */}
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                {getDurationText() && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={theme.colors.text.tertiary}
                    />
                    <Text
                      style={[
                        styles.metaText,
                        { color: theme.colors.text.secondary },
                      ]}
                    >
                      {getDurationText()}
                    </Text>
                  </View>
                )}

                {getWaitTimeText() && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="hourglass-outline"
                      size={12}
                      color={theme.colors.text.tertiary}
                    />
                    <Text
                      style={[
                        styles.metaText,
                        { color: theme.colors.text.secondary },
                      ]}
                    >
                      {getWaitTimeText()}
                    </Text>
                  </View>
                )}

                {action.rating && (
                  <View style={[styles.metaItem, styles.ratingContainer]}>
                    {getRatingStars()}
                  </View>
                )}
              </View>

              {/* Notes preview */}
              {action.notes && (
                <Text
                  style={[
                    styles.notesText,
                    { color: theme.colors.text.secondary },
                  ]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {action.notes}
                </Text>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineConnector: {
    alignItems: 'center',
    marginRight: spacing[3],
    width: 24,
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    opacity: 0.3,
  },
  actionCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
  },
  cardGradient: {
    padding: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing[3],
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing[1],
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoIndicator: {
    flexDirection: 'row',
    marginRight: spacing[2],
  },
  photoThumbnail: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  morePhotos: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 8,
    fontWeight: '600',
  },
  dragHandle: {
    padding: spacing[1],
  },
  metaContainer: {
    marginTop: spacing[1],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing[3],
    marginBottom: spacing[1],
  },
  metaText: {
    fontSize: 12,
    marginLeft: spacing[1],
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing[1],
    fontStyle: 'italic',
  },
});