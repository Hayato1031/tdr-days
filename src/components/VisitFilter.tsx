import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker'; // Removed dependency
import { VisitFilter as VisitFilterType, ParkType, Companion } from '../types/models';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';

interface VisitFilterProps {
  filter?: VisitFilterType;
  companions?: Companion[];
  onFilterChange?: (filter: VisitFilterType) => void;
}

export const VisitFilter: React.FC<VisitFilterProps> = (props) => {
  const {
    filter = {},
    companions = [],
    onFilterChange = () => {},
  } = props || {};
  
  // Safely use theme with fallback
  let theme, isDark;
  try {
    const themeContext = useTheme();
    theme = themeContext?.theme || { mode: 'light', colors: { text: { primary: '#000' } } };
    isDark = theme.mode === 'dark';
  } catch (error) {
    console.warn('Theme context not available, using defaults');
    theme = { mode: 'light', colors: { text: { primary: '#000' } } };
    isDark = false;
  }
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const expandAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(expandAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [isExpanded, expandAnimation]);

  const animatedHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
    extrapolate: 'clamp',
  });

  const rotateIcon = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const formatDate = (date?: Date) => {
    if (!date) return 'Select Date';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filter.parkType) count++;
    if (filter.dateRange) count++;
    if (filter.companionIds?.length) count++;
    return count;
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const toggleParkType = (parkType: ParkType) => {
    onFilterChange({
      ...filter,
      parkType: filter.parkType === parkType ? undefined : parkType,
    });
  };

  const setDateRange = (startDate?: Date, endDate?: Date) => {
    if (startDate && endDate) {
      onFilterChange({
        ...filter,
        dateRange: { startDate, endDate },
      });
    } else {
      const currentRange = filter.dateRange;
      onFilterChange({
        ...filter,
        dateRange: {
          startDate: startDate || currentRange?.startDate || new Date(),
          endDate: endDate || currentRange?.endDate || new Date(),
        },
      });
    }
  };

  const clearDateRange = () => {
    onFilterChange({
      ...filter,
      dateRange: undefined,
    });
  };

  const toggleCompanion = (companionId: string) => {
    const currentIds = filter.companionIds || [];
    const newIds = currentIds.includes(companionId)
      ? currentIds.filter(id => id !== companionId)
      : [...currentIds, companionId];
    
    onFilterChange({
      ...filter,
      companionIds: newIds.length > 0 ? newIds : undefined,
    });
  };

  const getSelectedCompanionsText = () => {
    if (!filter.companionIds?.length) return 'All companions';
    if (filter.companionIds.length === 1) {
      const companion = companions.find(c => c.id === filter.companionIds![0]);
      return companion?.name || 'Unknown';
    }
    return `${filter.companionIds.length} companions`;
  };

  return (
    <View style={styles.container}>
      {/* Filter Toggle Button */}
      <TouchableOpacity
        style={[
          styles.toggleButton,
          {
            backgroundColor: isDark
              ? theme.colors.background.secondary
              : theme.colors.background.elevated,
          },
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.1)', 'rgba(147, 51, 234, 0.05)']}
          style={styles.toggleGradient}
        >
          <View style={styles.toggleLeft}>
            <Ionicons
              name="funnel"
              size={20}
              color={colors.purple[500]}
            />
            <Text style={[styles.toggleText, { color: theme.colors.text.primary }]}>
              Filters
            </Text>
            {getActiveFiltersCount() > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.purple[500] }]}>
                <Text style={styles.badgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.toggleRight}>
            {getActiveFiltersCount() > 0 && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  clearAllFilters();
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            )}
            <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.colors.text.secondary}
              />
            </Animated.View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Expandable Filter Content */}
      <Animated.View
        style={[
          styles.expandableContent,
          {
            height: animatedHeight,
            opacity: expandAnimation,
          },
        ]}
      >
        <BlurView
          intensity={isDark ? 20 : 80}
          style={[
            styles.filterPanel,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.3)',
            },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Park Type Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Park
              </Text>
              <View style={styles.parkTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.parkTypeButton,
                    {
                      backgroundColor: filter.parkType === ParkType.LAND
                        ? colors.purple[500]
                        : theme.colors.background.elevated,
                      borderColor: filter.parkType === ParkType.LAND
                        ? colors.purple[500]
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => toggleParkType(ParkType.LAND)}
                >
                  <Ionicons
                    name="castle"
                    size={20}
                    color={filter.parkType === ParkType.LAND ? 'white' : colors.purple[500]}
                  />
                  <Text
                    style={[
                      styles.parkTypeText,
                      {
                        color: filter.parkType === ParkType.LAND
                          ? 'white'
                          : theme.colors.text.primary,
                      },
                    ]}
                  >
                    Disneyland
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.parkTypeButton,
                    {
                      backgroundColor: filter.parkType === ParkType.SEA
                        ? colors.blue[500]
                        : theme.colors.background.elevated,
                      borderColor: filter.parkType === ParkType.SEA
                        ? colors.blue[500]
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => toggleParkType(ParkType.SEA)}
                >
                  <Ionicons
                    name="boat"
                    size={20}
                    color={filter.parkType === ParkType.SEA ? 'white' : colors.blue[500]}
                  />
                  <Text
                    style={[
                      styles.parkTypeText,
                      {
                        color: filter.parkType === ParkType.SEA
                          ? 'white'
                          : theme.colors.text.primary,
                      },
                    ]}
                  >
                    DisneySea
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  Date Range
                </Text>
                {filter.dateRange && (
                  <TouchableOpacity onPress={clearDateRange} style={styles.clearSectionButton}>
                    <Text style={[styles.clearSectionText, { color: colors.purple[500] }]}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.dateRangeContainer}>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: theme.colors.background.elevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={theme.colors.text.secondary}
                  />
                  <Text style={[styles.dateText, { color: theme.colors.text.primary }]}>
                    {formatDate(filter.dateRange?.startDate)}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dateSeparator}>
                  <Text style={[styles.separatorText, { color: theme.colors.text.tertiary }]}>
                    to
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: theme.colors.background.elevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={theme.colors.text.secondary}
                  />
                  <Text style={[styles.dateText, { color: theme.colors.text.primary }]}>
                    {formatDate(filter.dateRange?.endDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Companions Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Companions
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
                {getSelectedCompanionsText()}
              </Text>
              
              <View style={styles.companionsContainer}>
                {companions.map(companion => (
                  <TouchableOpacity
                    key={companion.id}
                    style={[
                      styles.companionChip,
                      {
                        backgroundColor: filter.companionIds?.includes(companion.id)
                          ? colors.purple[500]
                          : theme.colors.background.elevated,
                        borderColor: filter.companionIds?.includes(companion.id)
                          ? colors.purple[500]
                          : theme.colors.border,
                      },
                    ]}
                    onPress={() => toggleCompanion(companion.id)}
                  >
                    <Text
                      style={[
                        styles.companionText,
                        {
                          color: filter.companionIds?.includes(companion.id)
                            ? 'white'
                            : theme.colors.text.primary,
                        },
                      ]}
                    >
                      {companion.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </BlurView>
      </Animated.View>

      {/* Date Pickers - Functionality disabled due to removed dependency */}
      {showStartDatePicker && (
        <Modal transparent visible={showStartDatePicker}>
          <View style={styles.datePickerModal}>
            <View style={[styles.datePickerContent, { backgroundColor: theme.colors.background.elevated }]}>
              <Text style={[styles.datePickerText, { color: theme.colors.text.primary }]}>
                Date picker functionality is unavailable
              </Text>
              <TouchableOpacity
                style={[styles.datePickerButton, { backgroundColor: colors.purple[500] }]}
                onPress={() => setShowStartDatePicker(false)}
              >
                <Text style={styles.datePickerButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {showEndDatePicker && (
        <Modal transparent visible={showEndDatePicker}>
          <View style={styles.datePickerModal}>
            <View style={[styles.datePickerContent, { backgroundColor: theme.colors.background.elevated }]}>
              <Text style={[styles.datePickerText, { color: theme.colors.text.primary }]}>
                Date picker functionality is unavailable
              </Text>
              <TouchableOpacity
                style={[styles.datePickerButton, { backgroundColor: colors.purple[500] }]}
                onPress={() => setShowEndDatePicker(false)}
              >
                <Text style={styles.datePickerButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  toggleButton: {
    marginHorizontal: spacing[5],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  toggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing[2],
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing[2],
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: spacing[2],
  },
  expandableContent: {
    overflow: 'hidden',
    marginTop: spacing[2],
  },
  filterPanel: {
    marginHorizontal: spacing[5],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  filterSection: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: spacing[1],
    marginBottom: spacing[3],
  },
  clearSectionButton: {
    padding: spacing[1],
  },
  clearSectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  parkTypeContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  parkTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  parkTypeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing[2],
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 14,
    marginLeft: spacing[2],
  },
  dateSeparator: {
    paddingHorizontal: spacing[3],
  },
  separatorText: {
    fontSize: 14,
  },
  companionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  companionChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  companionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContent: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    margin: spacing[4],
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
    marginBottom: spacing[4],
  },
  datePickerButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  datePickerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});