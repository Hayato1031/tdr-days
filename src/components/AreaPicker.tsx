import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { ParkArea, LandArea, SeaArea, ParkType } from '../types/models';

interface AreaPickerProps {
  parkType: ParkType;
  selectedArea?: ParkArea | '';
  onAreaSelect?: (area: ParkArea) => void;
  onSelect?: (area: ParkArea) => void;
  disabled?: boolean;
  style?: any;
}

interface AreaOption {
  value: ParkArea;
  label: string;
  emoji: string;
}

export const AreaPicker: React.FC<AreaPickerProps> = ({
  parkType,
  selectedArea,
  onAreaSelect,
  onSelect,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Area translation function
  const getAreaLabel = (area: ParkArea): string => {
    if (language === 'ja') {
      return area;
    }
    
    // English translations
    switch (area) {
      // Disneyland areas
      case LandArea.WORLD_BAZAAR:
        return 'World Bazaar';
      case LandArea.ADVENTURELAND:
        return 'Adventureland';
      case LandArea.WESTERNLAND:
        return 'Westernland';
      case LandArea.CRITTER_COUNTRY:
        return 'Critter Country';
      case LandArea.FANTASYLAND:
        return 'Fantasyland';
      case LandArea.TOONTOWN:
        return 'Toontown';
      case LandArea.TOMORROWLAND:
        return 'Tomorrowland';
      
      // DisneySea areas
      case SeaArea.MEDITERRANEAN_HARBOR:
        return 'Mediterranean Harbor';
      case SeaArea.AMERICAN_WATERFRONT:
        return 'American Waterfront';
      case SeaArea.PORT_DISCOVERY:
        return 'Port Discovery';
      case SeaArea.LOST_RIVER_DELTA:
        return 'Lost River Delta';
      case SeaArea.ARABIAN_COAST:
        return 'Arabian Coast';
      case SeaArea.MERMAID_LAGOON:
        return 'Mermaid Lagoon';
      case SeaArea.MYSTERIOUS_ISLAND:
        return 'Mysterious Island';
      case SeaArea.FANTASY_SPRINGS:
        return 'Fantasy Springs';
      
      default:
        return area;
    }
  };

  // Area options for both parks
  const landAreas: AreaOption[] = [
    { value: LandArea.WORLD_BAZAAR, label: getAreaLabel(LandArea.WORLD_BAZAAR), emoji: '🏪' },
    { value: LandArea.ADVENTURELAND, label: getAreaLabel(LandArea.ADVENTURELAND), emoji: '🌴' },
    { value: LandArea.WESTERNLAND, label: getAreaLabel(LandArea.WESTERNLAND), emoji: '🤠' },
    { value: LandArea.CRITTER_COUNTRY, label: getAreaLabel(LandArea.CRITTER_COUNTRY), emoji: '🐻' },
    { value: LandArea.FANTASYLAND, label: getAreaLabel(LandArea.FANTASYLAND), emoji: '🏰' },
    { value: LandArea.TOONTOWN, label: getAreaLabel(LandArea.TOONTOWN), emoji: '🎭' },
    { value: LandArea.TOMORROWLAND, label: getAreaLabel(LandArea.TOMORROWLAND), emoji: '🚀' },
  ];

  const seaAreas: AreaOption[] = [
    { value: SeaArea.MEDITERRANEAN_HARBOR, label: getAreaLabel(SeaArea.MEDITERRANEAN_HARBOR), emoji: '🏛️' },
    { value: SeaArea.AMERICAN_WATERFRONT, label: getAreaLabel(SeaArea.AMERICAN_WATERFRONT), emoji: '🗽' },
    { value: SeaArea.PORT_DISCOVERY, label: getAreaLabel(SeaArea.PORT_DISCOVERY), emoji: '🔬' },
    { value: SeaArea.LOST_RIVER_DELTA, label: getAreaLabel(SeaArea.LOST_RIVER_DELTA), emoji: '🏺' },
    { value: SeaArea.ARABIAN_COAST, label: getAreaLabel(SeaArea.ARABIAN_COAST), emoji: '🕌' },
    { value: SeaArea.MERMAID_LAGOON, label: getAreaLabel(SeaArea.MERMAID_LAGOON), emoji: '🧜‍♀️' },
    { value: SeaArea.MYSTERIOUS_ISLAND, label: getAreaLabel(SeaArea.MYSTERIOUS_ISLAND), emoji: '🌋' },
    { value: SeaArea.FANTASY_SPRINGS, label: getAreaLabel(SeaArea.FANTASY_SPRINGS), emoji: '❄️' },
  ];

  const areas = parkType === ParkType.LAND ? landAreas : seaAreas;

  // Filter areas based on search text
  const filteredAreas = useMemo(() => {
    if (!searchText) return areas;
    return areas.filter(area => 
      area.label.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [areas, searchText]);

  const selectedAreaOption = areas.find(area => area.value === selectedArea);

  const handleAreaSelect = (area: ParkArea) => {
    onSelect?.(area);
    onAreaSelect?.(area);
    setIsOpen(false);
    setSearchText('');
  };

  const handleToggleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchText('');
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Dropdown Button */}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          {
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.border,
            opacity: disabled ? 0.6 : 1,
          }
        ]}
        onPress={handleToggleOpen}
        disabled={disabled}
      >
        <View style={styles.dropdownContent}>
          {selectedAreaOption ? (
            <View style={styles.selectedContent}>
              <Text style={styles.selectedEmoji}>{selectedAreaOption.emoji}</Text>
              <Text style={[styles.selectedText, { color: theme.colors.text.primary }]}>
                {selectedAreaOption.label}
              </Text>
            </View>
          ) : (
            <Text style={[styles.placeholderText, { color: theme.colors.text.secondary }]}>
              {language === 'ja' ? 'エリアを選択してください' : 'Please select an area'}
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
              placeholder={language === 'ja' ? 'エリアを検索...' : 'Search areas...'}
              placeholderTextColor={theme.colors.text.secondary}
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

          {/* Area Options */}
          <ScrollView 
            style={styles.optionsList} 
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {filteredAreas.map((area, index) => {
              const isSelected = selectedArea === area.value;
              return (
                <TouchableOpacity
                  key={area.value}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor: isSelected 
                        ? colors.blue[500] + '20'
                        : 'transparent',
                    }
                  ]}
                  onPress={() => handleAreaSelect(area.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{area.emoji}</Text>
                  <Text style={[
                    styles.optionText,
                    { 
                      color: isSelected ? colors.blue[500] : theme.colors.text.primary,
                      fontWeight: isSelected ? '600' : '400'
                    }
                  ]}>
                    {area.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={colors.blue[500]} />
                  )}
                </TouchableOpacity>
              );
            })}
            
            {filteredAreas.length === 0 && (
              <View style={styles.noResults}>
                <Text style={[styles.noResultsText, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? '検索結果が見つかりません' : 'No search results found'}
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
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedEmoji: {
    fontSize: 18,
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
    maxHeight: 280,
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
    maxHeight: 200,
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
  optionEmoji: {
    fontSize: 16,
    marginRight: spacing[2],
    width: 20,
  },
  optionText: {
    fontSize: 15,
    flex: 1,
  },
  noResults: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
  },
});