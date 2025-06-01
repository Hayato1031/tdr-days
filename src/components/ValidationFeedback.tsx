import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { ValidationResult } from '../utils/validation';

interface ValidationFeedbackProps {
  validation?: ValidationResult;
  onDismiss?: () => void;
  style?: any;
  showSuccess?: boolean;
  successMessage?: string;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  validation,
  onDismiss,
  style,
  showSuccess = false,
  successMessage = 'All fields are valid',
}) => {
  const { theme } = useTheme();
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  const hasErrors = validation?.errors && validation.errors.length > 0;
  const hasWarnings = validation?.warnings && validation.warnings.length > 0;
  const isValid = validation?.isValid && !hasErrors;
  const shouldShow = hasErrors || hasWarnings || (showSuccess && isValid);

  useEffect(() => {
    if (shouldShow) {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldShow]);

  const getStatusColor = () => {
    if (hasErrors) return colors.red[500];
    if (hasWarnings) return colors.yellow[500];
    if (showSuccess && isValid) return colors.green[500];
    return colors.gray[500];
  };

  const getStatusIcon = () => {
    if (hasErrors) return 'alert-circle';
    if (hasWarnings) return 'warning';
    if (showSuccess && isValid) return 'checkmark-circle';
    return 'information-circle';
  };

  const getStatusText = () => {
    if (hasErrors) return 'Errors found';
    if (hasWarnings) return 'Warnings';
    if (showSuccess && isValid) return 'Success';
    return 'Information';
  };

  const renderMessages = (messages: string[], type: 'error' | 'warning' | 'success') => {
    if (!messages || messages.length === 0) return null;

    const color = type === 'error' ? colors.red[500] : 
                  type === 'warning' ? colors.yellow[500] : colors.green[500];

    return (
      <View style={styles.messageGroup}>
        {messages.map((message, index) => (
          <View key={index} style={styles.messageItem}>
            <Ionicons
              name={getStatusIcon()}
              size={16}
              color={color}
              style={styles.messageIcon}
            />
            <Text
              style={[
                styles.messageText,
                {
                  color: theme.colors.text.primary,
                  opacity: type === 'warning' ? 0.8 : 1,
                }
              ]}
            >
              {message}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (!shouldShow) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnimation,
          transform: [
            {
              translateY: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[
          `${getStatusColor()}15`,
          `${getStatusColor()}05`,
        ]}
        style={[
          styles.feedback,
          {
            borderColor: getStatusColor(),
            backgroundColor: theme.colors.background.elevated,
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons
              name={getStatusIcon()}
              size={20}
              color={getStatusColor()}
            />
            <Text style={[styles.headerText, { color: theme.colors.text.primary }]}>
              {getStatusText()}
            </Text>
            {(hasErrors || hasWarnings) && (
              <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.badgeText}>
                  {(validation?.errors?.length || 0) + (validation?.warnings?.length || 0)}
                </Text>
              </View>
            )}
          </View>
          
          {onDismiss && (
            <TouchableOpacity
              onPress={onDismiss}
              style={styles.dismissButton}
            >
              <Ionicons
                name="close"
                size={18}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <View style={styles.content}>
          {hasErrors && renderMessages(validation!.errors, 'error')}
          {hasWarnings && renderMessages(validation!.warnings, 'warning')}
          {showSuccess && isValid && (
            <View style={styles.messageGroup}>
              <View style={styles.messageItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.green[500]}
                  style={styles.messageIcon}
                />
                <Text
                  style={[
                    styles.messageText,
                    { color: theme.colors.text.primary }
                  ]}
                >
                  {successMessage}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Tips */}
        {hasErrors && (
          <View style={styles.tips}>
            <Text style={[styles.tipsTitle, { color: theme.colors.text.secondary }]}>
              Quick Tips:
            </Text>
            <Text style={[styles.tipsText, { color: theme.colors.text.tertiary }]}>
              • All required fields must be filled
              • Check for typos in location names
              • Ensure times are reasonable
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[2],
  },
  feedback: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: spacing[2],
    marginRight: spacing[2],
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  dismissButton: {
    padding: spacing[1],
  },
  content: {
    marginBottom: spacing[2],
  },
  messageGroup: {
    marginBottom: spacing[2],
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  messageIcon: {
    marginRight: spacing[2],
    marginTop: 2,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  tips: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: spacing[3],
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipsText: {
    fontSize: 12,
    lineHeight: 16,
  },
});