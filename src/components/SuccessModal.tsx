import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';

const { width, height } = Dimensions.get('window');

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  confirmText,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      iconScaleAnim.setValue(0);
      sparkleAnims.forEach(anim => anim.setValue(0));

      // Start entrance animations
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
      ]).start(() => {
        // Start icon animation after modal appears
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }).start();

        // Start sparkle animations with delays
        sparkleAnims.forEach((anim, index) => {
          setTimeout(() => {
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ]).start();
          }, index * 200);
        });
      });
    }
  }, [visible]);

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
        
        {/* Floating sparkles */}
        {sparkleAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.sparkle,
              {
                top: height * 0.2 + (index * 80),
                left: width * 0.1 + (index % 2) * width * 0.7,
                opacity: anim,
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1.5],
                    }),
                  },
                  {
                    rotate: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="sparkles" size={20} color={colors.purple[300]} />
          </Animated.View>
        ))}

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
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <Animated.View
                style={[
                  styles.iconCircle,
                  {
                    transform: [{ scale: iconScaleAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={[colors.green[400], colors.green[600]]}
                  style={styles.iconGradient}
                >
                  <Ionicons name="checkmark" size={32} color="white" />
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Content */}
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                {title}
              </Text>
              <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
                {message}
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.purple[500], colors.purple[600]]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {confirmText || t('common.ok')}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sparkle: {
    position: 'absolute',
  },
  container: {
    width: width * 0.85,
    maxWidth: 400,
  },
  content: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  button: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});