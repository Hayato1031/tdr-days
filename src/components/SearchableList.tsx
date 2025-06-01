import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { ActionCategory, ParkArea, ParkType } from '../types/models';
import { searchPresets } from '../constants/presets';

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

interface SearchableListProps {
  category: ActionCategory;
  parkType: ParkType;
  selectedArea?: ParkArea;
  onSelect: (item: PresetItem) => void;
  placeholder?: string;
  maxResults?: number;
  showRecent?: boolean;
  recentItems?: PresetItem[];
  style?: any;
}

export const SearchableList: React.FC<SearchableListProps> = ({
  category,
  parkType,
  selectedArea,
  onSelect,
  placeholder = "Search for locations...",
  maxResults = 20,
  showRecent = true,
  recentItems = [],
  style,
}) => {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PresetItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.95)).current;
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Memoized search function with smart filtering
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      // Show recent items when no search query
      if (showRecent && recentItems.length > 0) {
        return recentItems.slice(0, Math.min(5, maxResults));
      }
      // Show popular items from selected area or category
      const popularItems = searchPresets('', category, parkType)
        .filter(item => item.isPopular && (!selectedArea || item.area === selectedArea))
        .slice(0, Math.min(8, maxResults));
      return popularItems;
    }

    const searchResults = searchPresets(query, category, parkType);
    
    // Smart area detection - if search matches area name, filter by that area
    let filteredResults = searchResults;
    if (selectedArea) {
      filteredResults = searchResults.filter(item => item.area === selectedArea);
    }

    // Sort by relevance
    const sortedResults = filteredResults.sort((a, b) => {
      // Exact name matches first
      if (a.name.toLowerCase() === query.toLowerCase()) return -1;
      if (b.name.toLowerCase() === query.toLowerCase()) return 1;
      
      // Popular items next
      if (a.isPopular && !b.isPopular) return -1;
      if (b.isPopular && !a.isPopular) return 1;
      
      // New items next
      if (a.isNew && !b.isNew) return -1;
      if (b.isNew && !a.isNew) return 1;
      
      // Name starts with query
      const aStartsWith = a.name.toLowerCase().startsWith(query.toLowerCase());
      const bStartsWith = b.name.toLowerCase().startsWith(query.toLowerCase());
      if (aStartsWith && !bStartsWith) return -1;
      if (bStartsWith && !aStartsWith) return 1;
      
      // Alphabetical
      return a.name.localeCompare(b.name);
    });

    return sortedResults.slice(0, maxResults);
  }, [query, category, parkType, selectedArea, recentItems, showRecent, maxResults]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(() => {
      setResults(searchResults);
      setIsSearching(false);
      setHighlightedIndex(-1);
    }, 200);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchResults]);

  // Animation effects
  useEffect(() => {
    if (showSuggestions && results.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSuggestions, results.length]);

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

  const handleSelect = (item: PresetItem) => {
    setQuery(item.name);
    setShowSuggestions(false);
    onSelect(item);
    Keyboard.dismiss();
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for item selection
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const renderResultItem = ({ item, index }: { item: PresetItem; index: number }) => {
    const isHighlighted = index === highlightedIndex;
    const categoryColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        style={[
          styles.resultItem,
          {
            backgroundColor: isHighlighted 
              ? theme.colors.background.elevated 
              : 'transparent',
            borderLeftColor: categoryColor,
          },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            <View style={styles.resultTitleContainer}>
              <Ionicons
                name={getCategoryIcon(item.category) as any}
                size={16}
                color={categoryColor}
                style={styles.resultIcon}
              />
              <Text 
                style={[styles.resultTitle, { color: theme.colors.text.primary }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.isNew && (
                <View style={[styles.badge, { backgroundColor: colors.green[500] }]}>
                  <Text style={styles.badgeText}>NEW</Text>
                </View>
              )}
              {item.isPopular && (
                <Ionicons
                  name="star"
                  size={12}
                  color={colors.yellow[500]}
                  style={styles.popularIcon}
                />
              )}
            </View>
            <Text 
              style={[styles.resultArea, { color: theme.colors.text.secondary }]}
              numberOfLines={1}
            >
              {formatAreaName(item.area)}
            </Text>
          </View>
          
          {item.nameEn && (
            <Text 
              style={[styles.resultSubtitle, { color: theme.colors.text.tertiary }]}
              numberOfLines={1}
            >
              {item.nameEn}
            </Text>
          )}
          
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagContainer}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <View 
                  key={index}
                  style={[
                    styles.tag,
                    { 
                      backgroundColor: `${categoryColor}20`,
                      borderColor: `${categoryColor}40`,
                    }
                  ]}
                >
                  <Text 
                    style={[
                      styles.tagText, 
                      { color: categoryColor }
                    ]}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    if (query.trim() === '') {
      const headerText = showRecent && recentItems.length > 0 
        ? 'Recent locations'
        : 'Popular locations';
      
      return (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
            {headerText}
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={getCategoryColor(category)} />
          <Text style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
            Searching...
          </Text>
        </View>
      );
    }

    if (query.trim() !== '' && results.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="search"
            size={24}
            color={theme.colors.text.tertiary}
          />
          <Text style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
            No results found
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>
            Try a different search term
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchInputContainer,
          {
            backgroundColor: theme.colors.background.elevated,
            borderColor: showSuggestions ? getCategoryColor(category) : theme.colors.border,
          }
        ]}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.text.secondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: theme.colors.text.primary }
            ]}
            value={query}
            onChangeText={setQuery}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.text.tertiary}
            returnKeyType="search"
            autoCapitalize="words"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSuggestions && (
        <Animated.View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: theme.colors.background.elevated,
              borderColor: theme.colors.border,
              opacity: fadeAnimation,
              transform: [{ scale: scaleAnimation }],
            },
          ]}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderResultItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  searchContainer: {
    marginBottom: spacing[2],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    padding: spacing[1],
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 300,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    marginTop: spacing[1],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  resultsList: {
    maxHeight: 280,
  },
  resultsContent: {
    paddingVertical: spacing[2],
  },
  sectionHeader: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultItem: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  resultTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing[2],
  },
  resultIcon: {
    marginRight: spacing[2],
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  resultArea: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultSubtitle: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: spacing[1],
  },
  badge: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing[2],
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  popularIcon: {
    marginLeft: spacing[1],
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing[1],
  },
  tag: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginRight: spacing[1],
    marginBottom: spacing[1],
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: spacing[2],
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: spacing[1],
  },
});