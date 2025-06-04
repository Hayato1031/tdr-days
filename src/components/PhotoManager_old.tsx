import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  Animated,
  Switch,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// import * as MediaLibrary from 'expo-media-library'; // Removed dependency
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { photoService, PhotoMetadata } from '../services/photoService';
import { PhotoGallery } from './PhotoGallery';
import { PhotoEditor } from './PhotoEditor';
import { PhotoPreview } from './PhotoPreview';
import { PhotoGridView } from './PhotoGridView';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: screenWidth } = Dimensions.get('window');
const PHOTO_SIZE = (screenWidth - spacing[4] * 2 - spacing[2] * 2) / 3;

interface PhotoManagerProps {
  photos: PhotoMetadata[];
  onPhotosChange: (photos: PhotoMetadata[]) => void;
  maxPhotos?: number;
  style?: any;
  enableAdvancedFeatures?: boolean;
  enableBurstMode?: boolean;
  enableAlbums?: boolean;
  enableTags?: boolean;
  defaultAlbum?: string;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  style,
  enableAdvancedFeatures = true,
  enableBurstMode = true,
  enableAlbums = true,
  enableTags = true,
  defaultAlbum = 'General',
}) => {
  const { theme } = useTheme();
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Advanced features state
  const [viewMode, setViewMode] = useState<'compact' | 'grid' | 'timeline'>('compact');
  const [showGallery, setShowGallery] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showGridView, setShowGridView] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoMetadata[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [burstModeEnabled, setBurstModeEnabled] = useState(false);
  const [currentAlbum, setCurrentAlbum] = useState(defaultAlbum);
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [albums, setAlbums] = useState<string[]>(['General', 'Favorites', 'TDR Visit']);
  const [availableTags, setAvailableTags] = useState<string[]>(['attraction', 'food', 'parade', 'character', 'landscape', 'selfie']);
  
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please allow camera and photo library access to add photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const generatePhotoId = () => {
    return photoService.generatePhotoId();
  };

  const addPhoto = async (imageUri: string, width?: number, height?: number) => {
    setIsLoading(true);
    
    try {
      // Compress photo
      const compressedUri = await photoService.compressPhoto(imageUri, {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
      });
      
      // Generate thumbnail
      const thumbnailUri = await photoService.generateThumbnail(compressedUri, 200);
      
      // Get photo info
      const photoInfo = await photoService.getPhotoInfo(compressedUri);
      
      // Extract metadata
      const exifData = await photoService.extractExifData(compressedUri);
      const location = await photoService.extractLocation(compressedUri);
      
      // Auto-categorize
      const autoTags = await photoService.autoCategorizePhoto({
        id: generatePhotoId(),
        uri: compressedUri,
        thumbnailUri,
        width: width || photoInfo.width,
        height: height || photoInfo.height,
        takenAt: new Date(),
        size: photoInfo.size,
        mimeType: 'image/jpeg',
        location,
        exif: exifData,
      });
      
      const newPhoto: PhotoMetadata = {
        id: generatePhotoId(),
        uri: compressedUri,
        thumbnailUri,
        width: width || photoInfo.width,
        height: height || photoInfo.height,
        takenAt: new Date(),
        size: photoInfo.size,
        mimeType: 'image/jpeg',
        album: currentAlbum,
        tags: [...currentTags, ...autoTags],
        location,
        exif: exifData,
      };

      const updatedPhotos = [...photos, newPhoto];
      onPhotosChange(updatedPhotos);
    } catch (error) {
      console.error('Failed to add photo:', error);
      Alert.alert('Error', 'Failed to process photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    onPhotosChange(updatedPhotos);
  };

  const updatePhotoCaption = (photoId: string, caption: string) => {
    const updatedPhotos = photos.map(photo =>
      photo.id === photoId ? { ...photo, caption } : photo
    );
    onPhotosChange(updatedPhotos);
  };

  const takePhoto = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Photo Limit', `Maximum ${maxPhotos} photos allowed.`);
      return;
    }

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    setIsLoading(true);

    try {
      if (burstModeEnabled && enableBurstMode) {
        // Burst mode - take multiple photos
        const burstCount = 3;
        const burstPhotos: string[] = [];
        
        for (let i = 0; i < burstCount && photos.length + i < maxPhotos; i++) {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
            exif: true,
          });

          if (!result.canceled && result.assets[0]) {
            burstPhotos.push(result.assets[0].uri);
            
            // Small delay between shots
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            break;
          }
        }
        
        // Process burst photos
        for (const uri of burstPhotos) {
          await addPhoto(uri);
        }
        
        if (burstPhotos.length > 0) {
          Alert.alert('Burst Mode', `Captured ${burstPhotos.length} photos!`);
        }
      } else {
        // Single photo mode
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          exif: true,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          await addPhoto(asset.uri, asset.width, asset.height);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromLibrary = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Photo Limit', `Maximum ${maxPhotos} photos allowed.`);
      return;
    }

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    setIsLoading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: Math.min(5, maxPhotos - photos.length),
      });

      if (!result.canceled) {
        for (const asset of result.assets) {
          await addPhoto(asset.uri, asset.width, asset.height);
        }
      }
    } catch (error) {
      console.error('Error picking photos:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        {
          text: 'Camera',
          onPress: takePhoto,
        },
        {
          text: 'Photo Library',
          onPress: pickFromLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Advanced photo management methods
  const handleBatchDelete = () => {
    Alert.alert(
      'Delete Photos',
      `Delete ${selectedPhotos.length} selected photos?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const remainingPhotos = photos.filter(
              photo => !selectedPhotos.some(selected => selected.id === photo.id)
            );
            onPhotosChange(remainingPhotos);
            setSelectedPhotos([]);
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleBatchEdit = () => {
    if (selectedPhotos.length === 0) return;
    
    // For simplicity, edit the first selected photo
    setSelectedPhoto(selectedPhotos[0]);
    setShowEditor(true);
  };

  const handleBatchShare = async () => {
    // Share functionality for multiple photos
    Alert.alert('Share', `Share ${selectedPhotos.length} photos`);
  };

  const toggleFavorite = (photo: PhotoMetadata) => {
    const updatedPhotos = photos.map(p =>
      p.id === photo.id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    onPhotosChange(updatedPhotos);
  };

  const handlePhotoEdit = (editedPhoto: PhotoMetadata) => {
    const updatedPhotos = photos.map(p =>
      p.id === editedPhoto.id ? editedPhoto : p
    );
    onPhotosChange(updatedPhotos);
  };

  const handlePhotoDelete = (photo: PhotoMetadata) => {
    removePhoto(photo.id);
  };

  const searchPhotos = (query: string) => {
    // Simple search implementation
    return photos.filter(photo => {
      const searchLower = query.toLowerCase();
      return (
        photo.caption?.toLowerCase().includes(searchLower) ||
        photo.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        photo.album?.toLowerCase().includes(searchLower)
      );
    });
  };

  const openPhotoModal = (photo: PhotoMetadata) => {
    setSelectedPhoto(photo);
    setCaptionText(photo.caption || '');
    setShowPhotoModal(true);
    setEditingCaption(false);

    // Animate modal appearance
    Animated.parallel([
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePhotoModal = () => {
    Animated.parallel([
      Animated.spring(scaleAnimation, {
        toValue: 0.8,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowPhotoModal(false);
      setSelectedPhoto(null);
    });
  };

  const saveCaption = () => {
    if (selectedPhoto) {
      updatePhotoCaption(selectedPhoto.id, captionText);
      setEditingCaption(false);
    }
  };

  const deleteSelectedPhoto = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (selectedPhoto) {
              removePhoto(selectedPhoto.id);
              closePhotoModal();
            }
          },
        },
      ]
    );
  };

  const renderAddPhotoButton = () => {
    if (viewMode === 'grid' || viewMode === 'timeline') {
      return null; // Don't show in grid/timeline view
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.addPhotoButton,
          {
            backgroundColor: theme.colors.background.elevated,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={showPhotoOptions}
        disabled={isLoading || photos.length >= maxPhotos}
      >
        <LinearGradient
          colors={[colors.purple[400], colors.purple[600]]}
          style={styles.addPhotoGradient}
        >
          <Ionicons
            name={isLoading ? "hourglass" : "add"}
            size={24}
            color="white"
          />
          <Text style={styles.addPhotoText}>
            {isLoading ? 'Adding...' : 'Add Photo'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPhoto = (photo: PhotoMetadata, index: number) => {
    const isSelected = selectedPhotos.some(p => p.id === photo.id);
    
    return (
    <TouchableOpacity
      key={photo.id}
      style={styles.photoContainer}
      onPress={() => openPhotoModal(photo)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: photo.uri }} style={styles.photo} />
      
      {/* Photo indicators */}
      <View style={styles.photoIndicators}>
        {photo.isFavorite && (
          <View style={styles.favoriteIndicator}>
            <Ionicons name="heart" size={12} color={colors.semantic.error.light} />
          </View>
        )}
        {photo.caption && (
          <View style={styles.captionIndicator}>
            <Ionicons name="chatbubble" size={12} color="white" />
          </View>
        )}
        {photo.location && (
          <View style={styles.locationIndicator}>
            <Ionicons name="location" size={12} color="white" />
          </View>
        )}
      </View>

      {/* Selection checkbox */}
      {selectionMode && (
        <TouchableOpacity
          style={[
            styles.selectionCheckbox,
            isSelected && styles.selectionCheckboxActive,
          ]}
          onPress={() => {
            if (isSelected) {
              setSelectedPhotos(selectedPhotos.filter(p => p.id !== photo.id));
            } else {
              setSelectedPhotos([...selectedPhotos, photo]);
            }
          }}
        >
          {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
        </TouchableOpacity>
      )}

      {/* Remove button */}
      {!selectionMode && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removePhoto(photo.id)}
        >
          <Ionicons name="close-circle" size={20} color={colors.red[500]} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
    );
  };

  const renderPhotoModal = () => {
    if (!selectedPhoto) return null;

    return (
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="none"
        onRequestClose={closePhotoModal}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={closePhotoModal}
            activeOpacity={1}
          />
          
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnimation,
                transform: [{ scale: scaleAnimation }],
              },
            ]}
          >
            <BlurView
              intensity={theme.mode === 'dark' ? 20 : 80}
              style={styles.modalContent}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                  Photo Details
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={deleteSelectedPhoto}
                  >
                    <Ionicons name="trash" size={20} color={colors.red[500]} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={closePhotoModal}
                  >
                    <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Photo */}
              <View style={styles.modalPhotoContainer}>
                <Image source={{ uri: selectedPhoto.uri }} style={styles.modalPhoto} />
              </View>

              {/* Caption */}
              <View style={styles.captionContainer}>
                <View style={styles.captionHeader}>
                  <Text style={[styles.captionLabel, { color: theme.colors.text.primary }]}>
                    Caption
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (editingCaption) {
                        saveCaption();
                      } else {
                        setEditingCaption(true);
                      }
                    }}
                    style={styles.editCaptionButton}
                  >
                    <Ionicons
                      name={editingCaption ? "checkmark" : "create"}
                      size={16}
                      color={colors.purple[500]}
                    />
                  </TouchableOpacity>
                </View>

                {editingCaption ? (
                  <TextInput
                    style={[
                      styles.captionInput,
                      {
                        backgroundColor: theme.colors.background.elevated,
                        color: theme.colors.text.primary,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    value={captionText}
                    onChangeText={setCaptionText}
                    placeholder="Add a caption for this photo..."
                    placeholderTextColor={theme.colors.text.tertiary}
                    multiline
                    autoFocus
                  />
                ) : (
                  <Text
                    style={[
                      styles.captionText,
                      { color: theme.colors.text.secondary }
                    ]}
                  >
                    {selectedPhoto.caption || 'No caption added'}
                  </Text>
                )}
              </View>

              {/* Metadata */}
              {selectedPhoto.takenAt && (
                <View style={styles.metadataContainer}>
                  <Ionicons name="time" size={14} color={theme.colors.text.tertiary} />
                  <Text style={[styles.metadataText, { color: theme.colors.text.tertiary }]}>
                    {selectedPhoto.takenAt.toLocaleString()}
                  </Text>
                </View>
              )}
            </BlurView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const renderAdvancedHeader = () => (
    <View style={styles.advancedHeader}>
      <View style={styles.headerTop}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Photos
        </Text>
        <View style={styles.headerActions}>
          {enableAdvancedFeatures && (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowGridView(true)}
              >
                <MaterialCommunityIcons
                  name="view-grid"
                  size={20}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setSelectionMode(!selectionMode)}
              >
                <Ionicons
                  name={selectionMode ? "checkbox" : "checkbox-outline"}
                  size={20}
                  color={selectionMode ? colors.purple[500] : theme.colors.text.primary}
                />
              </TouchableOpacity>
              
              {enableBurstMode && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setBurstModeEnabled(!burstModeEnabled)}
                >
                  <MaterialCommunityIcons
                    name="camera-burst"
                    size={20}
                    color={burstModeEnabled ? colors.purple[500] : theme.colors.text.primary}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
      
      <View style={styles.headerInfo}>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          {photos.length} / {maxPhotos} photos
          {selectionMode && selectedPhotos.length > 0 && ` • ${selectedPhotos.length} selected`}
        </Text>
        
        {enableAlbums && (
          <TouchableOpacity
            style={styles.albumButton}
            onPress={() => setShowAlbumPicker(true)}
          >
            <Ionicons name="folder" size={14} color={theme.colors.text.secondary} />
            <Text style={[styles.albumText, { color: theme.colors.text.secondary }]}>
              {currentAlbum}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {selectionMode && selectedPhotos.length > 0 && (
        <View style={styles.selectionBar}>
          <TouchableOpacity style={styles.selectionButton} onPress={handleBatchEdit}>
            <Ionicons name="create" size={18} color={theme.colors.text.primary} />
            <Text style={[styles.selectionButtonText, { color: theme.colors.text.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.selectionButton} onPress={handleBatchShare}>
            <Ionicons name="share" size={18} color={theme.colors.text.primary} />
            <Text style={[styles.selectionButtonText, { color: theme.colors.text.primary }]}>
              Share
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.selectionButton} onPress={handleBatchDelete}>
            <Ionicons name="trash" size={18} color={colors.semantic.error.main} />
            <Text style={[styles.selectionButtonText, { color: colors.semantic.error.main }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'compact' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('compact')}
      >
        <Text style={[styles.viewModeText, { color: viewMode === 'compact' ? colors.purple[500] : theme.colors.text.secondary }]}>
          Compact
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('grid')}
      >
        <Text style={[styles.viewModeText, { color: viewMode === 'grid' ? colors.purple[500] : theme.colors.text.secondary }]}>
          Grid
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'timeline' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('timeline')}
      >
        <Text style={[styles.viewModeText, { color: viewMode === 'timeline' ? colors.purple[500] : theme.colors.text.secondary }]}>
          Timeline
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {enableAdvancedFeatures ? renderAdvancedHeader() : (
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Photos
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {photos.length} / {maxPhotos} photos
          </Text>
        </View>
      )}

      {enableAdvancedFeatures && viewMode !== 'compact' && renderViewModeSelector()}
      
      {viewMode === 'compact' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosContainer}
        >
          {photos.map((photo, index) => renderPhoto(photo, index))}
          {photos.length < maxPhotos && renderAddPhotoButton()}
        </ScrollView>
      ) : viewMode === 'grid' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContainer}
        >
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.gridPhotoItem}
                onPress={() => {
                  if (selectionMode) {
                    const isSelected = selectedPhotos.some(p => p.id === photo.id);
                    if (isSelected) {
                      setSelectedPhotos(selectedPhotos.filter(p => p.id !== photo.id));
                    } else {
                      setSelectedPhotos([...selectedPhotos, photo]);
                    }
                  } else {
                    setSelectedPhoto(photo);
                    setShowPreview(true);
                  }
                }}
              >
                <Image source={{ uri: photo.thumbnailUri || photo.uri }} style={styles.gridPhoto} />
                {selectedPhotos.some(p => p.id === photo.id) && (
                  <View style={styles.gridSelectionOverlay}>
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.timelineItem}>
              <View style={styles.timelineDate}>
                <Text style={[styles.timelineDateText, { color: theme.colors.text.secondary }]}>
                  {photo.takenAt.toLocaleDateString()}
                </Text>
                <Text style={[styles.timelineTimeText, { color: theme.colors.text.tertiary }]}>
                  {photo.takenAt.toLocaleTimeString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.timelinePhoto}
                onPress={() => {
                  setSelectedPhoto(photo);
                  setShowPreview(true);
                }}
              >
                <Image source={{ uri: photo.uri }} style={styles.timelinePhotoImage} />
                {photo.caption && (
                  <Text style={[styles.timelineCaption, { color: theme.colors.text.primary }]}>
                    {photo.caption}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {renderPhotoModal()}
      
      {/* Advanced feature modals */}
      {enableAdvancedFeatures && (
        <>
          <PhotoGallery
            photos={photos}
            visible={showGallery}
            onClose={() => setShowGallery(false)}
            initialIndex={photos.findIndex(p => p.id === selectedPhoto?.id) || 0}
            onEdit={handlePhotoEdit}
            onDelete={handlePhotoDelete}
          />
          
          {selectedPhoto && (
            <>
              <PhotoEditor
                photo={selectedPhoto}
                visible={showEditor}
                onClose={() => {
                  setShowEditor(false);
                  setSelectedPhoto(null);
                }}
                onSave={handlePhotoEdit}
              />
              
              <PhotoPreview
                photo={selectedPhoto}
                visible={showPreview}
                onClose={() => {
                  setShowPreview(false);
                  setSelectedPhoto(null);
                }}
                onEdit={handlePhotoEdit}
                onDelete={handlePhotoDelete}
                relatedPhotos={photos.filter(p => p.id !== selectedPhoto.id)}
              />
            </>
          )}
          
          <PhotoGridView
            photos={photos}
            visible={showGridView}
            onPhotoEdit={handlePhotoEdit}
            onPhotosDelete={(photosToDelete) => {
              const remainingPhotos = photos.filter(
                photo => !photosToDelete.some(p => p.id === photo.id)
              );
              onPhotosChange(remainingPhotos);
            }}
            selectionMode={selectionMode}
            selectedPhotos={selectedPhotos}
            onSelectionChange={setSelectedPhotos}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[4],
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  photosContainer: {
    paddingHorizontal: spacing[4],
  },
  photoContainer: {
    position: 'relative',
    marginRight: spacing[2],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: borderRadius.lg,
  },
  photoIndicators: {
    position: 'absolute',
    bottom: spacing[2],
    left: spacing[2],
    flexDirection: 'row',
  },
  favoriteIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    marginRight: spacing[1],
  },
  captionIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
    marginRight: spacing[1],
  },
  locationIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  selectionCheckbox: {
    position: 'absolute',
    top: spacing[1],
    left: spacing[1],
    width: 20,
    height: 20,
    borderRadius: 10,
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
  removeButton: {
    position: 'absolute',
    top: spacing[1],
    right: spacing[1],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  addPhotoButton: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  addPhotoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing[1],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxHeight: '80%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  modalContent: {
    padding: spacing[4],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalActionButton: {
    padding: spacing[2],
    marginLeft: spacing[1],
  },
  modalPhotoContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  modalPhoto: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    borderRadius: borderRadius.lg,
  },
  captionContainer: {
    marginBottom: spacing[3],
  },
  captionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  captionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  editCaptionButton: {
    padding: spacing[1],
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 12,
    marginLeft: spacing[1],
  },
  // Advanced features styles
  advancedHeader: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: spacing[2],
    marginLeft: spacing[2],
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  albumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: borderRadius.full,
  },
  albumText: {
    fontSize: 12,
    marginLeft: spacing[1],
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  selectionButtonText: {
    fontSize: 14,
    marginLeft: spacing[1],
    fontWeight: '500',
  },
  viewModeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[4],
  },
  viewModeButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    marginHorizontal: spacing[1],
  },
  viewModeButtonActive: {
    backgroundColor: colors.purple[100],
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  gridContainer: {
    paddingHorizontal: spacing[4],
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing[1],
  },
  gridPhotoItem: {
    width: '33.33%',
    padding: spacing[1],
  },
  gridPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
  },
  gridSelectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineItem: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  timelineDate: {
    marginBottom: spacing[2],
  },
  timelineDateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timelineTimeText: {
    fontSize: 12,
  },
  timelinePhoto: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  timelinePhotoImage: {
    width: '100%',
    height: 200,
  },
  timelineCaption: {
    padding: spacing[3],
    fontSize: 14,
    lineHeight: 20,
  },
});