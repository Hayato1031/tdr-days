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
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// import Slider from '@react-native-community/slider'; // Removed dependency
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { photoService, PhotoMetadata, PHOTO_FILTERS } from '../services/photoService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PhotoEditorProps {
  photo: PhotoMetadata;
  visible: boolean;
  onClose: () => void;
  onSave: (editedPhoto: PhotoMetadata) => void;
}

type EditMode = 'none' | 'crop' | 'filter' | 'adjust' | 'rotate';

interface EditState {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  currentFilter: string;
  cropData?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  photo,
  visible,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUri, setPreviewUri] = useState(photo.uri);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Edit state
  const [editState, setEditState] = useState<EditState>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    rotation: 0,
    currentFilter: 'original',
  });
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  
  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const cropViewRef = useRef<View>(null);
  const cropX = useRef(new Animated.Value(50)).current;
  const cropY = useRef(new Animated.Value(50)).current;
  const cropWidth = useRef(new Animated.Value(screenWidth - 100)).current;
  const cropHeight = useRef(new Animated.Value(screenWidth - 100)).current;

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
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetEdits();
              animateClose();
            },
          },
        ]
      );
    } else {
      animateClose();
    }
  };

  const animateClose = () => {
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
    ]).start(() => {
      onClose();
    });
  };

  const resetEdits = () => {
    setEditState({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      rotation: 0,
      currentFilter: 'original',
    });
    setPreviewUri(photo.uri);
    setHasChanges(false);
    setEditMode('none');
  };

  const applyFilter = async (filterId: string) => {
    setIsProcessing(true);
    try {
      const filter = PHOTO_FILTERS.find(f => f.id === filterId);
      if (filter) {
        const filtered = await photoService.applyFilter(photo.uri, filter);
        setPreviewUri(filtered);
        setEditState({ ...editState, currentFilter: filterId });
        setHasChanges(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to apply filter');
    } finally {
      setIsProcessing(false);
    }
  };

  const adjustBrightness = async (value: number) => {
    setEditState({ ...editState, brightness: value });
    setHasChanges(true);
    // Note: Actual brightness adjustment would be applied on save
  };

  const adjustContrast = async (value: number) => {
    setEditState({ ...editState, contrast: value });
    setHasChanges(true);
    // Note: Actual contrast adjustment would be applied on save
  };

  const adjustSaturation = async (value: number) => {
    setEditState({ ...editState, saturation: value });
    setHasChanges(true);
    // Note: Actual saturation adjustment would be applied on save
  };

  const rotatePhoto = async (degrees: number) => {
    setIsProcessing(true);
    try {
      const newRotation = (editState.rotation + degrees) % 360;
      const rotated = await photoService.rotatePhoto(previewUri, degrees);
      setPreviewUri(rotated);
      setEditState({ ...editState, rotation: newRotation });
      setHasChanges(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to rotate photo');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyCrop = async () => {
    if (!editState.cropData) return;
    
    setIsProcessing(true);
    try {
      const cropped = await photoService.cropPhoto(previewUri, {
        originX: editState.cropData.x,
        originY: editState.cropData.y,
        width: editState.cropData.width,
        height: editState.cropData.height,
      });
      setPreviewUri(cropped);
      setCropMode(false);
      setHasChanges(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to crop photo');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveEdits = async () => {
    setIsProcessing(true);
    try {
      // Create edited photo metadata
      const editedPhoto: PhotoMetadata = {
        ...photo,
        uri: previewUri,
        editHistory: [
          ...(photo.editHistory || []),
          {
            id: photoService.generatePhotoId(),
            type: 'filter',
            params: editState,
            timestamp: new Date(),
          },
        ],
      };
      
      onSave(editedPhoto);
      animateClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save edits');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderToolbar = () => (
    <View style={[styles.toolbar, { backgroundColor: theme.colors.background.elevated }]}>
      <TouchableOpacity
        style={[styles.toolButton, editMode === 'crop' && styles.toolButtonActive]}
        onPress={() => setEditMode(editMode === 'crop' ? 'none' : 'crop')}
      >
        <MaterialCommunityIcons name="crop" size={24} color={theme.colors.text.primary} />
        <Text style={[styles.toolButtonText, { color: theme.colors.text.secondary }]}>
          Crop
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.toolButton, editMode === 'filter' && styles.toolButtonActive]}
        onPress={() => setEditMode(editMode === 'filter' ? 'none' : 'filter')}
      >
        <Ionicons name="color-filter" size={24} color={theme.colors.text.primary} />
        <Text style={[styles.toolButtonText, { color: theme.colors.text.secondary }]}>
          Filter
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.toolButton, editMode === 'adjust' && styles.toolButtonActive]}
        onPress={() => setEditMode(editMode === 'adjust' ? 'none' : 'adjust')}
      >
        <Ionicons name="options" size={24} color={theme.colors.text.primary} />
        <Text style={[styles.toolButtonText, { color: theme.colors.text.secondary }]}>
          Adjust
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.toolButton, editMode === 'rotate' && styles.toolButtonActive]}
        onPress={() => setEditMode(editMode === 'rotate' ? 'none' : 'rotate')}
      >
        <MaterialCommunityIcons name="rotate-right" size={24} color={theme.colors.text.primary} />
        <Text style={[styles.toolButtonText, { color: theme.colors.text.secondary }]}>
          Rotate
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilterOptions = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {PHOTO_FILTERS.map(filter => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterOption,
            editState.currentFilter === filter.id && styles.filterOptionActive,
          ]}
          onPress={() => applyFilter(filter.id)}
        >
          <View style={styles.filterPreview}>
            <Image source={{ uri: photo.uri }} style={styles.filterPreviewImage} />
            <LinearGradient
              colors={[colors.purple[400] + '40', colors.purple[600] + '40']}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <Text
            style={[
              styles.filterName,
              { color: theme.colors.text.primary },
              editState.currentFilter === filter.id && { color: colors.purple[500] },
            ]}
          >
            {filter.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAdjustmentOptions = () => (
    <View style={styles.adjustmentContainer}>
      <View style={styles.adjustmentRow}>
        <Ionicons name="sunny" size={20} color={theme.colors.text.secondary} />
        <Text style={[styles.adjustmentLabel, { color: theme.colors.text.primary }]}>
          Brightness
        </Text>
        <View style={styles.sliderReplacement}>
          <TouchableOpacity 
            style={styles.sliderButton} 
            onPress={() => adjustBrightness(Math.max(-1, editState.brightness - 0.1))}
          >
            <Ionicons name="remove" size={16} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View 
              style={[
                styles.sliderProgress, 
                { 
                  width: `${((editState.brightness + 1) / 2) * 100}%`,
                  backgroundColor: colors.purple[500]
                }
              ]} 
            />
          </View>
          <TouchableOpacity 
            style={styles.sliderButton} 
            onPress={() => adjustBrightness(Math.min(1, editState.brightness + 0.1))}
          >
            <Ionicons name="add" size={16} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.adjustmentValue, { color: theme.colors.text.secondary }]}>
          {Math.round(editState.brightness * 100)}
        </Text>
      </View>
      
      <View style={styles.adjustmentRow}>
        <Ionicons name="contrast" size={20} color={theme.colors.text.secondary} />
        <Text style={[styles.adjustmentLabel, { color: theme.colors.text.primary }]}>
          Contrast
        </Text>
        <View style={styles.sliderReplacement}>
          <TouchableOpacity 
            style={styles.sliderButton} 
            onPress={() => adjustContrast(Math.max(-1, editState.contrast - 0.1))}
          >
            <Ionicons name="remove" size={16} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View 
              style={[
                styles.sliderProgress, 
                { 
                  width: `${((editState.contrast + 1) / 2) * 100}%`,
                  backgroundColor: colors.purple[500]
                }
              ]} 
            />
          </View>
          <TouchableOpacity 
            style={styles.sliderButton} 
            onPress={() => adjustContrast(Math.min(1, editState.contrast + 0.1))}
          >
            <Ionicons name="add" size={16} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.adjustmentValue, { color: theme.colors.text.secondary }]}>
          {Math.round(editState.contrast * 100)}
        </Text>
      </View>
      
      <View style={styles.adjustmentRow}>
        <Ionicons name="color-palette" size={20} color={theme.colors.text.secondary} />
        <Text style={[styles.adjustmentLabel, { color: theme.colors.text.primary }]}>
          Saturation
        </Text>
        <View style={styles.sliderReplacement}>
          <TouchableOpacity 
            style={styles.sliderButton} 
            onPress={() => adjustSaturation(Math.max(-1, editState.saturation - 0.1))}
          >
            <Ionicons name="remove" size={16} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View 
              style={[
                styles.sliderProgress, 
                { 
                  width: `${((editState.saturation + 1) / 2) * 100}%`,
                  backgroundColor: colors.purple[500]
                }
              ]} 
            />
          </View>
          <TouchableOpacity 
            style={styles.sliderButton} 
            onPress={() => adjustSaturation(Math.min(1, editState.saturation + 0.1))}
          >
            <Ionicons name="add" size={16} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.adjustmentValue, { color: theme.colors.text.secondary }]}>
          {Math.round(editState.saturation * 100)}
        </Text>
      </View>
    </View>
  );

  const renderRotateOptions = () => (
    <View style={styles.rotateContainer}>
      <TouchableOpacity
        style={styles.rotateButton}
        onPress={() => rotatePhoto(90)}
      >
        <MaterialCommunityIcons name="rotate-right" size={32} color={theme.colors.text.primary} />
        <Text style={[styles.rotateButtonText, { color: theme.colors.text.secondary }]}>
          Rotate Right
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.rotateButton}
        onPress={() => rotatePhoto(-90)}
      >
        <MaterialCommunityIcons name="rotate-left" size={32} color={theme.colors.text.primary} />
        <Text style={[styles.rotateButtonText, { color: theme.colors.text.secondary }]}>
          Rotate Left
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.rotateButton}
        onPress={() => rotatePhoto(180)}
      >
        <MaterialCommunityIcons name="flip-vertical" size={32} color={theme.colors.text.primary} />
        <Text style={[styles.rotateButtonText, { color: theme.colors.text.secondary }]}>
          Flip
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEditOptions = () => {
    switch (editMode) {
      case 'filter':
        return renderFilterOptions();
      case 'adjust':
        return renderAdjustmentOptions();
      case 'rotate':
        return renderRotateOptions();
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            backgroundColor: theme.colors.background.primary,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.background.elevated }]}>
            <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
              <Ionicons name="close" size={28} color={theme.colors.text.primary} />
            </TouchableOpacity>
            
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              Edit Photo
            </Text>
            
            <TouchableOpacity
              style={[styles.headerButton, styles.saveButton]}
              onPress={saveEdits}
              disabled={!hasChanges || isProcessing}
            >
              <LinearGradient
                colors={hasChanges ? [colors.purple[400], colors.purple[600]] : ['#999', '#666']}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {/* Photo Preview */}
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: previewUri }}
              style={styles.photo}
              resizeMode="contain"
            />
            
            {cropMode && (
              <View style={StyleSheet.absoluteFill}>
                <Animated.View
                  ref={cropViewRef}
                  style={[
                    styles.cropOverlay,
                    {
                      left: cropX,
                      top: cropY,
                      width: cropWidth,
                      height: cropHeight,
                    },
                  ]}
                />
              </View>
            )}
            
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={colors.purple[400]} />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            )}
          </View>
          
          {/* Toolbar */}
          {renderToolbar()}
          
          {/* Edit Options */}
          <View style={[styles.optionsContainer, { backgroundColor: theme.colors.background.secondary }]}>
            {renderEditOptions()}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  saveButton: {
    padding: 0,
  },
  saveButtonGradient: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  photoContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: screenWidth,
    height: '100%',
  },
  cropOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.purple[400],
    borderStyle: 'dashed',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    marginTop: spacing[2],
    fontSize: 16,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  toolButton: {
    alignItems: 'center',
    padding: spacing[2],
  },
  toolButtonActive: {
    backgroundColor: colors.purple[100],
    borderRadius: borderRadius.lg,
  },
  toolButtonText: {
    fontSize: 12,
    marginTop: spacing[1],
  },
  optionsContainer: {
    minHeight: 120,
    maxHeight: 200,
  },
  filterContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  filterOption: {
    alignItems: 'center',
    marginRight: spacing[3],
  },
  filterOptionActive: {
    transform: [{ scale: 1.1 }],
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing[1],
  },
  filterPreviewImage: {
    width: '100%',
    height: '100%',
  },
  filterName: {
    fontSize: 12,
  },
  adjustmentContainer: {
    padding: spacing[4],
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  adjustmentLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing[2],
    width: 80,
  },
  sliderReplacement: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[2],
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    marginHorizontal: spacing[2],
    overflow: 'hidden',
  },
  sliderProgress: {
    height: '100%',
    borderRadius: 3,
  },
  adjustmentValue: {
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  rotateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing[4],
  },
  rotateButton: {
    alignItems: 'center',
    padding: spacing[3],
  },
  rotateButtonText: {
    fontSize: 12,
    marginTop: spacing[1],
  },
});