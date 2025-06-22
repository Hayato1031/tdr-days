import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { dataMigrationService } from '../services/dataMigrationService';

const { width, height } = Dimensions.get('window');

interface DataExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme.mode === 'dark';
  
  const [step, setStep] = useState<'preview' | 'exporting' | 'success' | 'error'>('preview');
  const [exportData, setExportData] = useState({
    visits: 0,
    companions: 0,
    actions: 0,
    totalPhotos: 0,
  });
  const [errorMessage, setErrorMessage] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadPreviewData();
      // Reset state
      setStep('preview');
      setErrorMessage('');
      
      // Animate in
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }
  }, [visible]);

  const loadPreviewData = async () => {
    try {
      const preview = await dataMigrationService.getExportPreview();
      setExportData(preview);
    } catch (error) {
      console.error('Failed to load preview:', error);
    }
  };

  const handleExport = async () => {
    setStep('exporting');
    
    // Animate progress
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    try {
      const result = await dataMigrationService.exportData();
      
      if (result.success) {
        setStep('success');
      } else {
        setStep('error');
        setErrorMessage(result.error || 'Export failed');
      }
    } catch (error) {
      setStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Reset animations
      progressAnim.setValue(0);
    });
  };

  const renderContent = () => {
    switch (step) {
      case 'preview':
        return (
          <>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#4ecdc4', '#45b7b8']}
                style={styles.iconGradient}
              >
                <Ionicons name="cloud-upload-outline" size={32} color="white" />
              </LinearGradient>
            </View>

            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? 'データをエクスポート' : 'Export Data'}
            </Text>

            <View style={[styles.warningBox, { 
              backgroundColor: isDark ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.1)',
              borderColor: '#ffc107',
            }]}>
              <Ionicons name="warning" size={20} color="#ffc107" />
              <Text style={[styles.warningText, { color: theme.colors.text.primary }]}>
                {language === 'ja' 
                  ? '重要: 写真データは引き継がれません'
                  : 'Important: Photo data will not be transferred'
                }
              </Text>
            </View>

            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {language === 'ja' 
                ? '以下のデータがJSONファイルとしてエクスポートされます。写真データは含まれませんのでご注意ください。'
                : 'The following data will be exported as a JSON file. Please note that photo data is not included.'
              }
            </Text>

            <View style={styles.dataPreview}>
              <View style={styles.dataItem}>
                <Ionicons name="calendar" size={16} color={colors.purple[500]} />
                <Text style={[styles.dataLabel, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? '来園記録' : 'Visits'}
                </Text>
                <Text style={[styles.dataValue, { color: colors.purple[600] }]}>
                  {exportData.visits}
                </Text>
              </View>

              <View style={styles.dataItem}>
                <Ionicons name="people" size={16} color={colors.blue[500]} />
                <Text style={[styles.dataLabel, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? '同行者' : 'Companions'}
                </Text>
                <Text style={[styles.dataValue, { color: colors.blue[600] }]}>
                  {exportData.companions}
                </Text>
              </View>

              <View style={styles.dataItem}>
                <Ionicons name="list" size={16} color={colors.green[500]} />
                <Text style={[styles.dataLabel, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? 'アクション' : 'Actions'}
                </Text>
                <Text style={[styles.dataValue, { color: colors.green[600] }]}>
                  {exportData.actions}
                </Text>
              </View>

              <View style={[styles.dataItem, styles.photoItem]}>
                <Ionicons name="camera" size={16} color={colors.red[500]} />
                <Text style={[styles.dataLabel, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? '写真（除外）' : 'Photos (Excluded)'}
                </Text>
                <Text style={[styles.dataValue, { color: colors.red[600] }]}>
                  {exportData.totalPhotos}
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: theme.colors.text.tertiary }]}
                onPress={handleClose}
              >
                <Text style={[styles.buttonText, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? 'キャンセル' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.exportButton]}
                onPress={handleExport}
              >
                <LinearGradient
                  colors={['#4ecdc4', '#45b7b8']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonTextWhite}>
                    {language === 'ja' ? 'エクスポート' : 'Export'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'exporting':
        return (
          <>
            <View style={styles.iconContainer}>
              <ActivityIndicator size="large" color={colors.blue[500]} />
            </View>

            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? 'エクスポート中...' : 'Exporting...'}
            </Text>

            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {language === 'ja' 
                ? 'データをJSONファイルに変換しています'
                : 'Converting data to JSON file'
              }
            </Text>

            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          </>
        );

      case 'success':
        return (
          <>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#4ecdc4', '#45b7b8']}
                style={styles.iconGradient}
              >
                <Ionicons name="checkmark" size={32} color="white" />
              </LinearGradient>
            </View>

            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? 'エクスポート完了！' : 'Export Complete!'}
            </Text>

            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {language === 'ja' 
                ? 'データが正常にエクスポートされました。ファイルを保存して、新しいデバイスでインポートしてください。'
                : 'Data has been successfully exported. Save the file and import it on your new device.'
              }
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.exportButton, { width: '100%' }]}
              onPress={handleClose}
            >
              <LinearGradient
                colors={['#4ecdc4', '#45b7b8']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonTextWhite}>
                  {language === 'ja' ? '完了' : 'Done'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        );

      case 'error':
        return (
          <>
            <View style={styles.iconContainer}>
              <View style={[styles.iconGradient, { backgroundColor: colors.red[500] }]}>
                <Ionicons name="close" size={32} color="white" />
              </View>
            </View>

            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? 'エクスポート失敗' : 'Export Failed'}
            </Text>

            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {errorMessage || (language === 'ja' ? 'エクスポート中にエラーが発生しました' : 'An error occurred during export')}
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.exportButton, { width: '100%' }]}
              onPress={handleClose}
            >
              <LinearGradient
                colors={[colors.red[500], colors.red[600]]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonTextWhite}>
                  {language === 'ja' ? '閉じる' : 'Close'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <BlurView
        style={styles.overlay}
        intensity={20}
        tint={isDark ? 'dark' : 'light'}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={step === 'exporting' ? undefined : handleClose}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modal}>
                {renderContent()}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modal: {
    padding: 24,
    alignItems: 'center',
    maxWidth: width - 40,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    width: '100%',
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  dataPreview: {
    width: '100%',
    marginBottom: 24,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  photoItem: {
    opacity: 0.6,
  },
  dataLabel: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  exportButton: {
    // No additional styles needed, gradient handles the styling
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.blue[500],
    borderRadius: 2,
  },
});