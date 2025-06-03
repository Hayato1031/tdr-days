import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
}


export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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

  const handleLineSupport = async () => {
    const lineUrl = 'https://lin.ee/zYjJIxf';
    try {
      const supported = await Linking.canOpenURL(lineUrl);
      if (supported) {
        await Linking.openURL(lineUrl);
      } else {
        Alert.alert(
          language === 'ja' ? 'LINEが見つかりません' : 'LINE Not Found',
          language === 'ja' 
            ? 'LINEアプリがインストールされていないか、このURLを開けません。\n\nサポートURL: https://lin.ee/zYjJIxf'
            : 'LINE app is not installed or cannot open this URL.\n\nSupport URL: https://lin.ee/zYjJIxf',
          [
            { text: language === 'ja' ? 'キャンセル' : 'Cancel', style: 'cancel' },
            {
              text: language === 'ja' ? 'URLをコピー' : 'Copy URL',
              onPress: () => {
                Alert.alert('URL', 'https://lin.ee/zYjJIxf');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening LINE URL:', error);
      Alert.alert(
        language === 'ja' ? 'エラー' : 'Error',
        language === 'ja' ? 'LINEを開くことができませんでした。' : 'Could not open LINE.'
      );
    }
  };


  const faqItems = language === 'ja' ? [
    {
      question: 'データはどこに保存されますか？',
      answer: 'すべてのデータはお使いのデバイスに安全に保存されます。外部サーバーには送信されません。',
    },
    {
      question: '写真が表示されません',
      answer: 'アプリに写真ライブラリへのアクセス許可を与えているか確認してください。設定 > プライバシー > 写真から確認できます。',
    },
    {
      question: 'データのバックアップは可能ですか？',
      answer: '現在、手動でのデータバックアップ機能は開発中です。データが消失しないよう、アプリを削除しないでください。',
    },
    {
      question: 'アプリが正常に動作しません',
      answer: 'アプリを完全に終了して再起動してみてください。問題が続く場合はサポートまでご連絡ください。',
    },
  ] : [
    {
      question: 'Where is my data stored?',
      answer: 'All data is securely stored on your device. No data is sent to external servers.',
    },
    {
      question: 'Photos are not displaying',
      answer: 'Please check if you have granted photo library access permission to the app. You can check this in Settings > Privacy > Photos.',
    },
    {
      question: 'Is data backup possible?',
      answer: 'Manual data backup functionality is currently under development. Please do not delete the app to prevent data loss.',
    },
    {
      question: 'The app is not working properly',
      answer: 'Please try completely closing and restarting the app. If the problem persists, please contact support.',
    },
  ];

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
                {language === 'ja' ? 'ヘルプ・サポート' : 'Help & Support'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* FAQ */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? 'よくある質問' : 'Frequently Asked Questions'}
                </Text>
                {faqItems.map((faq, index) => (
                  <View
                    key={index}
                    style={[
                      styles.faqItem,
                      { backgroundColor: theme.colors.background.secondary }
                    ]}
                  >
                    <Text style={[styles.faqQuestion, { color: theme.colors.text.primary }]}>
                      Q. {faq.question}
                    </Text>
                    <Text style={[styles.faqAnswer, { color: theme.colors.text.secondary }]}>
                      A. {faq.answer}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Contact Support */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? 'お困りの場合' : 'Need Help?'}
                </Text>
                <TouchableOpacity
                  style={[styles.supportButton, { backgroundColor: colors.green[500] }]}
                  onPress={handleLineSupport}
                  activeOpacity={0.8}
                >
                  <View style={styles.supportButtonContent}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="white" />
                    <View style={styles.supportButtonText}>
                      <Text style={styles.supportButtonTitle}>
                        {language === 'ja' ? 'LINEでサポートに連絡' : 'Contact Support via LINE'}
                      </Text>
                      <Text style={styles.supportButtonSubtitle}>
                        {language === 'ja' ? '問題の解決をお手伝いします' : 'We will help you solve the problem'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="white" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* App Info */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? 'アプリ情報' : 'App Information'}
                </Text>
                <View style={[styles.appInfo, { backgroundColor: theme.colors.background.secondary }]}>
                  <View style={styles.appInfoRow}>
                    <Text style={[styles.appInfoLabel, { color: theme.colors.text.secondary }]}>
                      アプリ名
                    </Text>
                    <Text style={[styles.appInfoValue, { color: theme.colors.text.primary }]}>
                      TDR Days
                    </Text>
                  </View>
                  <View style={styles.appInfoRow}>
                    <Text style={[styles.appInfoLabel, { color: theme.colors.text.secondary }]}>
                      バージョン
                    </Text>
                    <Text style={[styles.appInfoValue, { color: theme.colors.text.primary }]}>
                      1.0.0
                    </Text>
                  </View>
                  <View style={styles.appInfoRow}>
                    <Text style={[styles.appInfoLabel, { color: theme.colors.text.secondary }]}>
                      開発者
                    </Text>
                    <Text style={[styles.appInfoValue, { color: theme.colors.text.primary }]}>
                      TDR Days Team
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bottom spacing */}
              <View style={{ height: 40 }} />
            </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  content: {
    borderRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  faqItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 18,
  },
  supportButton: {
    borderRadius: 16,
    padding: 16,
  },
  supportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportButtonText: {
    flex: 1,
    marginLeft: 16,
  },
  supportButtonTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  supportButtonSubtitle: {
    color: 'white',
    fontSize: 13,
    opacity: 0.8,
  },
  appInfo: {
    borderRadius: 12,
    padding: 16,
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appInfoLabel: {
    fontSize: 14,
  },
  appInfoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});