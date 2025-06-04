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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { APP_CONFIG, getCopyrightString } from '../constants/app';

interface AboutAppModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutAppModal: React.FC<AboutAppModalProps> = ({
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

  const handleLineContact = async () => {
    const lineUrl = 'https://lin.ee/zYjJIxf';
    try {
      const supported = await Linking.canOpenURL(lineUrl);
      if (supported) {
        await Linking.openURL(lineUrl);
      } else {
        Alert.alert(
          language === 'ja' ? 'LINEが見つかりません' : 'LINE Not Found',
          language === 'ja' 
            ? 'LINEアプリがインストールされていないか、このURLを開けません。\n\nURL: https://lin.ee/zYjJIxf'
            : 'LINE app is not installed or cannot open this URL.\n\nURL: https://lin.ee/zYjJIxf'
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
                {language === 'ja' ? 'アプリについて' : 'About App'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* App Logo & Info */}
              <View style={styles.section}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoIcon}>
                    <Image 
                      source={require('../../assets/icon.png')} 
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={[styles.appName, { color: theme.colors.text.primary }]}>
                    {APP_CONFIG.NAME}
                  </Text>
                  <Text style={[styles.appTagline, { color: theme.colors.text.secondary }]}>
                    {language === 'ja' ? '東京ディズニーリゾート来園記録アプリ' : 'Tokyo Disney Resort Visit Recorder'}
                  </Text>
                </View>
              </View>

              {/* App Description */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? 'アプリの概要' : 'App Overview'}
                </Text>
                <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' 
                    ? 'TDR Daysは、東京ディズニーランド・ディズニーシーへの来園記録を美しく記録できるアプリです。アトラクション、レストラン、ショー、グリーティングなどの体験を写真と共に記録し、統計やグラフで来園データを分析できます。'
                    : 'TDR Days is an app that beautifully records your visits to Tokyo Disneyland and Disney Sea. Record attractions, restaurants, shows, character greetings and other experiences with photos, and analyze your visit data with statistics and charts.'
                  }
                </Text>
              </View>

              {/* Features */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? '主な機能' : 'Key Features'}
                </Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="calendar" size={20} color={colors.purple.bright} />
                    <Text style={[styles.featureText, { color: theme.colors.text.secondary }]}>
                      {language === 'ja' ? '来園記録の作成・管理' : 'Create & manage visit records'}
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="location" size={20} color={colors.blue[500]} />
                    <Text style={[styles.featureText, { color: theme.colors.text.secondary }]}>
                      {language === 'ja' ? 'アトラクション・レストラン記録' : 'Track attractions & restaurants'}
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="camera" size={20} color={colors.green[500]} />
                    <Text style={[styles.featureText, { color: theme.colors.text.secondary }]}>
                      {language === 'ja' ? '写真付きタイムライン' : 'Photo timeline'}
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="stats-chart" size={20} color={colors.orange[500]} />
                    <Text style={[styles.featureText, { color: theme.colors.text.secondary }]}>
                      {language === 'ja' ? '統計・分析機能' : 'Statistics & analytics'}
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="people" size={20} color={colors.pink[500]} />
                    <Text style={[styles.featureText, { color: theme.colors.text.secondary }]}>
                      {language === 'ja' ? '同行者管理' : 'Companion management'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* App Details */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? 'アプリ情報' : 'App Information'}
                </Text>
                <View style={[styles.detailsCard, { backgroundColor: theme.colors.background.secondary }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                      {language === 'ja' ? 'アプリ名' : 'App Name'}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                      {APP_CONFIG.NAME}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                      {language === 'ja' ? 'バージョン' : 'Version'}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                      {APP_CONFIG.VERSION}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                      {language === 'ja' ? '開発者' : 'Developer'}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                      {APP_CONFIG.TEAM_NAME}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                      {language === 'ja' ? 'プライバシー' : 'Privacy'}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                      {language === 'ja' ? 'ローカル保存のみ' : 'Local storage only'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Contact */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? 'お問い合わせ' : 'Contact'}
                </Text>
                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: colors.green[500] }]}
                  onPress={handleLineContact}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                  <Text style={styles.contactButtonText}>
                    {language === 'ja' ? 'LINEでお問い合わせ' : 'Contact via LINE'}
                  </Text>
                  <Ionicons name="open-outline" size={16} color="white" />
                </TouchableOpacity>
              </View>

              {/* Copyright */}
              <View style={styles.section}>
                <Text style={[styles.copyright, { color: theme.colors.text.disabled }]}>
                  {getCopyrightString()}
                </Text>
                <Text style={[styles.copyright, { color: theme.colors.text.disabled }]}>
                  Made with ❤️ for Disney fans
                </Text>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  detailsCard: {
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  copyright: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
});