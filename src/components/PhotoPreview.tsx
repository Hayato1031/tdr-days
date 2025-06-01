import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Animated,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// import MapView, { Marker } from 'react-native-maps'; // Removed dependency
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { PhotoMetadata } from '../services/photoService';
import { PhotoGallery } from './PhotoGallery';
import { PhotoEditor } from './PhotoEditor';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PhotoPreviewProps {
  photo: PhotoMetadata;
  visible: boolean;
  onClose: () => void;
  onEdit?: (photo: PhotoMetadata) => void;
  onDelete?: (photo: PhotoMetadata) => void;
  onShare?: (photo: PhotoMetadata) => void;
  relatedPhotos?: PhotoMetadata[];
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photo,
  visible,
  onClose,
  onEdit,
  onDelete,
  onShare,
  relatedPhotos = [],
}) => {
  const { theme } = useTheme();
  const [showGallery, setShowGallery] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'metadata' | 'location'>('details');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleShare = async () => {
    if (onShare) {
      onShare(photo);
    } else {
      try {
        await Share.share({
          message: photo.caption || 'Check out this photo!',
          url: photo.uri,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(photo);
              handleClose();
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setShowEditor(true);
  };

  const handleSaveEdit = (editedPhoto: PhotoMetadata) => {
    if (onEdit) {
      onEdit(editedPhoto);
    }
    setShowEditor(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.background.elevated }]}>
      <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
        <Ionicons name="close" size={28} color={theme.colors.text.primary} />
      </TouchableOpacity>
      
      <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
        Photo Preview
      </Text>
      
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        
        {onEdit && (
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}
        
        {onDelete && (
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={colors.semantic.error.main} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPhotoSection = () => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setShowGallery(true)}
      style={styles.photoSection}
    >
      <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
      
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
        style={styles.photoGradient}
      >
        {photo.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption} numberOfLines={2}>
              {photo.caption}
            </Text>
          </View>
        )}
      </LinearGradient>
      
      <View style={styles.photoActions}>
        {photo.isFavorite && (
          <View style={styles.favoriteIndicator}>
            <Ionicons name="heart" size={20} color={colors.semantic.error.main} />
          </View>
        )}
        
        <TouchableOpacity style={styles.fullscreenButton} onPress={() => setShowGallery(true)}>
          <Ionicons name="expand" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderTabs = () => (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.background.secondary }]}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'details' && styles.tabActive]}
        onPress={() => setActiveTab('details')}
      >
        <Text
          style={[
            styles.tabText,
            { color: theme.colors.text.secondary },
            activeTab === 'details' && { color: colors.purple[500] },
          ]}
        >
          Details
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'metadata' && styles.tabActive]}
        onPress={() => setActiveTab('metadata')}
      >
        <Text
          style={[
            styles.tabText,
            { color: theme.colors.text.secondary },
            activeTab === 'metadata' && { color: colors.purple[500] },
          ]}
        >
          Metadata
        </Text>
      </TouchableOpacity>
      
      {photo.location && (
        <TouchableOpacity
          style={[styles.tab, activeTab === 'location' && styles.tabActive]}
          onPress={() => setActiveTab('location')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.text.secondary },
              activeTab === 'location' && { color: colors.purple[500] },
            ]}
          >
            Location
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.detailSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Photo Information
        </Text>
        
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="calendar" size={20} color={theme.colors.text.secondary} />
          </View>
          <View style={styles.detailContent}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
              Date Taken
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {photo.takenAt.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={[styles.detailSubvalue, { color: theme.colors.text.tertiary }]}>
              {photo.takenAt.toLocaleTimeString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <MaterialCommunityIcons name="image-size-select-actual" size={20} color={theme.colors.text.secondary} />
          </View>
          <View style={styles.detailContent}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
              Dimensions
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {photo.width} × {photo.height} pixels
            </Text>
            <Text style={[styles.detailSubvalue, { color: theme.colors.text.tertiary }]}>
              {(photo.width * photo.height / 1000000).toFixed(1)} MP
            </Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="document" size={20} color={theme.colors.text.secondary} />
          </View>
          <View style={styles.detailContent}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
              File Size
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {formatFileSize(photo.size)}
            </Text>
            <Text style={[styles.detailSubvalue, { color: theme.colors.text.tertiary }]}>
              {photo.mimeType}
            </Text>
          </View>
        </View>
        
        {photo.tags && photo.tags.length > 0 && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="pricetags" size={20} color={theme.colors.text.secondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                Tags
              </Text>
              <View style={styles.tagContainer}>
                {photo.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
        
        {photo.album && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="folder" size={20} color={theme.colors.text.secondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                Album
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {photo.album}
              </Text>
            </View>
          </View>
        )}
      </View>
      
      {relatedPhotos.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Related Photos
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedPhotosContainer}
          >
            {relatedPhotos.map((relatedPhoto, index) => (
              <TouchableOpacity
                key={relatedPhoto.id}
                style={styles.relatedPhoto}
                onPress={() => {
                  // Switch to the related photo
                }}
              >
                <Image source={{ uri: relatedPhoto.thumbnailUri || relatedPhoto.uri }} style={styles.relatedPhotoImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );

  const renderMetadataTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {photo.exif && (
        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Camera Information
          </Text>
          
          {photo.exif.make && (
            <View style={styles.metadataRow}>
              <Text style={[styles.metadataLabel, { color: theme.colors.text.secondary }]}>
                Camera
              </Text>
              <Text style={[styles.metadataValue, { color: theme.colors.text.primary }]}>
                {photo.exif.make} {photo.exif.model}
              </Text>
            </View>
          )}
          
          {photo.exif.focalLength && (
            <View style={styles.metadataRow}>
              <Text style={[styles.metadataLabel, { color: theme.colors.text.secondary }]}>
                Focal Length
              </Text>
              <Text style={[styles.metadataValue, { color: theme.colors.text.primary }]}>
                {photo.exif.focalLength}mm
              </Text>
            </View>
          )}
          
          {photo.exif.aperture && (
            <View style={styles.metadataRow}>
              <Text style={[styles.metadataLabel, { color: theme.colors.text.secondary }]}>
                Aperture
              </Text>
              <Text style={[styles.metadataValue, { color: theme.colors.text.primary }]}>
                f/{photo.exif.aperture}
              </Text>
            </View>
          )}
          
          {photo.exif.exposureTime && (
            <View style={styles.metadataRow}>
              <Text style={[styles.metadataLabel, { color: theme.colors.text.secondary }]}>
                Exposure Time
              </Text>
              <Text style={[styles.metadataValue, { color: theme.colors.text.primary }]}>
                {photo.exif.exposureTime}s
              </Text>
            </View>
          )}
          
          {photo.exif.iso && (
            <View style={styles.metadataRow}>
              <Text style={[styles.metadataLabel, { color: theme.colors.text.secondary }]}>
                ISO
              </Text>
              <Text style={[styles.metadataValue, { color: theme.colors.text.primary }]}>
                {photo.exif.iso}
              </Text>
            </View>
          )}
          
          {photo.exif.flash !== undefined && (
            <View style={styles.metadataRow}>
              <Text style={[styles.metadataLabel, { color: theme.colors.text.secondary }]}>
                Flash
              </Text>
              <Text style={[styles.metadataValue, { color: theme.colors.text.primary }]}>
                {photo.exif.flash ? 'On' : 'Off'}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {photo.editHistory && photo.editHistory.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Edit History
          </Text>
          {photo.editHistory.map((edit, index) => (
            <View key={edit.id} style={styles.editHistoryItem}>
              <View style={styles.editHistoryIcon}>
                <Ionicons name="create" size={16} color={colors.purple[500]} />
              </View>
              <View style={styles.editHistoryContent}>
                <Text style={[styles.editHistoryType, { color: theme.colors.text.primary }]}>
                  {edit.type.charAt(0).toUpperCase() + edit.type.slice(1)}
                </Text>
                <Text style={[styles.editHistoryDate, { color: theme.colors.text.tertiary }]}>
                  {edit.timestamp.toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderLocationTab = () => {
    if (!photo.location) return null;
    
    return (
      <View style={styles.tabContent}>
        <View style={[styles.map, styles.mapPlaceholder, { backgroundColor: theme.colors.background.secondary }]}>
          <Ionicons name="location" size={48} color={theme.colors.text.tertiary} />
          <Text style={[styles.mapPlaceholderText, { color: theme.colors.text.secondary }]}>
            Map functionality unavailable
          </Text>
          <Text style={[styles.mapPlaceholderSubtext, { color: theme.colors.text.tertiary }]}>
            Location: {photo.location.latitude.toFixed(4)}, {photo.location.longitude.toFixed(4)}
          </Text>
        </View>
        
        <View style={[styles.locationInfo, { backgroundColor: theme.colors.background.elevated }]}>
          <View style={styles.locationRow}>
            <Text style={[styles.locationLabel, { color: theme.colors.text.secondary }]}>
              Latitude
            </Text>
            <Text style={[styles.locationValue, { color: theme.colors.text.primary }]}>
              {photo.location.latitude.toFixed(6)}°
            </Text>
          </View>
          
          <View style={styles.locationRow}>
            <Text style={[styles.locationLabel, { color: theme.colors.text.secondary }]}>
              Longitude
            </Text>
            <Text style={[styles.locationValue, { color: theme.colors.text.primary }]}>
              {photo.location.longitude.toFixed(6)}°
            </Text>
          </View>
          
          {photo.location.altitude && (
            <View style={styles.locationRow}>
              <Text style={[styles.locationLabel, { color: theme.colors.text.secondary }]}>
                Altitude
              </Text>
              <Text style={[styles.locationValue, { color: theme.colors.text.primary }]}>
                {photo.location.altitude.toFixed(0)}m
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return renderDetailsTab();
      case 'metadata':
        return renderMetadataTab();
      case 'location':
        return renderLocationTab();
      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
          
          <Animated.View
            style={[
              styles.container,
              {
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <BlurView
              intensity={theme.mode === 'dark' ? 20 : 80}
              style={[styles.content, { backgroundColor: theme.colors.background.primary + 'CC' }]}
            >
              {renderHeader()}
              {renderPhotoSection()}
              {renderTabs()}
              {renderTabContent()}
            </BlurView>
          </Animated.View>
        </Animated.View>
      </Modal>
      
      <PhotoGallery
        photos={[photo, ...relatedPhotos]}
        visible={showGallery}
        onClose={() => setShowGallery(false)}
        initialIndex={0}
        onEdit={onEdit}
        onDelete={onDelete}
        onShare={onShare}
      />
      
      <PhotoEditor
        photo={photo}
        visible={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={handleSaveEdit}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: screenWidth * 0.95,
    maxHeight: screenHeight * 0.9,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  content: {
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
  headerButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
  },
  photoSection: {
    position: 'relative',
    height: screenHeight * 0.4,
    backgroundColor: 'black',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    padding: spacing[4],
  },
  captionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  caption: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  photoActions: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
  },
  favoriteIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: spacing[2],
    borderRadius: borderRadius.full,
    marginRight: spacing[2],
  },
  fullscreenButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing[2],
    borderRadius: borderRadius.full,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.purple[500],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  detailSection: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  detailIcon: {
    width: 40,
    alignItems: 'center',
    paddingTop: spacing[1],
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: spacing[1],
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailSubvalue: {
    fontSize: 12,
    marginTop: spacing[1],
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing[2],
  },
  tag: {
    backgroundColor: colors.purple[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    marginRight: spacing[2],
    marginBottom: spacing[2],
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  relatedPhotosContainer: {
    paddingVertical: spacing[2],
  },
  relatedPhoto: {
    width: 80,
    height: 80,
    marginRight: spacing[2],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  relatedPhotoImage: {
    width: '100%',
    height: '100%',
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  metadataLabel: {
    fontSize: 14,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  editHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  editHistoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.purple[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  editHistoryContent: {
    flex: 1,
  },
  editHistoryType: {
    fontSize: 14,
    fontWeight: '500',
  },
  editHistoryDate: {
    fontSize: 12,
    marginTop: spacing[1],
  },
  map: {
    flex: 1,
    minHeight: 200,
  },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    margin: spacing[4],
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing[2],
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    marginTop: spacing[1],
  },
  locationInfo: {
    padding: spacing[4],
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  locationLabel: {
    fontSize: 14,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});