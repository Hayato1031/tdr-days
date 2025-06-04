import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ActionCategory, ParkType, ParkArea } from '../types/models';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import {
  PRESET_ATTRACTIONS_BY_AREA,
  PRESET_RESTAURANTS_BY_AREA,
  PRESET_SHOPS_BY_AREA,
  PRESET_GREETING_BY_AREA,
} from '../constants/presets';

interface LocationSelectorProps {
  category: ActionCategory;
  parkType: ParkType;
  area: ParkArea;
  selectedLocation: string;
  onLocationSelect: (locationName: string) => void;
  onCustomLocation?: (locationName: string) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  category,
  parkType,
  area,
  selectedLocation,
  onLocationSelect,
  onCustomLocation,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const presetLocations = useMemo(() => {
    const parkKey = parkType === ParkType.LAND ? 'land' : 'sea';
    
    let locations: string[] = [];
    
    switch (category) {
      case ActionCategory.ATTRACTION:
        locations = PRESET_ATTRACTIONS_BY_AREA[parkKey]?.[area] || [];
        break;
      case ActionCategory.RESTAURANT:
        locations = PRESET_RESTAURANTS_BY_AREA[parkKey]?.[area] || [];
        break;
      case ActionCategory.SHOPPING:
        locations = PRESET_SHOPS_BY_AREA[parkKey]?.[area] || [];
        break;
      case ActionCategory.GREETING:
        locations = PRESET_GREETING_BY_AREA[parkKey]?.[area] || [];
        break;
      case ActionCategory.SHOW:
        // Shows don't have specific presets, allow custom input
        locations = [];
        break;
      default:
        locations = [];
    }
    
    return locations;
  }, [category, parkType, area]);

  const filteredLocations = useMemo(() => {
    if (!searchText) return presetLocations;
    
    return presetLocations.filter(location =>
      location.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [presetLocations, searchText]);

  const handleLocationSelect = (location: string) => {
    onLocationSelect(location);
    setIsOpen(false);
    setSearchText('');
  };

  const handleCustomSubmit = () => {
    if (searchText.trim()) {
      onCustomLocation?.(searchText.trim());
      onLocationSelect(searchText.trim());
      setSearchText('');
      setIsOpen(false);
    }
  };

  const handleToggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchText('');
    }
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
        return 'location';
    }
  };

  const getCategoryName = (category: ActionCategory): string => {
    if (language === 'ja') {
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
          return '施設';
      }
    } else {
      switch (category) {
        case ActionCategory.ATTRACTION:
          return 'Attraction';
        case ActionCategory.RESTAURANT:
          return 'Restaurant';
        case ActionCategory.SHOW:
          return 'Show';
        case ActionCategory.GREETING:
          return 'Greeting';
        case ActionCategory.SHOPPING:
          return 'Shopping';
        default:
          return 'Facility';
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Dropdown Button */}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          {
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.border,
          }
        ]}
        onPress={handleToggleOpen}
      >
        <View style={styles.dropdownContent}>
          <Ionicons 
            name={getCategoryIcon(category) as any} 
            size={18} 
            color={theme.colors.text.secondary}
            style={styles.categoryIcon}
          />
          {selectedLocation ? (
            <Text style={[styles.selectedText, { color: theme.colors.text.primary }]}>
              {selectedLocation}
            </Text>
          ) : (
            <Text style={[styles.placeholderText, { color: theme.colors.text.secondary }]}>
              {language === 'ja' ? `${getCategoryName(category)}を選択してください` : `Please select a ${getCategoryName(category).toLowerCase()}`}
            </Text>
          )}
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={theme.colors.text.secondary} 
        />
      </TouchableOpacity>

      {/* Dropdown List */}
      {isOpen && (
        <View style={[styles.dropdownList, { backgroundColor: theme.colors.background.card }]}>
          {/* Search Input */}
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.background.secondary }]}>
            <Ionicons name="search" size={16} color={theme.colors.text.secondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={language === 'ja' ? `${getCategoryName(category)}を検索または入力...` : `Search or enter ${getCategoryName(category).toLowerCase()}...`}
              placeholderTextColor={theme.colors.text.secondary}
              onSubmitEditing={handleCustomSubmit}
              returnKeyType="done"
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Location Options */}
          <ScrollView 
            style={styles.optionsList} 
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Preset Locations */}
            {filteredLocations.map((location, index) => {
              const isSelected = selectedLocation === location;
              return (
                <TouchableOpacity
                  key={`preset-${location}-${index}`}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor: isSelected 
                        ? colors.blue[500] + '20'
                        : 'transparent',
                    }
                  ]}
                  onPress={() => handleLocationSelect(location)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="business" 
                    size={16} 
                    color={isSelected ? colors.blue[500] : theme.colors.text.secondary}
                    style={styles.optionIcon}
                  />
                  <Text style={[
                    styles.optionText,
                    { 
                      color: isSelected ? colors.blue[500] : theme.colors.text.primary,
                      fontWeight: isSelected ? '600' : '400'
                    }
                  ]}>
                    {location}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={colors.blue[500]} />
                  )}
                </TouchableOpacity>
              );
            })}
            
            {/* Custom Location Option */}
            {searchText.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  styles.customOption,
                  { backgroundColor: colors.green[500] + '10' }
                ]}
                onPress={handleCustomSubmit}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="add-circle-outline" 
                  size={16} 
                  color={colors.green[500]}
                  style={styles.optionIcon}
                />
                <Text style={[styles.optionText, { color: colors.green[500], fontWeight: '600' }]}>
                  {language === 'ja' ? `「${searchText}」を追加` : `Add "${searchText}"`}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* No Results */}
            {filteredLocations.length === 0 && searchText.length === 0 && presetLocations.length === 0 && (
              <View style={styles.noResults}>
                <Text style={[styles.noResultsText, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? 'このカテゴリには定型の施設がありません' : 'No preset facilities for this category'}
                </Text>
                <Text style={[styles.noResultsSubtext, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? '上の検索欄に施設名を入力してください' : 'Please enter a facility name in the search field above'}
                </Text>
              </View>
            )}
            
            {filteredLocations.length === 0 && searchText.length > 0 && (
              <View style={styles.noResults}>
                <Text style={[styles.noResultsText, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? `「${searchText}」に一致する施設が見つかりません` : `No facilities found matching "${searchText}"`}
                </Text>
                <Text style={[styles.noResultsSubtext, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? '新しい施設として追加するには上の緑色のオプションをタップしてください' : 'Tap the green option above to add as a new facility'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minHeight: 48,
  },
  dropdownContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: spacing[2],
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    maxHeight: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: spacing[2],
    paddingVertical: spacing[1],
  },
  clearButton: {
    padding: spacing[1],
  },
  optionsList: {
    flex: 1,
    maxHeight: 240,
  },
  optionsContent: {
    paddingBottom: spacing[2],
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  optionIcon: {
    marginRight: spacing[2],
    width: 16,
  },
  optionText: {
    fontSize: 15,
    flex: 1,
  },
  customOption: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  noResults: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  noResultsSubtext: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});