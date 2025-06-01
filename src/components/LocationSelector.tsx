import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { ActionCategory, ParkArea, ParkType } from '../types/models';
import { SearchableList } from './SearchableList';
import { 
  ALL_PRESETS, 
  PRESET_ATTRACTIONS_BY_AREA,
  PRESET_RESTAURANTS_BY_AREA,
  PRESET_SHOPS_BY_AREA,
  PRESET_GREETINGS_BY_AREA,
} from '../constants/presets';

interface PresetItem {
  id: string;
  name: string;
  nameEn?: string;
  category: ActionCategory;
  parkType: ParkType;
  area: ParkArea;
  tags?: string[];
  isPopular?: boolean;
  isNew?: boolean;
}

interface LocationSelectorProps {
  category: ActionCategory;
  parkType: ParkType;
  selectedArea?: ParkArea;
  selectedLocation?: string;
  onLocationSelect: (locationName: string, presetItem?: PresetItem) => void;
  recentLocations?: PresetItem[];
  style?: any;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  category,
  parkType,
  selectedArea,
  selectedLocation,
  onLocationSelect,
  recentLocations = [],
  style,
}) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [customLocation, setCustomLocation] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<PresetItem | null>(null);
  const slideAnimation = React.useRef(new Animated.Value(0)).current;

  // Get presets for current category and area
  const categoryPresets = useMemo(() => {
    let presetData: Record<string, PresetItem[]> = {};
    
    switch (category) {
      case ActionCategory.ATTRACTION:
        presetData = PRESET_ATTRACTIONS_BY_AREA;
        break;
      case ActionCategory.RESTAURANT:
        presetData = PRESET_RESTAURANTS_BY_AREA;
        break;
      case ActionCategory.SHOPPING:
        presetData = PRESET_SHOPS_BY_AREA;
        break;
      case ActionCategory.GREETING:
        presetData = PRESET_GREETINGS_BY_AREA;
        break;
      case ActionCategory.SHOW:
        // Shows are typically custom entries
        return [];
      default:
        return [];
    }

    if (selectedArea && presetData[selectedArea]) {
      return presetData[selectedArea].filter(item => 
        item.parkType === parkType && item.category === category
      );
    }

    // Return all presets for the category and park if no area selected
    return Object.values(presetData)
      .flat()
      .filter(item => item.parkType === parkType && item.category === category);
  }, [category, parkType, selectedArea]);

  // Popular suggestions based on category
  const popularSuggestions = useMemo(() => {
    return categoryPresets
      .filter(item => item.isPopular)
      .slice(0, 6);
  }, [categoryPresets]);

  // Recent locations filtered by category
  const filteredRecentLocations = useMemo(() => {
    return recentLocations
      .filter(item => item.category === category && item.parkType === parkType)
      .slice(0, 5);
  }, [recentLocations, category, parkType]);

  useEffect(() => {
    Animated.spring(slideAnimation, {
      toValue: mode === 'preset' ? 0 : 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [mode]);

  const getCategoryColor = (category: ActionCategory) => {
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

  const getCategoryIcon = (category: ActionCategory) => {
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
        return 'location';
    }
  };

  const formatAreaName = (area: ParkArea): string => {
    return area.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handlePresetSelect = (item: PresetItem) => {
    setSelectedPreset(item);
    onLocationSelect(item.name, item);
  };

  const handleCustomLocationSubmit = () => {
    if (customLocation.trim()) {
      onLocationSelect(customLocation.trim());
      setCustomLocation('');
    } else {
      Alert.alert('Error', 'Please enter a location name');
    }
  };

  const renderModeToggle = () => (
    <View style={styles.modeToggle}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          {
            backgroundColor: mode === 'preset' 
              ? getCategoryColor(category) 
              : theme.colors.background.elevated,
          },
        ]}
        onPress={() => setMode('preset')}
      >
        <Ionicons
          name="list"
          size={16}
          color={mode === 'preset' ? 'white' : theme.colors.text.secondary}
        />
        <Text
          style={[
            styles.modeButtonText,
            {
              color: mode === 'preset' ? 'white' : theme.colors.text.secondary,
            },
          ]}
        >
          Presets
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modeButton,
          {
            backgroundColor: mode === 'custom' 
              ? getCategoryColor(category) 
              : theme.colors.background.elevated,
          },
        ]}
        onPress={() => setMode('custom')}
      >
        <Ionicons
          name="create"
          size={16}
          color={mode === 'custom' ? 'white' : theme.colors.text.secondary}
        />
        <Text
          style={[
            styles.modeButtonText,
            {
              color: mode === 'custom' ? 'white' : theme.colors.text.secondary,
            },
          ]}
        >
          Custom
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPopularSuggestions = () => {
    if (popularSuggestions.length === 0) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Popular {category.toLowerCase()}s
        </Text>
        <View style={styles.suggestionsList}>
          {popularSuggestions.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.suggestionItem,
                {
                  backgroundColor: selectedPreset?.id === item.id
                    ? getCategoryColor(category)
                    : theme.colors.background.elevated,
                  borderColor: selectedPreset?.id === item.id
                    ? getCategoryColor(category)
                    : theme.colors.border,
                },
              ]}
              onPress={() => handlePresetSelect(item)}
            >
              <View style={styles.suggestionContent}>
                <Text
                  style={[
                    styles.suggestionName,
                    {
                      color: selectedPreset?.id === item.id
                        ? 'white'
                        : theme.colors.text.primary,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.suggestionArea,
                    {
                      color: selectedPreset?.id === item.id
                        ? 'rgba(255, 255, 255, 0.8)'
                        : theme.colors.text.secondary,
                    },
                  ]}
                >
                  {formatAreaName(item.area)}
                </Text>
              </View>
              {item.isNew && (
                <View style={[styles.newBadge, { backgroundColor: colors.green[500] }]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSelectedLocation = () => {
    if (!selectedLocation) return null;

    return (
      <View style={styles.selectedLocationContainer}>
        <LinearGradient
          colors={[getCategoryColor(category), `${getCategoryColor(category)}80`]}
          style={styles.selectedLocationGradient}
        >
          <View style={styles.selectedLocationContent}>
            <Ionicons
              name={getCategoryIcon(category) as any}
              size={20}
              color="white"
            />
            <View style={styles.selectedLocationText}>
              <Text style={styles.selectedLocationName}>{selectedLocation}</Text>
              {selectedPreset && (
                <Text style={styles.selectedLocationArea}>
                  {formatAreaName(selectedPreset.area)}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              onLocationSelect('');
              setSelectedPreset(null);
            }}
            style={styles.clearSelectionButton}
          >
            <Ionicons name="close" size={18} color="white" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons
            name={getCategoryIcon(category) as any}
            size={20}
            color={getCategoryColor(category)}
          />
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Select {category.toLowerCase()} location
          </Text>
        </View>
        {selectedArea && (
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            in {formatAreaName(selectedArea)}
          </Text>
        )}
      </View>

      {renderModeToggle()}
      {renderSelectedLocation()}

      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [
              {
                translateX: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100],
                }),
              },
            ],
          },
        ]}
      >
        {mode === 'preset' ? (
          <View style={styles.presetContent}>
            {renderPopularSuggestions()}
            
            <View style={styles.searchContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Search all locations
              </Text>
              <SearchableList
                category={category}
                parkType={parkType}
                selectedArea={selectedArea}
                onSelect={handlePresetSelect}
                placeholder={`Search ${category.toLowerCase()}s...`}
                maxResults={15}
                showRecent={true}
                recentItems={filteredRecentLocations}
              />
            </View>
          </View>
        ) : (
          <View style={styles.customContent}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Enter custom location
            </Text>
            <Text style={[styles.customDescription, { color: theme.colors.text.secondary }]}>
              Can't find your location in the presets? Enter it manually.
            </Text>
            
            <View style={styles.customInputContainer}>
              <View
                style={[
                  styles.customInput,
                  {
                    backgroundColor: theme.colors.background.elevated,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                  style={styles.customInputIcon}
                />
                <TextInput
                  style={[
                    styles.customInputText,
                    { color: theme.colors.text.primary }
                  ]}
                  value={customLocation}
                  onChangeText={setCustomLocation}
                  placeholder={`Enter ${category.toLowerCase()} name...`}
                  placeholderTextColor={theme.colors.text.tertiary}
                  returnKeyType="done"
                  onSubmitEditing={handleCustomLocationSubmit}
                  autoCapitalize="words"
                />
              </View>
              
              <TouchableOpacity
                style={[
                  styles.customSubmitButton,
                  {
                    backgroundColor: getCategoryColor(category),
                    opacity: customLocation.trim() ? 1 : 0.5,
                  },
                ]}
                onPress={handleCustomLocationSubmit}
                disabled={!customLocation.trim()}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: spacing[2],
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: spacing[1],
  },
  modeToggle: {
    flexDirection: 'row',
    margin: spacing[4],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing[1],
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing[1],
  },
  selectedLocationContainer: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  selectedLocationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
  },
  selectedLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedLocationText: {
    marginLeft: spacing[2],
    flex: 1,
  },
  selectedLocationName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedLocationArea: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  clearSelectionButton: {
    padding: spacing[1],
  },
  contentContainer: {
    flex: 1,
  },
  presetContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  suggestionsContainer: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing[3],
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing[1],
  },
  suggestionItem: {
    position: 'relative',
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: spacing[2],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  suggestionArea: {
    fontSize: 11,
    fontWeight: '500',
  },
  newBadge: {
    position: 'absolute',
    top: spacing[1],
    right: spacing[1],
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flex: 1,
  },
  customContent: {
    padding: spacing[4],
  },
  customDescription: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    marginRight: spacing[2],
  },
  customInputIcon: {
    marginRight: spacing[2],
  },
  customInputText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  customSubmitButton: {
    padding: spacing[3],
    borderRadius: borderRadius.lg,
  },
});