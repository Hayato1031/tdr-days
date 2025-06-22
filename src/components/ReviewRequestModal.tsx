import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as StoreReview from 'expo-store-review';
import { Linking, Platform, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { reviewService } from '../services/reviewService';

const { width, height } = Dimensions.get('window');

interface ReviewRequestModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ReviewRequestModal: React.FC<ReviewRequestModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    console.log('ReviewRequestModal visible:', visible);
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleReview = async () => {
    console.log('Review button pressed');
    onClose();
    // Small delay to close modal before showing native review
    setTimeout(async () => {
      try {
        console.log('Requesting store review...');
        const isAvailable = await StoreReview.isAvailableAsync();
        console.log('Store review available:', isAvailable);
        
        if (isAvailable) {
          await StoreReview.requestReview();
          console.log('Store review requested');
        } else {
          console.log('Store review not available');
          // Fallback for development
          if (__DEV__) {
            Alert.alert(
              language === 'ja' ? '開発環境' : 'Development Environment',
              language === 'ja' 
                ? 'Expo Goではレビュー画面は表示されません。本番ビルドでは正常に動作します。'
                : 'Review screen is not available in Expo Go. It will work properly in production builds.',
              [{ text: 'OK' }]
            );
          }
        }
      } catch (error) {
        console.error('Error requesting review:', error);
      }
    }, 300);
  };

  const handleLater = () => {
    onClose();
  };

  const handleNever = async () => {
    await reviewService.markAsRated();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <BlurView intensity={100} style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            activeOpacity={1}
            onPress={handleLater}
          />
        </BlurView>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.purple[500], colors.purple[600]]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/AppIcons/playstore.png')}
                style={styles.appIcon}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>

          <View style={[styles.content, { backgroundColor: theme.colors.background.elevated }]}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {language === 'ja' 
                ? 'TDR Daysをご利用いただきありがとうございます！' 
                : 'Thank you for using TDR Days!'}
            </Text>
            
            <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
              {language === 'ja' 
                ? 'アプリをより良くするため、ストアでの評価をお願いできますか？あなたのフィードバックが今後の開発に役立ちます。' 
                : 'Would you mind rating us on the App Store? Your feedback helps us improve the app for everyone.'}
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.purple[500] }]}
                onPress={handleReview}
                activeOpacity={0.8}
              >
                <Ionicons name="star" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>
                  {language === 'ja' ? '評価する' : 'Rate Now'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: theme.colors.background.secondary }]}
                onPress={handleLater}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? '後で' : 'Maybe Later'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textButton}
                onPress={handleNever}
                activeOpacity={0.6}
              >
                <Text style={[styles.textButtonText, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? '今後表示しない' : "Don't Ask Again"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  appIcon: {
    width: 80,
    height: 80,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  textButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});