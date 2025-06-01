import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Visit, TimelineAction, ParkType } from '../types/models';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { TimelineAction as TimelineActionComponent } from './TimelineAction';

const { width } = Dimensions.get('window');

interface VisitCardProps {
  visit: Visit;
  actions: TimelineAction[];
  isExpanded?: boolean;
  onToggleExpand: () => void;
  onReorderActions: (actionIds: string[]) => void;
  onActionPress: (action: TimelineAction) => void;
  onAddAction: () => void;
}

export const VisitCard: React.FC<VisitCardProps> = ({
  visit,
  actions,
  isExpanded = false,
  onToggleExpand,
  onReorderActions,
  onActionPress,
  onAddAction,
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [expandAnimation] = useState(new Animated.Value(isExpanded ? 1 : 0));

  // Animate expansion
  React.useEffect(() => {
    Animated.timing(expandAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [isExpanded, expandAnimation]);

  const animatedHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300], // Adjust based on content
    extrapolate: 'clamp',
  });

  const rotateIcon = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getParkIcon = () => {
    return visit.parkType === ParkType.LAND ? 'castle' : 'boat';
  };

  const getParkColor = () => {
    return visit.parkType === ParkType.LAND ? colors.purple[500] : colors.blue[500];
  };

  const getVisitDuration = () => {
    if (visit.startTime && visit.endTime) {
      const duration = new Date(visit.endTime).getTime() - new Date(visit.startTime).getTime();
      const hours = Math.floor(duration / (1000 * 60 * 60));
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    return null;
  };

  const getProgressPercentage = () => {
    if (!visit.startTime || !visit.endTime) return 0;
    const totalDuration = new Date(visit.endTime).getTime() - new Date(visit.startTime).getTime();
    const currentTime = new Date().getTime();
    const elapsed = currentTime - new Date(visit.startTime).getTime();
    return Math.min(Math.max(elapsed / totalDuration, 0), 1) * 100;
  };

  return (
    <View style={[styles.container, { marginBottom: spacing[4] }]}>
      {/* Glass morphism card */}
      <BlurView
        intensity={isDark ? 20 : 80}
        style={[
          styles.card,
          {
            backgroundColor: isDark 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(255, 255, 255, 0.3)',
          },
        ]}
      >
        <LinearGradient
          colors={
            visit.parkType === ParkType.LAND
              ? ['rgba(168, 85, 247, 0.1)', 'rgba(147, 51, 234, 0.05)']
              : ['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.05)']
          }
          style={styles.gradientOverlay}
        >
          {/* Card Header */}
          <TouchableOpacity
            style={styles.header}
            onPress={onToggleExpand}
            activeOpacity={0.7}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.parkIcon,
                  { backgroundColor: `${getParkColor()}20` },
                ]}
              >
                <Ionicons
                  name={getParkIcon() as any}
                  size={24}
                  color={getParkColor()}
                />
              </View>
              <View style={styles.headerInfo}>
                <Text
                  style={[
                    styles.dateText,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {formatDate(visit.date)}
                </Text>
                <View style={styles.metaRow}>
                  <Text
                    style={[
                      styles.parkText,
                      { color: getParkColor() },
                    ]}
                  >
                    {visit.parkType === ParkType.LAND ? 'Disneyland' : 'DisneySea'}
                  </Text>
                  {visit.startTime && visit.endTime && (
                    <>
                      <Text style={[styles.separator, { color: theme.colors.text.tertiary }]}>
                        •
                      </Text>
                      <Text
                        style={[
                          styles.timeText,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        {formatTime(visit.startTime)} - {formatTime(visit.endTime)}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.text.primary }]}>
                    {actions.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                    actions
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.text.primary }]}>
                    {actions.reduce((sum, action) => sum + action.photos.length, 0)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                    photos
                  </Text>
                </View>
              </View>
              <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={theme.colors.text.tertiary}
                />
              </Animated.View>
            </View>
          </TouchableOpacity>

          {/* Progress Bar */}
          {getVisitDuration() && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: `${getParkColor()}20` },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: getParkColor(),
                      width: `${getProgressPercentage()}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.durationText, { color: theme.colors.text.secondary }]}>
                {getVisitDuration()}
              </Text>
            </View>
          )}

          {/* Expandable Content */}
          <Animated.View
            style={[
              styles.expandableContent,
              {
                height: animatedHeight,
                opacity: expandAnimation,
              },
            ]}
          >
            <View style={styles.actionsContainer}>
              <View style={styles.actionsHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  Timeline
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: `${getParkColor()}20` },
                  ]}
                  onPress={onAddAction}
                >
                  <Ionicons name="add" size={20} color={getParkColor()} />
                </TouchableOpacity>
              </View>

              {actions.length > 0 ? (
                <View style={styles.timelineContainer}>
                  {actions.map((action, index) => (
                    <TimelineActionComponent
                      key={action.id}
                      action={action}
                      isLast={index === actions.length - 1}
                      onPress={() => onActionPress(action)}
                      onLongPress={() => {}}
                      isDragActive={false}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="calendar-outline"
                    size={32}
                    color={theme.colors.text.tertiary}
                  />
                  <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                    No timeline actions yet
                  </Text>
                  <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>
                    Tap the + button to add your first action
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </LinearGradient>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[5],
  },
  card: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gradientOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[5],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parkIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  headerInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    fontSize: 14,
    marginHorizontal: spacing[2],
  },
  timeText: {
    fontSize: 14,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginRight: spacing[3],
  },
  statItem: {
    alignItems: 'center',
    marginLeft: spacing[3],
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: spacing[3],
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  expandableContent: {
    overflow: 'hidden',
  },
  actionsContainer: {
    padding: spacing[5],
    paddingTop: 0,
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing[2],
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing[1],
  },
});