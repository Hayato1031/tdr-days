import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { profileService, UserProfile } from '../services/profileService';

const { width, height } = Dimensions.get('window');

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (profile: UserProfile) => void;
  currentProfile?: UserProfile | null;
}

interface ImageCropData {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface CropPosition {
  x: number;
  y: number;
  scale: number;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  onClose,
  onUpdate,
  currentProfile,
}) => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [cropData, setCropData] = useState<ImageCropData>({
    originX: 0,
    originY: 0,
    width: 300,
    height: 300,
  });
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({ width: 0, height: 0 });
  const [cropPosition, setCropPosition] = useState<CropPosition>({ x: 0, y: 0, scale: 1 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  // Simple Animated values for manual controls
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible && currentProfile) {
      setName(currentProfile.name || '');
      setAvatarUri(currentProfile.avatarUri || '');
    }
  }, [visible, currentProfile]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('profile.permissionRequired'),
          t('profile.permissionMessage')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        
        // Get image dimensions with error handling
        Image.getSize(
          asset.uri, 
          (width, height) => {
            console.log('Image dimensions:', { width, height });
            setImageDimensions({ width, height });
            
            // Check if image is square and show recommendation if not
            const aspectRatio = width / height;
            const isNearSquare = Math.abs(aspectRatio - 1) < 0.1; // Allow 10% tolerance
            
            if (!isNearSquare) {
              Alert.alert(
                t('profile.imageRecommendation'),
                t('profile.imageRecommendationMessage'),
                [
                  {
                    text: t('common.cancel'),
                    style: 'cancel',
                    onPress: () => {
                      setSelectedImage('');
                      return;
                    }
                  },
                  {
                    text: t('common.ok'),
                    onPress: () => {
                      // Reset crop position
                      translateX.setValue(0);
                      translateY.setValue(0);
                      scale.setValue(1);
                      setCropPosition({ x: 0, y: 0, scale: 1 });
                      setShowImagePicker(true);
                    }
                  }
                ]
              );
            } else {
              // Reset crop position
              translateX.setValue(0);
              translateY.setValue(0);
              scale.setValue(1);
              setCropPosition({ x: 0, y: 0, scale: 1 });
              setShowImagePicker(true);
            }
          },
          (error) => {
            console.error('Error getting image size:', error);
            Alert.alert(
              t('profile.imageError'), 
              t('profile.imageErrorMessage')
            );
          }
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('profile.imageError'), t('profile.imageErrorMessage'));
    }
  };

  const handleCropComplete = async () => {
    try {
      if (!selectedImage || !imageDimensions.width || !containerDimensions.width) return;

      // 重要: Overlayが透明なので、白い円の位置と実際の切り取り座標を直接的に対応させる
      
      // Step 1: 画像の元のサイズ
      const { width: originalWidth, height: originalHeight } = imageDimensions;
      
      // Step 2: UIで表示されている白い円は固定で200x200px、中央に配置
      const cropSize = 200;
      const cropRadius = 100;
      
      // Step 3: 実際のコンテナサイズ
      const { width: containerWidth, height: containerHeight } = containerDimensions;
      
      // Step 4: 白い円の中心座標（コンテナの中央）
      const cropCenterX = containerWidth / 2;
      const cropCenterY = containerHeight / 2;
      
      // Step 5: 画像がresizeMode="contain"でどのように表示されるかを計算
      const imageAspectRatio = originalWidth / originalHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      
      let displayedImageWidth: number, displayedImageHeight: number;
      
      // resizeMode="contain"の正確なロジック
      if (imageAspectRatio > containerAspectRatio) {
        // 画像の方が横長 → 幅に合わせてスケール
        displayedImageWidth = containerWidth;
        displayedImageHeight = containerWidth / imageAspectRatio;
      } else {
        // 画像の方が縦長 → 高さに合わせてスケール
        displayedImageHeight = containerHeight;
        displayedImageWidth = containerHeight * imageAspectRatio;
      }
      
      // Step 6: 画像の基本的な中央配置位置（transformなし）
      const baseImageCenterX = containerWidth / 2;
      const baseImageCenterY = containerHeight / 2;
      
      // Step 7: React NativeのAnimated.Viewのtransformは中心点基準
      // ユーザーのスケールとオフセットは中心点から適用される
      const userScale = cropPosition.scale;
      const userOffsetX = cropPosition.x;
      const userOffsetY = cropPosition.y;
      
      // Step 8: スケール後の画像サイズ
      const scaledImageWidth = displayedImageWidth * userScale;
      const scaledImageHeight = displayedImageHeight * userScale;
      
      // Step 9: 画像の実際の左上角の位置（中心点基準のtransformを考慮）
      const actualImageX = baseImageCenterX - scaledImageWidth / 2 + userOffsetX;
      const actualImageY = baseImageCenterY - scaledImageHeight / 2 + userOffsetY;
      
      console.log('=== REACT NATIVE TRANSFORM BASED CALCULATION ===');
      console.log('Original image size:', { originalWidth, originalHeight });
      console.log('Container size:', { containerWidth, containerHeight });
      console.log('Displayed image size (contain):', { displayedImageWidth, displayedImageHeight });
      console.log('Image center position:', { baseImageCenterX, baseImageCenterY });
      console.log('User transformations:', { scale: userScale, offsetX: userOffsetX, offsetY: userOffsetY });
      console.log('Scaled image size:', { scaledImageWidth, scaledImageHeight });
      console.log('Actual image top-left:', { actualImageX, actualImageY });
      console.log('Crop circle center:', { cropCenterX, cropCenterY });
      
      // Step 10: 白い円の範囲を画像座標に変換
      // 白い円の左上角の座標
      const cropRectX = cropCenterX - cropRadius;
      const cropRectY = cropCenterY - cropRadius;
      
      // 画像座標系での切り取り範囲（スケール済み画像内での位置）
      const cropInScaledImageX = cropRectX - actualImageX;
      const cropInScaledImageY = cropRectY - actualImageY;
      
      console.log('Crop rectangle (container coords):', { cropRectX, cropRectY, cropSize });
      console.log('Crop in scaled image coords:', { cropInScaledImageX, cropInScaledImageY, cropSize });
      
      // Step 11: スケールされた画像座標から元画像座標への変換
      const scaleToOriginal = originalWidth / scaledImageWidth;
      
      const finalCropX = cropInScaledImageX * scaleToOriginal;
      const finalCropY = cropInScaledImageY * scaleToOriginal;
      const finalCropSize = cropSize * scaleToOriginal;
      
      console.log('Scale to original:', scaleToOriginal);
      console.log('Final crop (original coords):', { finalCropX, finalCropY, finalCropSize });
      
      // Step 10: 境界チェック
      const boundedX = Math.max(0, Math.min(finalCropX, originalWidth - finalCropSize));
      const boundedY = Math.max(0, Math.min(finalCropY, originalHeight - finalCropSize));
      const boundedSize = Math.max(10, Math.min(finalCropSize, Math.min(originalWidth, originalHeight)));
      
      console.log('Bounded crop:', { boundedX, boundedY, boundedSize });
      console.log('================================');

      const manipResult = await ImageManipulator.manipulateAsync(
        selectedImage,
        [
          {
            crop: {
              originX: Math.round(boundedX),
              originY: Math.round(boundedY),
              width: Math.round(boundedSize),
              height: Math.round(boundedSize),
            },
          },
          { resize: { width: 200, height: 200 } },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setAvatarUri(manipResult.uri);
      setShowImagePicker(false);
      setSelectedImage('');
    } catch (error) {
      console.error('Error cropping image:', error);
      Alert.alert(
        t('profile.cropError'), 
        t('profile.cropErrorMessage')
      );
    }
  };

  const handleRemoveImage = () => {
    setAvatarUri('');
    setShowImagePicker(false);
    setSelectedImage('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('profile.nameRequired'), t('profile.nameRequiredMessage'));
      return;
    }

    setIsLoading(true);
    try {
      const updatedProfile = await profileService.updateProfile({
        name: name.trim(),
        avatarUri: avatarUri || undefined,
      });
      onUpdate(updatedProfile);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('profile.saveError'), t('profile.saveErrorMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (currentProfile) {
      setName(currentProfile.name || '');
      setAvatarUri(currentProfile.avatarUri || '');
    }
    onClose();
  };

  const handleSkipImage = () => {
    setShowImagePicker(false);
    setSelectedImage('');
    // Reset animation values
    translateX.setValue(0);
    translateY.setValue(0);
    scale.setValue(1);
    setCropPosition({ x: 0, y: 0, scale: 1 });
  };
  

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={80} style={StyleSheet.absoluteFill} />
        
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              theme.colors.background.elevated,
              theme.colors.background.card,
            ]}
            style={styles.content}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                {t('profile.editProfile')}
              </Text>
            </View>

            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={[
                  styles.avatarContainer,
                  {
                    borderColor: colors.purple.bright + '30',
                    backgroundColor: colors.purple.bright + '10',
                  },
                ]}
                onPress={handleImagePicker}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons
                      name="camera"
                      size={32}
                      color={colors.purple.bright}
                    />
                    <Text style={[styles.avatarText, { color: colors.purple.bright }]}>
                      {t('profile.addPhoto')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={styles.avatarActions}>
                <TouchableOpacity
                  style={styles.imageActionButton}
                  onPress={handleImagePicker}
                >
                  <Text style={[styles.imageActionText, { color: colors.purple.bright }]}>
                    {avatarUri ? t('profile.changePhoto') : t('profile.addPhoto')}
                  </Text>
                </TouchableOpacity>
                
                {avatarUri && (
                  <TouchableOpacity
                    style={styles.imageActionButton}
                    onPress={handleRemoveImage}
                  >
                    <Text style={[styles.imageActionText, { color: colors.semantic.error.main }]}>
                      {t('common.delete')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Name Input */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>
                {t('profile.yourName')} *
              </Text>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: colors.utility.borderLight,
                    color: theme.colors.text.primary,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder={t('profile.namePlaceholder')}
                placeholderTextColor={theme.colors.text.disabled}
                maxLength={50}
              />
            </View>

            {/* Bottom Buttons */}
            <View style={styles.bottomButtons}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButtonBottom}>
                <Text style={[styles.cancelText, { color: theme.colors.text.secondary }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.saveButtonBottom,
                  {
                    backgroundColor: colors.purple.bright,
                    opacity: !name.trim() || isLoading ? 0.5 : 1,
                  },
                ]}
                disabled={!name.trim() || isLoading}
              >
                <Text style={styles.saveText}>
                  {isLoading ? t('profile.saving') : t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Image Picker Modal */}
        {showImagePicker && (
          <Modal visible={showImagePicker} transparent>
            <View style={styles.overlay}>
              <BlurView intensity={80} style={StyleSheet.absoluteFill} />
              
              <View style={[styles.cropContainer, { backgroundColor: theme.colors.background.elevated }]}>
                <View style={styles.cropHeader}>
                  <TouchableOpacity onPress={handleSkipImage}>
                    <Text style={[styles.cropCancelText, { color: theme.colors.text.secondary }]}>
                      {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>
                  
                  <Text style={[styles.cropTitle, { color: theme.colors.text.primary }]}>
                    {t('profile.cropImage')}
                  </Text>
                  
                  <TouchableOpacity onPress={handleCropComplete}>
                    <Text style={[styles.cropDoneText, { color: colors.purple.bright }]}>
                      {t('common.done')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {selectedImage && (
                  <View 
                    style={styles.cropImageContainer}
                    onLayout={(event) => {
                      const { width, height } = event.nativeEvent.layout;
                      setContainerDimensions({ width, height });
                    }}
                  >
                    <Animated.View
                      style={[
                        styles.imageWrapper,
                        {
                          transform: [
                            { translateX: translateX },
                            { translateY: translateY },
                            { scale: scale },
                          ],
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: selectedImage }}
                        style={styles.cropImage}
                        resizeMode="contain"
                      />
                    </Animated.View>
                    
                    {/* Crop frame overlay */}
                    <View style={styles.cropOverlay}>
                      <View style={styles.cropFrame}>
                        {/* Inner transparent circle to show crop area clearly */}
                        <View style={styles.cropInner} />
                      </View>
                    </View>
                  </View>
                )}

                  <View style={styles.cropInstructionsContainer}>
                    <Text style={[styles.cropInstructions, { color: theme.colors.text.secondary }]}>
                      {t('profile.cropInstructions')}
                    </Text>
                    <Text style={[styles.cropRecommendation, { color: colors.orange.bright }]}>
                      {t('profile.cropRecommendation')}
                    </Text>
                  </View>
                  
                  {/* Manual Controls */}
                  <View style={styles.cropControls}>
                    {/* Scale Controls */}
                    <View style={styles.controlRow}>
                      <Text style={[styles.controlLabel, { color: theme.colors.text.secondary }]}>
                        {t('profile.scaleControl') || (language === 'ja' ? '拡大・縮小' : 'Scale')}
                      </Text>
                      <View style={styles.controlButtons}>
                        <TouchableOpacity
                          style={[styles.controlButton, { backgroundColor: theme.colors.background.secondary }]}
                          onPress={() => {
                            const newScale = Math.max(0.5, cropPosition.scale - 0.1);
                            setCropPosition(prev => ({ ...prev, scale: newScale }));
                            Animated.timing(scale, {
                              toValue: newScale,
                              duration: 200,
                              useNativeDriver: true,
                            }).start();
                          }}
                        >
                          <Ionicons name="remove" size={16} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.scaleText, { color: theme.colors.text.primary }]}>
                          {(cropPosition.scale * 100).toFixed(0)}%
                        </Text>
                        <TouchableOpacity
                          style={[styles.controlButton, { backgroundColor: theme.colors.background.secondary }]}
                          onPress={() => {
                            const newScale = Math.min(3, cropPosition.scale + 0.1);
                            setCropPosition(prev => ({ ...prev, scale: newScale }));
                            Animated.timing(scale, {
                              toValue: newScale,
                              duration: 200,
                              useNativeDriver: true,
                            }).start();
                          }}
                        >
                          <Ionicons name="add" size={16} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Position Controls */}
                    <View style={styles.controlRow}>
                      <Text style={[styles.controlLabel, { color: theme.colors.text.secondary }]}>
                        {t('profile.positionControl') || (language === 'ja' ? '位置調整' : 'Position')}
                      </Text>
                      <View style={styles.positionControls}>
                        {/* Vertical Controls */}
                        <TouchableOpacity
                          style={[styles.controlButton, { backgroundColor: theme.colors.background.secondary }]}
                          onPress={() => {
                            const newY = cropPosition.y + 10; // Up button moves image up (positive Y)
                            setCropPosition(prev => ({ ...prev, y: newY }));
                            Animated.timing(translateY, {
                              toValue: newY,
                              duration: 200,
                              useNativeDriver: true,
                            }).start();
                          }}
                        >
                          <Ionicons name="chevron-up" size={16} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                        
                        <View style={styles.horizontalControls}>
                          <TouchableOpacity
                            style={[styles.controlButton, { backgroundColor: theme.colors.background.secondary }]}
                            onPress={() => {
                              const newX = cropPosition.x + 10; // Left button moves image left (positive X)
                              setCropPosition(prev => ({ ...prev, x: newX }));
                              Animated.timing(translateX, {
                                toValue: newX,
                                duration: 200,
                                useNativeDriver: true,
                              }).start();
                            }}
                          >
                            <Ionicons name="chevron-back" size={16} color={theme.colors.text.primary} />
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[styles.resetButton, { backgroundColor: colors.purple.bright }]}
                            onPress={() => {
                              setCropPosition(prev => ({ ...prev, x: 0, y: 0 }));
                              Animated.parallel([
                                Animated.timing(translateX, {
                                  toValue: 0,
                                  duration: 300,
                                  useNativeDriver: true,
                                }),
                                Animated.timing(translateY, {
                                  toValue: 0,
                                  duration: 300,
                                  useNativeDriver: true,
                                }),
                              ]).start();
                            }}
                          >
                            <Ionicons name="refresh" size={14} color="white" />
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[styles.controlButton, { backgroundColor: theme.colors.background.secondary }]}
                            onPress={() => {
                              const newX = cropPosition.x - 10; // Right button moves image right (negative X)
                              setCropPosition(prev => ({ ...prev, x: newX }));
                              Animated.timing(translateX, {
                                toValue: newX,
                                duration: 200,
                                useNativeDriver: true,
                              }).start();
                            }}
                          >
                            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.primary} />
                          </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity
                          style={[styles.controlButton, { backgroundColor: theme.colors.background.secondary }]}
                          onPress={() => {
                            const newY = cropPosition.y - 10; // Down button moves image down (negative Y)
                            setCropPosition(prev => ({ ...prev, y: newY }));
                            Animated.timing(translateY, {
                              toValue: newY,
                              duration: 200,
                              useNativeDriver: true,
                            }).start();
                          }}
                        >
                          <Ionicons name="chevron-down" size={16} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    width: Math.min(400, width * 0.9),
    maxHeight: height * 0.8,
  },
  content: {
    borderRadius: 24,
    padding: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 16,
  },
  imageActionButton: {
    paddingVertical: 4,
  },
  imageActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  cropContainer: {
    width: Math.min(400, width * 0.95),
    height: height * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cropCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cropTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cropDoneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cropImageContainer: {
    flex: 1,
    position: 'relative',
    margin: 20,
    overflow: 'hidden',
  },
  gestureContainer: {
    flex: 1,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropImage: {
    width: '100%',
    height: '100%',
  },
  cropOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  cropFrame: {
    width: 200,
    height: 200,
    borderWidth: 4,
    borderColor: 'white',
    borderRadius: 100,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    // Add a second border for better visibility
    borderStyle: 'solid',
  },
  cropInner: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 92, // 96 - 4 (border width)
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  cropInstructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cropInstructions: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  cropRecommendation: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  cropControls: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  positionControls: {
    alignItems: 'center',
    gap: 8,
  },
  horizontalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    gap: 16,
  },
  cancelButtonBottom: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.utility.borderLight,
    alignItems: 'center',
  },
  saveButtonBottom: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});