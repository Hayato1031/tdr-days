import React, { useState, useRef, useEffect } from 'react';
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
import { dataMigrationService, ImportResult } from '../services/dataMigrationService';

const { width, height } = Dimensions.get('window');

interface DataImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  visible,
  onClose,
  onImportComplete,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme.mode === 'dark';
  
  const [step, setStep] = useState<'warning' | 'importing' | 'success' | 'error'>('warning');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset state
      setStep('warning');
      setImportResult(null);
      
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

  const handleImport = async () => {
    setStep('importing');
    
    // Animate progress
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    try {
      const result = await dataMigrationService.importData();
      setImportResult(result);
      
      if (result.success) {
        setStep('success');
        // Notify parent component to refresh data
        onImportComplete();
      } else {
        setStep('error');
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Import failed'
      });
      setStep('error');
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
      case 'warning':
        return (
          <>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#ff6b6b', '#ee5a52']}
                style={styles.iconGradient}
              >
                <Ionicons name="warning" size={32} color="white" />
              </LinearGradient>
            </View>

            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? 'データをインポート' : 'Import Data'}
            </Text>

            <View style={[styles.warningBox, { 
              backgroundColor: isDark ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.1)',
              borderColor: '#ff3b30',
            }]}>
              <Ionicons name="alert-circle" size={20} color="#ff3b30" />
              <Text style={[styles.warningText, { color: theme.colors.text.primary }]}>
                {language === 'ja' 
                  ? '重要: 現在のデータは全て削除されます'
                  : 'Important: All current data will be deleted'
                }
              </Text>
            </View>

            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {language === 'ja' 
                ? 'インポートを実行すると、現在保存されているすべての来園記録、同行者、アクションデータが削除され、選択したファイルのデータに置き換わります。\n\nこの操作は取り消すことができません。'
                : 'Importing will delete all currently saved visit records, companions, and action data, replacing them with the data from the selected file.\n\nThis operation cannot be undone.'
              }
            </Text>

            <View style={styles.noteBox}>
              <Ionicons name="information-circle" size={16} color={colors.blue[500]} />
              <Text style={[styles.noteText, { color: theme.colors.text.secondary }]}>
                {language === 'ja' 
                  ? '写真データは復元されません'
                  : 'Photo data will not be restored'
                }
              </Text>
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
                style={[styles.button, styles.importButton]}
                onPress={handleImport}
              >
                <LinearGradient
                  colors={['#ff6b6b', '#ee5a52']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonTextWhite}>
                    {language === 'ja' ? 'インポート' : 'Import'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'importing':
        return (
          <>
            <View style={styles.iconContainer}>
              <ActivityIndicator size="large" color={colors.purple[500]} />
            </View>

            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? 'インポート中...' : 'Importing...'}
            </Text>

            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {language === 'ja' 
                ? 'データを読み込んでいます。しばらくお待ちください。'
                : 'Loading data. Please wait a moment.'
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
              {language === 'ja' ? 'インポート完了！' : 'Import Complete!'}
            </Text>

            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {language === 'ja' 
                ? 'データが正常にインポートされました。'
                : 'Data has been successfully imported.'
              }
            </Text>

            {importResult?.importedData && (
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Ionicons name="calendar" size={16} color={colors.purple[500]} />
                  <Text style={[styles.summaryLabel, { color: theme.colors.text.primary }]}>
                    {language === 'ja' ? '来園記録' : 'Visits'}
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.purple[600] }]}>
                    {importResult.importedData.visits}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Ionicons name="people" size={16} color={colors.blue[500]} />
                  <Text style={[styles.summaryLabel, { color: theme.colors.text.primary }]}>
                    {language === 'ja' ? '同行者' : 'Companions'}
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.blue[600] }]}>
                    {importResult.importedData.companions}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Ionicons name="list" size={16} color={colors.green[500]} />
                  <Text style={[styles.summaryLabel, { color: theme.colors.text.primary }]}>
                    {language === 'ja' ? 'アクション' : 'Actions'}
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.green[600] }]}>
                    {importResult.importedData.actions}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, styles.importButton, { width: '100%' }]}
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
              {language === 'ja' ? 'インポート失敗' : 'Import Failed'}
            </Text>

            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {importResult?.message || (language === 'ja' ? 'インポート中にエラーが発生しました' : 'An error occurred during import')}
            </Text>

            {importResult?.errors && importResult.errors.length > 0 && (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorTitle, { color: colors.red[600] }]}>
                  {language === 'ja' ? 'エラー詳細:' : 'Error Details:'}
                </Text>
                {importResult.errors.map((error, index) => (
                  <Text key={index} style={[styles.errorText, { color: theme.colors.text.secondary }]}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, styles.importButton, { width: '100%' }]}
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
      onRequestClose={step === 'importing' ? undefined : handleClose}
    >
      <BlurView
        style={styles.overlay}
        intensity={20}
        tint={isDark ? 'dark' : 'light'}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={step === 'importing' ? undefined : handleClose}
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
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 24,
    width: '100%',
  },
  noteText: {
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  summaryContainer: {
    width: '100%',
    marginBottom: 24,
    paddingVertical: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    width: '100%',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
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
  importButton: {
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
    backgroundColor: colors.purple[500],
    borderRadius: 2,
  },
});