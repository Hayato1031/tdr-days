import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Easing,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DraggableFlatList, {
  ScaleDecorator,
  ShadowDecorator,
  OpacityDecorator,
} from 'react-native-draggable-flatlist';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useVisits } from '../hooks/useVisits';
import { useActions } from '../hooks/useActions';
import { useResponsive, useColumns } from '../hooks/useResponsive';
import { colors } from '../styles/colors';
import { Header } from '../components/Header';
import { SwipeableScreen } from '../components/SwipeableScreen';
import { DrawerMenu } from '../components/DrawerMenu';
import { VisitCard } from '../components/VisitCard';
import { ActionModal } from '../components/ActionModal';
import { VisitFilter } from '../components/VisitFilter';
import { GridLayout } from '../components/layouts/GridLayout';
import { ResponsiveContainer, ResponsiveSection } from '../components/layouts/ResponsiveContainer';
import {
  Visit,
  TimelineAction,
  VisitFilter as VisitFilterType,
  CreateInput,
  UpdateInput,
  ParkType,
} from '../types/models';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ExpandedVisit {
  visitId: string;
  isExpanded: boolean;
}

// Floating Magic Card Component
const MagicCard = ({ icon, title, subtitle, value, color, onPress, delay = 0, responsive }: any) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [floatAnim] = useState(new Animated.Value(0));
  
  // Calculate responsive dimensions for proper 2x2 grid layout
  const screenWidth = responsive?.dimensions?.width || 375;
  const containerPadding = 32; // 16px on each side
  const cardSpacing = 12; // Gap between cards
  const availableWidth = screenWidth - containerPadding - cardSpacing;
  const cardWidth = (availableWidth / 2) - 4; // Exact half width minus small margin

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [delay]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={[styles.magicCard, { 
          width: '100%',
          height: 120,
          marginHorizontal: 0,
          marginBottom: 0,
        }]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[`${color}15`, `${color}08`, `${color}15`]}
          style={[styles.magicCardGradient, { width: '100%', height: '100%' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <BlurView intensity={25} style={styles.magicCardBlur}>
            <View style={[styles.magicCardIcon, { backgroundColor: `${color}15` }]}>
              {icon}
            </View>
            <Text style={[styles.magicCardValue, { color }]} numberOfLines={1}>{value}</Text>
            <Text style={styles.magicCardTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.magicCardSubtitle} numberOfLines={1}>{subtitle}</Text>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};



export const HomeScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const isDark = theme?.mode === 'dark';
  const [menuVisible, setMenuVisible] = useState(false);
  const responsive = useResponsive();
  const { 
    dimensions, 
    breakpoint, 
    rSpacing, 
    rFontSize,
    isBreakpoint,
    layoutConfig,
    gridConfig,
    responsive: responsiveValue 
  } = responsive || {};
  
  // Safe fallback values
  const safeRSpacing = (value: number) => rSpacing ? rSpacing(value) : value;
  const safeRFontSize = (value: number) => rFontSize ? rFontSize(value) : value;

  // Hooks
  const {
    visits = [],
    companions = [],
    isLoading: visitsLoading = false,
    error: visitsError,
    refreshData: refreshVisits,
  } = useVisits() || {};
  
  const {
    actions = [],
    isLoading: actionsLoading = false,
    error: actionsError,
    getActionsByVisit,
    createAction,
    updateAction,
    deleteAction,
    reorderActions,
    refreshData: refreshActions,
  } = useActions() || {};
  
  // State
  const [headerAnimation] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const [floatingAnimation] = useState(new Animated.Value(0));

  // Animation effects
  useEffect(() => {
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
      useNativeDriver: true,
    }).start();

    // Floating elements animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnimation, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnimation, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Get visit stats
  const getVisitStats = useMemo(() => {
    const totalVisits = visits.length;
    const landVisits = visits.filter(v => v.parkType === ParkType.LAND).length;
    const seaVisits = visits.filter(v => v.parkType === ParkType.SEA).length;
    const totalActions = visits.reduce((sum, visit) => sum + (visit.actionCount || 0), 0);
    const recentVisits = visits.filter(v => {
      // 日本時間での30日前の日付を計算
      const now = new Date();
      const jstOffset = 9 * 60; // JST is UTC+9
      const nowJST = new Date(now.getTime() + (jstOffset * 60 * 1000));
      const thirtyDaysAgoJST = new Date(nowJST);
      thirtyDaysAgoJST.setDate(thirtyDaysAgoJST.getDate() - 30);
      
      const visitDate = new Date(v.date);
      const visitDateJST = new Date(visitDate.getTime() + (jstOffset * 60 * 1000));
      
      return visitDateJST >= thirtyDaysAgoJST;
    }).length;
    
    return { totalVisits, landVisits, seaVisits, totalActions, recentVisits };
  }, [visits]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshVisits(), refreshActions()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshVisits, refreshActions]);

  return (
    <SwipeableScreen onSwipeFromLeft={() => setMenuVisible(true)}>
      <ResponsiveContainer
        scroll={false}
        padding={false}
        style={[styles.container, { backgroundColor: theme?.colors?.background?.primary || '#fff' }]}
      >
        <Header 
          title={t('nav.home')} 
          onMenuOpen={() => setMenuVisible(true)}
        />
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.purple[500]}
            colors={[colors.purple[500]]}
          />
        }
      >
        {/* Enhanced Hero Section with Floating Elements */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: headerAnimation,
              transform: [
                {
                  translateY: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Magical Background with Floating Elements */}
          <LinearGradient
            colors={[
              'rgba(167, 139, 250, 0.03)',
              'rgba(196, 181, 253, 0.02)',
              'rgba(255, 255, 255, 1)',
            ]}
            style={styles.heroGradient}
          >
            {/* Floating Magic Elements */}
            <View style={styles.floatingElementsContainer}>
              <Animated.View style={[
                styles.floatingElement, 
                { 
                  top: 20, 
                  left: 30, 
                  transform: [
                    { rotate: '15deg' },
                    {
                      translateY: floatingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      })
                    }
                  ] 
                }
              ]}>
                <Ionicons name="sparkles" size={16} color={colors.purple[300]} />
              </Animated.View>
              <Animated.View style={[
                styles.floatingElement, 
                { 
                  top: 40, 
                  right: 50, 
                  transform: [
                    { rotate: '-20deg' },
                    {
                      translateY: floatingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 8],
                      })
                    }
                  ] 
                }
              ]}>
                <Ionicons name="star" size={14} color={colors.pink[300]} />
              </Animated.View>
              <Animated.View style={[
                styles.floatingElement, 
                { 
                  top: 80, 
                  left: 80, 
                  transform: [
                    { rotate: '25deg' },
                    {
                      translateY: floatingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -6],
                      })
                    }
                  ] 
                }
              ]}>
                <FontAwesome5 name="magic" size={12} color={colors.blue[300]} />
              </Animated.View>
              <Animated.View style={[
                styles.floatingElement, 
                { 
                  top: 60, 
                  right: 30, 
                  transform: [
                    { rotate: '-15deg' },
                    {
                      translateY: floatingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 12],
                      })
                    }
                  ] 
                }
              ]}>
                <Ionicons name="heart" size={12} color={colors.red[300]} />
              </Animated.View>
            </View>

            <View style={styles.heroContainer}>
              {/* Welcome Text with Enhanced Typography */}
              <View style={styles.welcomeContainer}>
                <Text style={[styles.welcomeText, { color: theme?.colors?.text?.secondary || '#666' }]}>
                  {t('home.welcome')}
                </Text>
                <Text style={[styles.appTitle, { color: theme?.colors?.text?.primary || '#000' }]}>
                  {t('home.appTitle')}
                  <Text style={[styles.appTitleAccent, { color: colors.purple[500] }]}> ✨</Text>
                </Text>
                <Text style={[styles.tagline, { color: theme?.colors?.text?.secondary || '#666' }]}>
                  {t('home.tagline')}
                </Text>
              </View>

              {/* Enhanced Stats Cards with Animations - 2x2 Grid */}
              <View style={[styles.statsCardsGrid, {
                paddingHorizontal: 16,
              }]}>
                <View style={styles.statsCardContainer}>
                  <MagicCard
                    icon={<Ionicons name="calendar" size={22} color={colors.purple.bright} />}
                    title={t('home.totalVisits')}
                    subtitle={t('home.allTime')}
                    value={getVisitStats.totalVisits}
                    color={colors.purple.bright}
                    delay={100}
                    responsive={responsive}
                  />
                </View>
                
                <View style={styles.statsCardContainer}>
                  <MagicCard
                    icon={<Ionicons name="flash" size={22} color={colors.blue[500]} />}
                    title={t('home.activities')}
                    subtitle={t('home.logged')}
                    value={getVisitStats.totalActions}
                    color={colors.blue[500]}
                    delay={200}
                    responsive={responsive}
                  />
                </View>
                
                <View style={styles.statsCardContainer}>
                  <MagicCard
                    icon={<FontAwesome5 name="fort-awesome" size={20} color={colors.pink[500]} />}
                    title={t('home.disneylandShort')}
                    subtitle=""
                    value={`${getVisitStats.landVisits}${t('home.visits')}`}
                    color={colors.pink[500]}
                    delay={300}
                    responsive={responsive}
                  />
                </View>
                
                <View style={styles.statsCardContainer}>
                  <MagicCard
                    icon={<FontAwesome5 name="globe" size={20} color={colors.teal[500]} />}
                    title={t('home.disneyseaShort')}
                    subtitle=""
                    value={`${getVisitStats.seaVisits}${t('home.visits')}`}
                    color={colors.teal[500]}
                    delay={400}
                    responsive={responsive}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>




        {/* Fun Stats Section */}
        <View style={styles.funStatsSection}>
          <Text style={[styles.sectionTitle, { color: theme?.colors?.text?.primary || '#000' }]}>
            {language === 'ja' ? '魔法の記録 📊' : 'Magic Records 📊'}
          </Text>
          
          <View style={styles.funStatsGrid}>
            <View style={styles.funStatCard}>
              <LinearGradient
                colors={[colors.yellow[100], colors.yellow[50]]}
                style={styles.funStatGradient}
              >
                <Ionicons name="trophy" size={32} color={colors.yellow[600]} />
                <Text style={[styles.funStatValue, { color: colors.yellow[700] }]}>
                  {getVisitStats.recentVisits}
                </Text>
                <Text style={[styles.funStatLabel, { color: colors.yellow[600] }]}>
                  {language === 'ja' ? '今月の来園' : 'This Month'}
                </Text>
              </LinearGradient>
            </View>
            
            <View style={styles.funStatCard}>
              <LinearGradient
                colors={[colors.green[100], colors.green[50]]}
                style={styles.funStatGradient}
              >
                <Ionicons name="list" size={32} color={colors.green[600]} />
                <Text style={[styles.funStatValue, { color: colors.green[700] }]}>
                  {getVisitStats.totalActions}
                </Text>
                <Text style={[styles.funStatLabel, { color: colors.green[600] }]}>
                  {language === 'ja' ? '総アクション数' : 'Total Actions'}
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Recent Activity Section (if any visits exist) */}
        {visits.length > 0 && (
          <View style={styles.recentActivitySection}>
            <Text style={[styles.sectionTitle, { color: theme?.colors?.text?.primary || '#000' }]}>
              {t('home.recentMagic')}
            </Text>
            
            <View style={styles.recentVisitsContainer}>
              {visits
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 3)
                .map((visit, index) => (
                <TouchableOpacity
                  key={visit.id}
                  style={styles.recentVisitCard}
                  activeOpacity={0.8}
                  onPress={() => (navigation as any).navigate('VisitDetail', { visitId: visit.id })}
                >
                  <LinearGradient
                    colors={[
                      visit.parkType === ParkType.LAND ? colors.pink[100] : colors.teal[100],
                      visit.parkType === ParkType.LAND ? colors.pink[50] : colors.teal[50],
                    ]}
                    style={styles.recentVisitGradient}
                  >
                    <View style={styles.recentVisitIcon}>
                      {visit.parkType === ParkType.LAND ? (
                        <FontAwesome5 name="fort-awesome" size={20} color={colors.pink[600]} />
                      ) : (
                        <FontAwesome5 name="globe" size={20} color={colors.teal[600]} />
                      )}
                    </View>
                    <View style={styles.recentVisitInfo}>
                      <Text style={styles.recentVisitDate}>
                        {new Date(visit.date).toLocaleDateString()}
                      </Text>
                      <Text style={styles.recentVisitPark}>
                        {visit.parkType === ParkType.LAND ? t('park.disneyland') : t('park.disneysea')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme?.colors?.text?.secondary || '#999'} />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty State for New Users */}
        {visits.length === 0 && (
          <View style={styles.emptyStateSection}>
            <LinearGradient
              colors={['rgba(167, 139, 250, 0.1)', 'rgba(196, 181, 253, 0.05)']}
              style={styles.emptyStateGradient}
            >
              <BlurView intensity={20} style={styles.emptyStateBlur}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons name="sparkles" size={64} color={colors.purple[300]} />
                </View>
                <Text style={[styles.emptyStateTitle, { color: theme?.colors?.text?.primary || '#000' }]}>
                  {t('home.startJourney')}
                </Text>
                <Text style={[styles.emptyStateMessage, { color: theme?.colors?.text?.secondary || '#666' }]}>
                  {t('home.firstVisitMessage')}
                </Text>
                <TouchableOpacity 
                  style={styles.emptyStateCTA}
                  onPress={() => {
                    // Record画面に遷移して今日の日付を設定
                    const today = new Date();
                    (navigation as any).navigate('Record', {
                      initialDate: today.toISOString().split('T')[0]
                    });
                  }}
                >
                  <LinearGradient
                    colors={[colors.purple[600], colors.purple[500]]}
                    style={styles.emptyStateCTAGradient}
                  >
                    <Ionicons name="add" size={24} color={colors.utility.white} />
                    <Text style={styles.emptyStateCTAText}>{t('home.recordFirstVisit')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            </LinearGradient>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>
      </ResponsiveContainer>
      
      <DrawerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </SwipeableScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingTop: 20,
    marginBottom: 32,
  },
  heroGradient: {
    flex: 1,
    position: 'relative',
  },
  floatingElementsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: 'absolute',
    opacity: 0.6,
  },
  heroContainer: {
    minHeight: 280,
    paddingHorizontal: 16,
    paddingVertical: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  appTitleAccent: {
    fontSize: 28,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingVertical: 4,
  },
  statsCardContainer: {
    width: '48%',
    marginBottom: 10,
    minHeight: 120,
  },
  statsCard: {
    flex: 1,
    minWidth: 150,
    maxWidth: 200,
    aspectRatio: 1.1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.utility.borderLight,
    marginHorizontal: 4,
  },
  statsCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statsCardValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  statsCardSubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  recentActivitySection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  recentVisitsContainer: {
    gap: 12,
  },
  recentVisitCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  recentVisitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  recentVisitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 16,
  },
  recentVisitInfo: {
    flex: 1,
  },
  recentVisitDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 2,
  },
  recentVisitPark: {
    fontSize: 14,
    color: colors.gray[600],
  },
  emptyStateSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  emptyStateGradient: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  emptyStateBlur: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateCTA: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyStateCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 8,
  },
  emptyStateCTAText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.utility.white,
  },
  
  // Magic Card Styles
  magicCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.effects.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 0,
  },
  magicCardGradient: {
    flex: 1,
  },
  magicCardBlur: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  magicCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  magicCardValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'center',
    lineHeight: 26,
  },
  magicCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
    color: colors.text.primary,
    lineHeight: 14,
  },
  magicCardSubtitle: {
    fontSize: 10,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 12,
  },
  
  // Fun Stats Styles
  funStatsSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  funStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 12,
  },
  funStatCard: {
    flex: 1,
    minWidth: 120,
    maxWidth: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  funStatGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  funStatValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  funStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});