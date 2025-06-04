import React, { useState, useRef } from 'react';
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

interface ProfileSetupModalProps {
  visible: boolean;
  onComplete: (profile: UserProfile) => void;
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

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  visible,
  onComplete,
}) => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({ width: 0, height: 0 });
  const [cropPosition, setCropPosition] = useState<CropPosition>({ x: 0, y: 0, scale: 1 });
  const [containerDimensions, setContainerDimensions] = useState<ImageDimensions>({ width: 0, height: 0 });
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
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

      console.log('=== DEBUGGING CROP COORDINATES ===');
      
      // 基本データ
      const { width: originalWidth, height: originalHeight } = imageDimensions;
      const { width: containerWidth, height: containerHeight } = containerDimensions;
      const userScale = cropPosition.scale;
      const userX = cropPosition.x;
      const userY = cropPosition.y;
      
      console.log('1. Basic data:');
      console.log('   Original image:', { originalWidth, originalHeight });
      console.log('   Container:', { containerWidth, containerHeight });
      console.log('   User transform:', { scale: userScale, x: userX, y: userY });
      
      // 白い円は常に200x200でコンテナの中央
      const cropRadius = 100;
      const cropCenterX = containerWidth / 2;
      const cropCenterY = containerHeight / 2;
      const cropTopLeftX = cropCenterX - cropRadius;
      const cropTopLeftY = cropCenterY - cropRadius;
      
      console.log('2. Crop circle (white circle):');
      console.log('   Center:', { cropCenterX, cropCenterY });
      console.log('   Top-left:', { cropTopLeftX, cropTopLeftY });
      console.log('   Size: 200x200');
      
      // 画像の表示サイズを計算（スケール前）
      const imageAspectRatio = originalWidth / originalHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      
      let baseImageWidth: number, baseImageHeight: number;
      if (imageAspectRatio > containerAspectRatio) {
        baseImageWidth = containerWidth;
        baseImageHeight = containerWidth / imageAspectRatio;
      } else {
        baseImageHeight = containerHeight;
        baseImageWidth = containerHeight * imageAspectRatio;
      }
      
      console.log('3. Image display (before user scale):');
      console.log('   Aspect ratios - image:', imageAspectRatio, 'container:', containerAspectRatio);
      console.log('   Base display size:', { baseImageWidth, baseImageHeight });
      
      // React NativeのAnimated.Viewのtransformは中心点基準で動作する
      // 画像の中心位置（transformなし）
      const baseImageCenterX = containerWidth / 2;
      const baseImageCenterY = containerHeight / 2;
      
      // スケール後の画像サイズ
      const scaledImageWidth = baseImageWidth * userScale;
      const scaledImageHeight = baseImageHeight * userScale;
      
      // 画像の実際の左上角の位置（中心点基準のtransformを考慮）
      const imageTopLeftX = baseImageCenterX - scaledImageWidth / 2 + userX;
      const imageTopLeftY = baseImageCenterY - scaledImageHeight / 2 + userY;
      
      console.log('4. Scaled and positioned image:');
      console.log('   Scaled image size:', { scaledImageWidth, scaledImageHeight });
      console.log('   Image center position:', { baseImageCenterX, baseImageCenterY });
      console.log('   User offset:', { userX, userY });
      console.log('   Final image top-left:', { imageTopLeftX, imageTopLeftY });
      
      // 切り取り領域の画像内での位置
      const cropInImageX = cropTopLeftX - imageTopLeftX;
      const cropInImageY = cropTopLeftY - imageTopLeftY;
      
      console.log('5. Crop area in scaled image coordinates:');
      console.log('   Crop position in image:', { cropInImageX, cropInImageY });
      console.log('   Crop size in image: 200x200');
      
      // 元画像座標に変換
      const scaleToOriginal = originalWidth / scaledImageWidth;
      const originalCropX = cropInImageX * scaleToOriginal;
      const originalCropY = cropInImageY * scaleToOriginal;
      const originalCropSize = 200 * scaleToOriginal;
      
      console.log('6. Converted to original image coordinates:');
      console.log('   Scale factor:', scaleToOriginal);
      console.log('   Original crop position:', { originalCropX, originalCropY });
      console.log('   Original crop size:', originalCropSize);
      
      // 境界チェック
      const finalX = Math.max(0, Math.min(originalCropX, originalWidth - originalCropSize));
      const finalY = Math.max(0, Math.min(originalCropY, originalHeight - originalCropSize));
      const finalSize = Math.max(50, Math.min(originalCropSize, Math.min(originalWidth, originalHeight)));
      
      console.log('7. Final bounded crop:');
      console.log('   Bounded position:', { finalX, finalY });
      console.log('   Bounded size:', finalSize);
      console.log('   Was clamped?', {
        x: finalX !== originalCropX,
        y: finalY !== originalCropY,
        size: finalSize !== originalCropSize
      });
      console.log('=====================================');

      const manipResult = await ImageManipulator.manipulateAsync(
        selectedImage,
        [
          {
            crop: {
              originX: Math.round(finalX),
              originY: Math.round(finalY),
              width: Math.round(finalSize),
              height: Math.round(finalSize),
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

  const handleComplete = async () => {
    if (!name.trim()) {
      Alert.alert(t('profile.nameRequired'), t('profile.nameRequiredMessage'));
      return;
    }

    setIsLoading(true);
    try {
      const profile = await profileService.saveProfile({
        name: name.trim(),
        avatarUri: avatarUri || undefined,
      });
      onComplete(profile);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(t('profile.saveError'), t('profile.saveErrorMessage'));
    } finally {
      setIsLoading(false);
    }
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
              theme.colors.background.primary,
              theme.colors.background.card,
            ]}
            style={styles.content}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                {t('profile.welcomeTitle')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                {t('profile.welcomeMessage')}
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
              
              {avatarUri && (
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={handleImagePicker}
                >
                  <Text style={[styles.changeImageText, { color: colors.purple.bright }]}>
                    {t('profile.changePhoto')}
                  </Text>
                </TouchableOpacity>
              )}
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
                placeholderTextColor={theme.colors.text.secondary}
                maxLength={50}
                autoFocus
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  {
                    backgroundColor: colors.purple.bright,
                    opacity: !name.trim() || isLoading ? 0.5 : 1,
                  },
                ]}
                onPress={handleComplete}
                disabled={!name.trim() || isLoading}
              >
                <Text style={styles.completeButtonText}>
                  {isLoading ? t('profile.saving') : t('profile.getStarted')}
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
              
              <View style={[styles.cropContainer, { backgroundColor: theme.colors.background.card }]}>
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
                        {/* Up button */}
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
                        
                        {/* Middle row with left, center, right */}
                        <View style={styles.positionMiddleRow}>
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
                            style={[styles.controlButton, { backgroundColor: theme.colors.background.secondary }]}
                            onPress={() => {
                              // Reset position to center
                              setCropPosition(prev => ({ ...prev, x: 0, y: 0 }));
                              Animated.parallel([
                                Animated.timing(translateX, {
                                  toValue: 0,
                                  duration: 200,
                                  useNativeDriver: true,
                                }),
                                Animated.timing(translateY, {
                                  toValue: 0,
                                  duration: 200,
                                  useNativeDriver: true,
                                }),
                              ]).start();
                            }}
                          >
                            <Ionicons name="locate" size={16} color={theme.colors.text.primary} />
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
    padding: 32,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 12,
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
  changeImageButton: {
    paddingVertical: 4,
  },
  changeImageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  nameInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  actions: {
    gap: 12,
  },
  completeButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Image Picker Styles
  cropContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
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
    padding: 16,
    gap: 16,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleText: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 50,
    textAlign: 'center',
  },
  positionControls: {
    alignItems: 'center',
    gap: 8,
  },
  positionMiddleRow: {
    flexDirection: 'row',
    gap: 8,
  },
});