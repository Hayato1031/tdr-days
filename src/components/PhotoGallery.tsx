import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Share,
  Alert,
  Modal,
  PanResponder,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { PhotoMetadata } from '../services/photoService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PhotoGalleryProps {
  photos: PhotoMetadata[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
  onPhotoChange?: (index: number) => void;
  onShare?: (photo: PhotoMetadata) => void;
  onDownload?: (photo: PhotoMetadata) => void;
  onDelete?: (photo: PhotoMetadata) => void;
  onEdit?: (photo: PhotoMetadata) => void;
  showMetadata?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  initialIndex = 0,
  visible,
  onClose,
  onPhotoChange,
  onShare,
  onDownload,
  onDelete,
  onEdit,
  showMetadata = true,
}) => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  
  // Pinch zoom state
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  
  // Pan state
  const translateXOffset = useRef(0);
  const translateYOffset = useRef(0);
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      StatusBar.setHidden(true, 'fade');
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      StatusBar.setHidden(false, 'fade');
    }
  }, [visible]);

  useEffect(() => {
    if (onPhotoChange) {
      onPhotoChange(currentIndex);
    }
  }, [currentIndex]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showControls) {
        hideControls();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls, currentIndex]);

  const hideControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowControls(false));
  };

  const toggleControls = () => {
    if (showControls) {
      hideControls();
    } else {
      setShowControls(true);
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      animateTransition('left', () => {
        setCurrentIndex(currentIndex - 1);
        resetZoomAndPan();
      });
    }
  };

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      animateTransition('right', () => {
        setCurrentIndex(currentIndex + 1);
        resetZoomAndPan();
      });
    }
  };

  const animateTransition = (direction: 'left' | 'right', callback: () => void) => {
    const toValue = direction === 'left' ? screenWidth : -screenWidth;
    
    Animated.timing(translateX, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      callback();
      translateX.setValue(-toValue);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const resetZoomAndPan = () => {
    Animated.parallel([
      Animated.spring(baseScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(panX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
    
    lastScale.current = 1;
    translateXOffset.current = 0;
    translateYOffset.current = 0;
  };

  const handlePinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const handlePinchStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      lastScale.current *= event.nativeEvent.scale;
      lastScale.current = Math.max(1, Math.min(lastScale.current, 4));
      
      Animated.spring(baseScale, {
        toValue: lastScale.current,
        useNativeDriver: true,
      }).start();
      
      pinchScale.setValue(1);
      
      if (lastScale.current === 1) {
        resetZoomAndPan();
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Allow pan if zoomed in or if it's a horizontal swipe when not zoomed
        return lastScale.current > 1 || Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        panX.setOffset(translateXOffset.current);
        panY.setOffset(translateYOffset.current);
      },
      onPanResponderMove: (_, gestureState) => {
        if (lastScale.current > 1) {
          // Allow panning when zoomed
          panX.setValue(gestureState.dx);
          panY.setValue(gestureState.dy);
        } else {
          // Swipe to change photos when not zoomed
          if (Math.abs(gestureState.dx) > 50) {
            if (gestureState.dx > 0 && currentIndex > 0) {
              goToPrevious();
            } else if (gestureState.dx < 0 && currentIndex < photos.length - 1) {
              goToNext();
            }
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (lastScale.current > 1) {
          panX.flattenOffset();
          panY.flattenOffset();
          translateXOffset.current += gestureState.dx;
          translateYOffset.current += gestureState.dy;
        }
      },
    })
  ).current;

  const handleShare = async () => {
    const photo = photos[currentIndex];
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
    const photo = photos[currentIndex];
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
              if (currentIndex >= photos.length - 1 && currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
              }
            }
          },
        },
      ]
    );
  };

  const handleDownload = () => {
    const photo = photos[currentIndex];
    if (onDownload) {
      onDownload(photo);
    }
  };

  const handleEdit = () => {
    const photo = photos[currentIndex];
    if (onEdit) {
      onEdit(photo);
    }
  };

  const currentPhoto = photos[currentIndex];

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: controlsOpacity,
          transform: [{ translateY: showControls ? 0 : -100 }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {currentIndex + 1} / {photos.length}
          </Text>
          
          <View style={styles.headerActions}>
            {showMetadata && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowInfo(!showInfo)}
              >
                <Ionicons name="information-circle-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );

  const renderFooter = () => (
    <Animated.View
      style={[
        styles.footer,
        {
          opacity: controlsOpacity,
          transform: [{ translateY: showControls ? 0 : 100 }],
        },
      ]}
    >
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
        style={styles.footerGradient}
      >
        <SafeAreaView style={styles.footerContent}>
          {currentPhoto.caption && (
            <Text style={styles.caption} numberOfLines={2}>
              {currentPhoto.caption}
            </Text>
          )}
          
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.footerButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="white" />
            </TouchableOpacity>
            
            {onEdit && (
              <TouchableOpacity style={styles.footerButton} onPress={handleEdit}>
                <Ionicons name="create-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
            
            {onDownload && (
              <TouchableOpacity style={styles.footerButton} onPress={handleDownload}>
                <Ionicons name="download-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity style={styles.footerButton} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color={colors.semantic.error.light} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );

  const renderPhotoInfo = () => (
    <Modal
      visible={showInfo}
      transparent
      animationType="slide"
      onRequestClose={() => setShowInfo(false)}
    >
      <TouchableOpacity
        style={styles.infoBackdrop}
        activeOpacity={1}
        onPress={() => setShowInfo(false)}
      >
        <View style={styles.infoContainer}>
          <BlurView intensity={80} style={styles.infoContent}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>Photo Details</Text>
              <TouchableOpacity onPress={() => setShowInfo(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoBody}>
              {currentPhoto.takenAt && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color={theme.colors.text.secondary} />
                  <Text style={styles.infoText}>
                    {currentPhoto.takenAt.toLocaleDateString()}
                  </Text>
                </View>
              )}
              
              {currentPhoto.location && (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color={theme.colors.text.secondary} />
                  <Text style={styles.infoText}>
                    {currentPhoto.location.latitude.toFixed(4)}, {currentPhoto.location.longitude.toFixed(4)}
                  </Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="image-size-select-actual" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoText}>
                  {currentPhoto.width} × {currentPhoto.height}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="document" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoText}>
                  {(currentPhoto.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </View>
              
              {currentPhoto.tags && currentPhoto.tags.length > 0 && (
                <View style={styles.infoRow}>
                  <Ionicons name="pricetags" size={20} color={theme.colors.text.secondary} />
                  <View style={styles.tagContainer}>
                    {currentPhoto.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {currentPhoto.exif && (
                <>
                  <Text style={styles.infoSectionTitle}>Camera Info</Text>
                  
                  {currentPhoto.exif.make && (
                    <View style={styles.infoRow}>
                      <Ionicons name="camera" size={20} color={theme.colors.text.secondary} />
                      <Text style={styles.infoText}>
                        {currentPhoto.exif.make} {currentPhoto.exif.model}
                      </Text>
                    </View>
                  )}
                  
                  {currentPhoto.exif.focalLength && (
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="camera-iris" size={20} color={theme.colors.text.secondary} />
                      <Text style={styles.infoText}>
                        f/{currentPhoto.exif.aperture} · {currentPhoto.exif.exposureTime}s · ISO {currentPhoto.exif.iso}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </BlurView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderPhoto = () => {
    const animatedScale = Animated.multiply(baseScale, pinchScale);
    
    return (
      <GestureHandlerRootView style={styles.photoContainer}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleControls}
          style={StyleSheet.absoluteFill}
        >
          <PinchGestureHandler
            onGestureEvent={handlePinchGestureEvent}
            onHandlerStateChange={handlePinchStateChange}
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  transform: [
                    { translateX: Animated.add(translateX, panX) },
                    { translateY: panY },
                    { scale: animatedScale },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <Animated.Image
                source={{ uri: currentPhoto.uri }}
                style={styles.photo}
                resizeMode="contain"
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
              />
            </Animated.View>
          </PinchGestureHandler>
        </TouchableOpacity>
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.purple[400]} />
          </View>
        )}
      </GestureHandlerRootView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            backgroundColor: 'black',
          },
        ]}
      >
        {renderPhoto()}
        {renderHeader()}
        {renderFooter()}
        {renderPhotoInfo()}
        
        {/* Navigation arrows */}
        {currentIndex > 0 && showControls && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonLeft]}
            onPress={goToPrevious}
          >
            <Ionicons name="chevron-back" size={32} color="white" />
          </TouchableOpacity>
        )}
        
        {currentIndex < photos.length - 1 && showControls && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonRight]}
            onPress={goToNext}
          >
            <Ionicons name="chevron-forward" size={32} color="white" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: screenWidth,
    height: screenHeight,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  closeButton: {
    padding: spacing[2],
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: spacing[2],
    marginLeft: spacing[2],
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  footerGradient: {
    paddingBottom: Platform.OS === 'ios' ? 0 : spacing[4],
  },
  footerContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  caption: {
    color: 'white',
    fontSize: 14,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerButton: {
    padding: spacing[3],
    marginHorizontal: spacing[2],
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    padding: spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  navButtonLeft: {
    left: spacing[4],
  },
  navButtonRight: {
    right: spacing[4],
  },
  infoBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  infoContainer: {
    maxHeight: '80%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  infoContent: {
    padding: spacing[4],
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  infoBody: {
    paddingBottom: spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  infoText: {
    marginLeft: spacing[3],
    fontSize: 14,
    color: 'white',
    flex: 1,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginTop: spacing[4],
    marginBottom: spacing[3],
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: spacing[3],
    flex: 1,
  },
  tag: {
    backgroundColor: colors.purple[500],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
    marginRight: spacing[1],
    marginBottom: spacing[1],
  },
  tagText: {
    color: 'white',
    fontSize: 12,
  },
});