import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
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
                {language === 'ja' ? '利用規約' : 'Terms of Service'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
              {/* Effective Date */}
              <View style={styles.section}>
                <Text style={[styles.effectiveDate, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' ? '最終更新日：2025年6月3日' : 'Last updated: June 3, 2025'}
                </Text>
              </View>

              {/* Introduction */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? 'はじめに' : 'Introduction'}
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' 
                    ? '本利用規約（以下「本規約」）は、TDR Days Team（以下「当チーム」）が提供する「TDR Days」アプリケーション（以下「本アプリ」）の利用条件を定めるものです。本アプリをご利用になる前に、必ず本規約をお読みください。'
                    : 'These Terms of Service ("Terms") define the conditions for using the "TDR Days" application ("App") provided by TDR Days Team ("Team"). Please read these Terms carefully before using the App.'
                  }
                </Text>
              </View>

              {/* Important Notice */}
              <View style={styles.section}>
                <View style={[styles.importantNotice, { backgroundColor: colors.orange[500] + '20', borderColor: colors.orange[500] }]}>
                  <View style={styles.noticeHeader}>
                    <Ionicons name="warning" size={20} color={colors.orange[500]} />
                    <Text style={[styles.noticeTitle, { color: colors.orange[500] }]}>
                      {language === 'ja' ? '重要なお知らせ' : 'Important Notice'}
                    </Text>
                  </View>
                  <Text style={[styles.noticeText, { color: theme.colors.text.primary }]}>
                    {language === 'ja' 
                      ? '本アプリ「TDR Days」は、株式会社オリエンタルランドまたはウォルト・ディズニー・カンパニーの公式アプリケーションではありません。当アプリは個人開発者によって作成された非公式のファンアプリです。'
                      : 'The "TDR Days" app is not an official application of Oriental Land Co., Ltd. or The Walt Disney Company. This app is an unofficial fan app created by individual developers.'
                    }
                  </Text>
                  <Text style={[styles.noticeText, { color: theme.colors.text.primary }]}>
                    {language === 'ja' 
                      ? '東京ディズニーリゾート、ディズニーランド、ディズニーシーは株式会社オリエンタルランドの商標または登録商標です。'
                      : 'Tokyo Disney Resort, Disneyland, and Disney Sea are trademarks or registered trademarks of Oriental Land Co., Ltd.'
                    }
                  </Text>
                </View>
              </View>

              {/* Article 1 */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? '第1条（適用）' : 'Article 1 (Application)'}
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  1. 本規約は、ユーザーと当チームとの間の本アプリの利用に関わる一切の関係に適用されるものとします。
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  2. 本アプリをダウンロード、インストール、または使用することにより、ユーザーは本規約に同意したものとみなします。
                </Text>
              </View>

              {/* Article 2 */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  第2条（利用登録）
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  1. 本アプリは利用登録を必要とせず、ダウンロード後すぐにご利用いただけます。
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  2. すべてのデータはユーザーのデバイス内にローカル保存され、外部サーバーには送信されません。
                </Text>
              </View>

              {/* Article 3 */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  第3条（禁止事項）
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  ユーザーは、本アプリの利用にあたり、以下の行為をしてはなりません：
                </Text>
                <Text style={[styles.listItem, { color: theme.colors.text.secondary }]}>
                  • 法令または公序良俗に違反する行為
                </Text>
                <Text style={[styles.listItem, { color: theme.colors.text.secondary }]}>
                  • 犯罪行為に関連する行為
                </Text>
                <Text style={[styles.listItem, { color: theme.colors.text.secondary }]}>
                  • 当チームのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
                </Text>
                <Text style={[styles.listItem, { color: theme.colors.text.secondary }]}>
                  • 本アプリを逆アセンブル、逆コンパイル、リバースエンジニアリングする行為
                </Text>
                <Text style={[styles.listItem, { color: theme.colors.text.secondary }]}>
                  • その他、当チームが不適切と判断する行為
                </Text>
              </View>

              {/* Article 4 */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  第4条（個人情報・プライバシー）
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  1. 本アプリは個人情報を収集いたしません。
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  2. ユーザーが入力したすべてのデータ（来園記録、写真、メモなど）は、ユーザーのデバイス内にのみ保存されます。
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  3. 当チームはユーザーのデータにアクセスすることはできません。
                </Text>
              </View>

              {/* Article 5 */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  第5条（利用制限・停止）
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  1. 当チームは、ユーザーが本規約に違反した場合、事前の通知なくして本アプリの利用を制限することができるものとします。
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  2. 当チームは、本条に基づき当チームが行った行為によりユーザーに生じた損害について、一切の責任を負いません。
                </Text>
              </View>

              {/* Article 6 */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  第6条（保証の否認・免責事項）
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  1. 当チームは、本アプリに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  2. 当チームは、本アプリに起因してユーザーに生じたあらゆる損害について、一切の責任を負いません。
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  3. ユーザーは自己の責任において本アプリを利用するものとし、データのバックアップ等は各自で行うものとします。
                </Text>
              </View>

              {/* Article 7 */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  第7条（アプリの変更・終了）
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  1. 当チームは、ユーザーに事前に通知することなく、本アプリの内容を変更し、または本アプリの提供を中止することができるものとします。
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  2. 当チームは、これらによってユーザーに生じた損害について一切の責任を負いません。
                </Text>
              </View>

              {/* Article 8 */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  第8条（利用規約の変更）
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  1. 当チームは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  2. 本規約の変更後、本アプリの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
                </Text>
              </View>

              {/* Article 9 */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  第9条（準拠法・管轄裁判所）
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  1. 本規約の解釈にあたっては、日本法を準拠法とします。
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  2. 本アプリに関して紛争が生じた場合には、当チームの所在地を管轄する裁判所を専属的管轄裁判所とします。
                </Text>
              </View>

              {/* Contact */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? 'お問い合わせ' : 'Contact'}
                </Text>
                <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
                  {language === 'ja' 
                    ? '本規約に関するご質問やお問い合わせは、アプリ内のサポート機能からLINEにてご連絡ください。'
                    : 'For questions or inquiries regarding these Terms, please contact us via LINE through the support function in the app.'
                  }
                </Text>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.text.disabled }]}>
                  TDR Days Team
                </Text>
                <Text style={[styles.footerText, { color: theme.colors.text.disabled }]}>
                  © 2025 All rights reserved.
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
    maxWidth: 600,
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
  scrollView: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  effectiveDate: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  importantNotice: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});