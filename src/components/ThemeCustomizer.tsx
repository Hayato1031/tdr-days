// Clean Theme Customizer Component
// Beautiful white-based design with intuitive controls

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  TextInput,
  Share,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
// Removed designStyles import to avoid dependency issues

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ThemeCustomizerProps {
  visible: boolean;
  onClose: () => void;
}

interface PreviewCardProps {
  title: string;
  children: React.ReactNode;
}

// Preview Card Component
const PreviewCard: React.FC<PreviewCardProps> = ({ title, children }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.previewCard,
        {
          backgroundColor: colors.background.card,
          borderRadius: 12,
          shadowColor: colors.effects.shadowSoft,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: colors.utility.borderLight,
        },
      ]}
    >
      <Text style={[styles.previewCardTitle, { color: colors.text.secondary }]}>
        {title}
      </Text>
      {children}
    </View>
  );
};

// Main Theme Customizer Component
export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ visible, onClose }) => {
  const {
    theme,
    themeConfig,
    setDesignStyle,
    setAccentColor,
    setAnimationSpeed,
    setBorderRadiusPreference,
    setShadowIntensity,
    resetThemeDefaults,
    exportThemeSettings,
    importThemeSettings,
  } = useTheme();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempAccentColor, setTempAccentColor] = useState(themeConfig.accentColor);
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Design styles
  const designStyles: { value: string; label: string; icon: string }[] = [
    { value: 'material', label: 'Material', icon: 'layers' },
    { value: 'neumorphism', label: 'Neumorphism', icon: 'bulb' },
    { value: 'glassmorphism', label: 'Glassmorphism', icon: 'water' },
    { value: 'futuristic', label: 'Futuristic', icon: 'rocket' },
  ];

  // Animation speeds
  const animationSpeeds: { value: string; label: string; icon: string }[] = [
    { value: 'instant', label: 'Instant', icon: 'flash' },
    { value: 'fast', label: 'Fast', icon: 'speedometer' },
    { value: 'normal', label: 'Normal', icon: 'timer' },
    { value: 'slow', label: 'Slow', icon: 'hourglass' },
    { value: 'cinematic', label: 'Cinematic', icon: 'film' },
  ];

  // Preset accent colors - vibrant and beautiful
  const presetColors = [
    colors.purple[500],   // Purple
    colors.blue[500],     // Blue  
    colors.green[500],    // Green
    colors.orange[500],   // Orange
    colors.red[500],      // Red
    colors.pink[500],     // Pink
    colors.teal[500],     // Teal
    colors.yellow[500],   // Yellow
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: screenHeight,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDesignStyleChange = (style: string) => {
    setDesignStyle(style);
  };

  const handleAnimationSpeedChange = (speed: string) => {
    setAnimationSpeed(speed);
  };

  const handleAccentColorChange = (color: string) => {
    setTempAccentColor(color);
  };

  const applyAccentColor = () => {
    setAccentColor(tempAccentColor);
    setShowColorPicker(false);
  };

  const handlePresetColorSelect = (color: string) => {
    setAccentColor(color);
  };

  const handleExport = async () => {
    const settings = exportThemeSettings();
    
    try {
      await Share.share({
        message: settings,
        title: 'TDR Days Theme Settings',
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export theme settings');
    }
  };

  const handleImport = async () => {
    const success = await importThemeSettings(importText);
    
    if (success) {
      Alert.alert('Success', 'Theme settings imported successfully!');
      setShowImportModal(false);
      setImportText('');
    } else {
      Alert.alert('Import Failed', 'Invalid theme settings format');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Theme',
      'Are you sure you want to reset all theme customizations to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetThemeDefaults();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>

      {/* Main Container */}
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>テーマスタジオ</Text>
            <Text style={styles.headerSubtitle}>アプリの外観をカスタマイズ</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Live Preview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>プレビュー</Text>
            <View style={styles.previewGrid}>
              <PreviewCard title="ボタン">
                <TouchableOpacity
                  style={[
                    styles.previewButton,
                    {
                      backgroundColor: themeConfig.accentColor,
                    },
                  ]}
                >
                  <Text style={styles.previewButtonText}>サンプル</Text>
                </TouchableOpacity>
              </PreviewCard>

              <PreviewCard title="カード">
                <View style={styles.previewCardContent}>
                  <View
                    style={[
                      styles.previewAvatar,
                      {
                        backgroundColor: themeConfig.accentColor + '15',
                      },
                    ]}
                  >
                    <Ionicons name="heart" size={20} color={themeConfig.accentColor} />
                  </View>
                  <Text style={styles.previewCardText}>サンプルテキスト</Text>
                </View>
              </PreviewCard>
            </View>
          </View>

          {/* Design Style */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>デザインスタイル</Text>
            <View style={styles.optionGrid}>
              {designStyles.map((style) => (
                <TouchableOpacity
                  key={style.value}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor:
                        themeConfig.designStyle === style.value
                          ? themeConfig.accentColor + '10'
                          : colors.background.card,
                      borderColor:
                        themeConfig.designStyle === style.value
                          ? themeConfig.accentColor
                          : colors.utility.border,
                      borderWidth: 1.5,
                    },
                  ]}
                  onPress={() => handleDesignStyleChange(style.value)}
                >
                  <Ionicons
                    name={style.icon as any}
                    size={24}
                    color={
                      themeConfig.designStyle === style.value
                        ? themeConfig.accentColor
                        : colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color:
                          themeConfig.designStyle === style.value
                            ? themeConfig.accentColor
                            : colors.text.primary,
                      },
                    ]}
                  >
                    {style.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Accent Color */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>アクセントカラー</Text>
            <View style={styles.colorSection}>
              <View style={styles.presetColors}>
                {presetColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: color,
                        borderWidth: themeConfig.accentColor === color ? 3 : 2,
                        borderColor: themeConfig.accentColor === color ? colors.utility.white : colors.utility.border,
                        shadowColor: themeConfig.accentColor === color ? color : colors.effects.shadowSoft,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: themeConfig.accentColor === color ? 0.3 : 0.1,
                        shadowRadius: 4,
                        elevation: themeConfig.accentColor === color ? 3 : 1,
                      },
                    ]}
                    onPress={() => handlePresetColorSelect(color)}
                  >
                    {themeConfig.accentColor === color && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.customColorButton,
                  {
                    backgroundColor: themeConfig.accentColor,
                  },
                ]}
                onPress={() => setShowColorPicker(true)}
              >
                <Ionicons name="color-palette" size={18} color="white" />
                <Text style={styles.customColorButtonText}>カスタムカラー</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Animation Speed */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>アニメーション速度</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalOptions}
            >
              {animationSpeeds.map((speed) => (
                <TouchableOpacity
                  key={speed.value}
                  style={[
                    styles.speedOption,
                    {
                      backgroundColor:
                        themeConfig.animationSpeed === speed.value
                          ? themeConfig.accentColor
                          : colors.background.card,
                      borderWidth: 1,
                      borderColor:
                        themeConfig.animationSpeed === speed.value
                          ? themeConfig.accentColor
                          : colors.utility.border,
                    },
                  ]}
                  onPress={() => handleAnimationSpeedChange(speed.value)}
                >
                  <Ionicons
                    name={speed.icon as any}
                    size={18}
                    color={
                      themeConfig.animationSpeed === speed.value
                        ? 'white'
                        : colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.speedLabel,
                      {
                        color:
                          themeConfig.animationSpeed === speed.value
                            ? 'white'
                            : colors.text.primary,
                      },
                    ]}
                  >
                    {speed.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background.card }]}
              onPress={handleExport}
            >
              <Ionicons name="share" size={20} color={colors.text.primary} />
              <Text style={styles.actionButtonText}>エクスポート</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background.card }]}
              onPress={() => setShowImportModal(true)}
            >
              <Ionicons name="download" size={20} color={colors.text.primary} />
              <Text style={styles.actionButtonText}>インポート</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.semantic.error.background }]}
              onPress={handleReset}
            >
              <Ionicons name="refresh" size={20} color={colors.semantic.error.main} />
              <Text style={[styles.actionButtonText, { color: colors.semantic.error.main }]}>
                リセット
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Simple Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>カスタムカラー</Text>
            <TextInput
              style={[styles.colorInput, { borderColor: tempAccentColor }]}
              placeholder="#9333ea"
              placeholderTextColor={colors.text.tertiary}
              value={tempAccentColor}
              onChangeText={handleAccentColorChange}
              autoCapitalize="none"
            />
            <View style={[styles.colorPreview, { backgroundColor: tempAccentColor }]} />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background.tertiary }]}
                onPress={() => setShowColorPicker(false)}
              >
                <Text style={styles.modalButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: tempAccentColor }]}
                onPress={applyAccentColor}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>適用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Main Container Styles
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.92,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: colors.effects.shadowSoft,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.utility.borderLight,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background.tertiary,
  },

  // Content Styles
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },

  // Preview Styles
  previewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  previewCard: {
    flex: 1,
    padding: 16,
  },
  previewCardTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 8,
  },
  previewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  previewCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },

  // Option Grid Styles
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 6,
  },
  optionCard: {
    flex: 1,
    minWidth: 60,
    maxWidth: 80,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: colors.effects.shadowSoft,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 3,
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },

  // Color Styles
  colorSection: {
    gap: 16,
  },
  presetColors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customColorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  customColorButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Horizontal Options
  horizontalOptions: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 24,
  },
  speedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  speedLabel: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Action Styles
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.utility.border,
    shadowColor: colors.effects.shadowSoft,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.effects.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  colorInput: {
    backgroundColor: colors.background.tertiary,
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 16,
  },
  colorPreview: {
    height: 60,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default ThemeCustomizer;