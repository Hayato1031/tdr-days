import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// import MasonryList from '@react-native-seoul/masonry-list'; // Removed dependency
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { PhotoMetadata, photoService, PhotoOrganizationOptions } from '../services/photoService';
import { PhotoGallery } from './PhotoGallery';
import { PhotoPreview } from './PhotoPreview';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: screenWidth } = Dimensions.get('window');

interface PhotoGridViewProps {
  photos: PhotoMetadata[];
  onPhotoSelect?: (photo: PhotoMetadata) => void;
  onPhotosDelete?: (photos: PhotoMetadata[]) => void;
  onPhotoEdit?: (photo: PhotoMetadata) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  showOrganizationTools?: boolean;
  selectionMode?: boolean;
  selectedPhotos?: PhotoMetadata[];
  onSelectionChange?: (photos: PhotoMetadata[]) => void;
}

type ViewMode = 'grid' | 'masonry' | 'timeline' | 'albums';
type SortBy = 'date' | 'name' | 'size' | 'favorites';
type GroupBy = 'none' | 'date' | 'location' | 'album' | 'tags';

export const PhotoGridView: React.FC<PhotoGridViewProps> = ({
  photos,
  onPhotoSelect,
  onPhotosDelete,
  onPhotoEdit,
  refreshing = false,
  onRefresh,
  showOrganizationTools = true,
  selectionMode = false,
  selectedPhotos = [],
  onSelectionChange,
}) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const filterHeight = useRef(new Animated.Value(0)).current;
  const selectionBarHeight = useRef(new Animated.Value(0)).current;
  const photoScales = useRef<Map<string, Animated.Value>>(new Map()).current;

  useEffect(() => {
    if (showFilters) {
      Animated.spring(filterHeight, {
        toValue: 200,
        tension: 100,
        friction: 10,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(filterHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [showFilters]);

  useEffect(() => {
    if (selectionMode && selectedPhotos.length > 0) {
      Animated.spring(selectionBarHeight, {
        toValue: 60,
        tension: 100,
        friction: 10,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(selectionBarHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [selectionMode, selectedPhotos.length]);

  // Organize photos based on settings
  const organizedPhotos = useMemo(() => {
    let result = [...photos];
    
    // Sort photos
    result.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'date':
          compareValue = a.takenAt.getTime() - b.takenAt.getTime();
          break;
        case 'name':
          compareValue = a.id.localeCompare(b.id);
          break;
        case 'size':
          compareValue = a.size - b.size;
          break;
        case 'favorites':
          compareValue = (a.isFavorite ? 1 : 0) - (b.isFavorite ? 1 : 0);
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    return result;
  }, [photos, sortBy, sortOrder]);

  // Group photos
  const groupedPhotos = useMemo(() => {
    if (groupBy === 'none') {
      return new Map([['All Photos', organizedPhotos]]);
    }
    
    const options: PhotoOrganizationOptions = {
      groupBy: groupBy as any,
      sortBy: sortBy as any,
      sortOrder,
    };
    
    return photoService.organizePhotos(organizedPhotos, options);
  }, [organizedPhotos, groupBy, sortBy, sortOrder]);

  const getPhotoScale = (photoId: string): Animated.Value => {
    if (!photoScales.has(photoId)) {
      photoScales.set(photoId, new Animated.Value(1));
    }
    return photoScales.get(photoId)!;
  };

  const animatePhotoPress = (photoId: string, callback: () => void) => {
    const scale = getPhotoScale(photoId);
    
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handlePhotoPress = (photo: PhotoMetadata, index: number) => {
    animatePhotoPress(photo.id, () => {
      if (selectionMode) {
        togglePhotoSelection(photo);
      } else {
        setGalleryStartIndex(index);
        setShowGallery(true);
      }
    });
  };

  const handlePhotoLongPress = (photo: PhotoMetadata) => {
    if (!selectionMode && onSelectionChange) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onSelectionChange([photo]);
    }
  };

  const togglePhotoSelection = (photo: PhotoMetadata) => {
    if (!onSelectionChange) return;
    
    const isSelected = selectedPhotos.some(p => p.id === photo.id);
    let newSelection: PhotoMetadata[];
    
    if (isSelected) {
      newSelection = selectedPhotos.filter(p => p.id !== photo.id);
    } else {
      newSelection = [...selectedPhotos, photo];
    }
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onSelectionChange(newSelection);
  };

  const selectAll = () => {
    if (onSelectionChange) {
      onSelectionChange(organizedPhotos);
    }
  };

  const clearSelection = () => {
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  const deleteSelectedPhotos = () => {
    if (onPhotosDelete && selectedPhotos.length > 0) {
      onPhotosDelete(selectedPhotos);
      clearSelection();
    }
  };

  const renderPhotoItem = (photo: PhotoMetadata, index: number) => {
    const isSelected = selectedPhotos.some(p => p.id === photo.id);
    const scale = getPhotoScale(photo.id);
    
    return (
      <Animated.View
        key={photo.id}
        style={[
          styles.gridItem,
          { transform: [{ scale }] },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handlePhotoPress(photo, index)}
          onLongPress={() => handlePhotoLongPress(photo)}
        >
          <View style={[styles.photoContainer, isSelected && styles.photoContainerSelected]}>
            <Image
              source={{ uri: photo.thumbnailUri || photo.uri }}
              style={styles.photo}
              resizeMode="cover"
            />
            
            {/* Selection overlay */}
            {selectionMode && (
              <View style={[styles.selectionOverlay, isSelected && styles.selectionOverlayActive]}>
                <View style={[styles.selectionCheckbox, isSelected && styles.selectionCheckboxActive]}>
                  {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
              </View>
            )}
            
            {/* Photo info overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.6)']}
              style={styles.photoInfoOverlay}
            >
              <View style={styles.photoInfo}>
                {photo.isFavorite && (
                  <Ionicons name="heart" size={16} color={colors.semantic.error.light} />
                )}
                {photo.caption && (
                  <Ionicons name="chatbubble" size={14} color="white" style={styles.photoInfoIcon} />
                )}
                {photo.location && (
                  <Ionicons name="location" size={14} color="white" style={styles.photoInfoIcon} />
                )}
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderViewModeSelector = () => (
    <View style={[styles.viewModeContainer, { backgroundColor: theme.colors.background.elevated }]}>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('grid')}
      >
        <Ionicons name="grid" size={20} color={viewMode === 'grid' ? colors.purple[500] : theme.colors.text.secondary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'masonry' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('masonry')}
      >
        <MaterialCommunityIcons name="view-dashboard" size={20} color={viewMode === 'masonry' ? colors.purple[500] : theme.colors.text.secondary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'timeline' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('timeline')}
      >
        <Ionicons name="time" size={20} color={viewMode === 'timeline' ? colors.purple[500] : theme.colors.text.secondary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'albums' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('albums')}
      >
        <Ionicons name="albums" size={20} color={viewMode === 'albums' ? colors.purple[500] : theme.colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <Animated.View
      style={[
        styles.filtersContainer,
        { 
          backgroundColor: theme.colors.background.secondary,
          height: filterHeight,
        },
      ]}
    >
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: theme.colors.text.primary }]}>Sort By</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['date', 'name', 'size', 'favorites'] as SortBy[]).map(option => (
            <TouchableOpacity
              key={option}
              style={[styles.filterChip, sortBy === option && styles.filterChipActive]}
              onPress={() => setSortBy(option)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: sortBy === option ? 'white' : theme.colors.text.secondary },
                ]}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: theme.colors.text.primary }]}>Group By</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['none', 'date', 'location', 'album', 'tags'] as GroupBy[]).map(option => (
            <TouchableOpacity
              key={option}
              style={[styles.filterChip, groupBy === option && styles.filterChipActive]}
              onPress={() => setGroupBy(option)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: groupBy === option ? 'white' : theme.colors.text.secondary },
                ]}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <TouchableOpacity
        style={styles.sortOrderButton}
        onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
      >
        <Ionicons
          name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
          size={20}
          color={theme.colors.text.primary}
        />
        <Text style={[styles.sortOrderText, { color: theme.colors.text.secondary }]}>
          {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSelectionBar = () => (
    <Animated.View
      style={[
        styles.selectionBar,
        {
          backgroundColor: theme.colors.background.elevated,
          height: selectionBarHeight,
        },
      ]}
    >
      <Text style={[styles.selectionText, { color: theme.colors.text.primary }]}>
        {selectedPhotos.length} selected
      </Text>
      
      <View style={styles.selectionActions}>
        <TouchableOpacity style={styles.selectionButton} onPress={selectAll}>
          <Text style={[styles.selectionButtonText, { color: colors.purple[500] }]}>
            Select All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.selectionButton} onPress={clearSelection}>
          <Text style={[styles.selectionButtonText, { color: theme.colors.text.secondary }]}>
            Clear
          </Text>
        </TouchableOpacity>
        
        {onPhotosDelete && (
          <TouchableOpacity style={styles.selectionButton} onPress={deleteSelectedPhotos}>
            <Ionicons name="trash" size={20} color={colors.semantic.error.main} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const renderGroupedContent = () => {
    const groups = Array.from(groupedPhotos.entries());
    
    if (viewMode === 'masonry') {
      return (
        <ScrollView
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.purple[500]}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          {groups.map(([groupName, groupPhotos]) => (
            <View key={groupName} style={styles.groupContainer}>
              {groupBy !== 'none' && (
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: theme.colors.text.primary }]}>
                    {groupName}
                  </Text>
                  <Text style={[styles.groupCount, { color: theme.colors.text.secondary }]}>
                    {groupPhotos.length} photos
                  </Text>
                </View>
              )}
              
              <View style={styles.masonryContainer}>
                <View style={styles.gridContainer}>
                  {groupPhotos.map((photo, index) => renderPhotoItem(photo, index))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    }
    
    // Grid view
    return (
      <ScrollView
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.purple[500]}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {groups.map(([groupName, groupPhotos]) => (
          <View key={groupName} style={styles.groupContainer}>
            {groupBy !== 'none' && (
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, { color: theme.colors.text.primary }]}>
                  {groupName}
                </Text>
                <Text style={[styles.groupCount, { color: theme.colors.text.secondary }]}>
                  {groupPhotos.length} photos
                </Text>
              </View>
            )}
            
            <View style={styles.gridContainer}>
              {groupPhotos.map((photo, index) => renderPhotoItem(photo, index))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {showOrganizationTools && (
        <View style={styles.header}>
          {renderViewModeSelector()}
          
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons
              name="options"
              size={20}
              color={showFilters ? colors.purple[500] : theme.colors.text.secondary}
            />
          </TouchableOpacity>
        </View>
      )}
      
      {renderFilters()}
      {renderSelectionBar()}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple[500]} />
        </View>
      ) : (
        renderGroupedContent()
      )}
      
      <PhotoGallery
        photos={organizedPhotos}
        initialIndex={galleryStartIndex}
        visible={showGallery}
        onClose={() => setShowGallery(false)}
        onEdit={onPhotoEdit}
        onDelete={photo => {
          if (onPhotosDelete) {
            onPhotosDelete([photo]);
          }
        }}
      />
      
      {selectedPhoto && (
        <PhotoPreview
          photo={selectedPhoto}
          visible={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onEdit={onPhotoEdit}
          onDelete={photo => {
            if (onPhotosDelete) {
              onPhotosDelete([photo]);
            }
            setSelectedPhoto(null);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  viewModeContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  viewModeButton: {
    padding: spacing[2],
    paddingHorizontal: spacing[3],
  },
  viewModeButtonActive: {
    backgroundColor: colors.purple[100],
  },
  filterButton: {
    padding: spacing[2],
  },
  filtersContainer: {
    overflow: 'hidden',
    paddingHorizontal: spacing[4],
  },
  filterSection: {
    marginVertical: spacing[2],
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: spacing[2],
  },
  filterChipActive: {
    backgroundColor: colors.purple[500],
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sortOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  sortOrderText: {
    fontSize: 12,
    marginLeft: spacing[2],
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionButton: {
    marginLeft: spacing[3],
    padding: spacing[2],
  },
  selectionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupContainer: {
    marginBottom: spacing[4],
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupCount: {
    fontSize: 14,
  },
  masonryContainer: {
    paddingHorizontal: spacing[4],
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4] - spacing[1],
  },
  masonryItem: {
    paddingHorizontal: spacing[1],
    marginBottom: spacing[2],
  },
  gridItem: {
    width: '33.33%',
    padding: spacing[1],
  },
  photoContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  photoContainerSelected: {
    borderWidth: 3,
    borderColor: colors.purple[500],
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: spacing[2],
  },
  selectionOverlayActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheckboxActive: {
    backgroundColor: colors.purple[500],
    borderColor: colors.purple[500],
  },
  photoInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[2],
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoInfoIcon: {
    marginLeft: spacing[1],
  },
});