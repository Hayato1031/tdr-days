import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { Header } from '../components/Header';
import { SwipeableScreen } from '../components/SwipeableScreen';
import { DrawerMenu } from '../components/DrawerMenu';
// Removed unused imports - now using responsive utilities directly
import { CalendarPicker } from '../components/CalendarPicker';
import { ParkSelector } from '../components/ParkSelector';
import { CompanionManager } from '../components/CompanionManager';
import { ResponsiveContainer, ResponsiveSection } from '../components/layouts/ResponsiveContainer';
import { SuccessModal } from '../components/SuccessModal';
import { useVisits } from '../hooks/useVisits';
import { useResponsive } from '../hooks/useResponsive';
import { ParkType, CreateInput, Visit } from '../types/models';

type WeatherType = 'SUNNY' | 'CLOUDY' | 'RAINY' | 'SNOWY';

const getWeatherOptions = (t: any): Array<{
  type: WeatherType;
  label: string;
  icon: string;
  color: string;
}> => [
  { type: 'SUNNY', label: t('record.sunny'), icon: 'sunny', color: '#ffd60a' },
  { type: 'CLOUDY', label: t('record.cloudy'), icon: 'cloudy', color: '#8d99ae' },
  { type: 'RAINY', label: t('record.rainy'), icon: 'rainy', color: '#457b9d' },
  { type: 'SNOWY', label: t('record.snowy'), icon: 'snow', color: '#64b5f6' },
];

interface RecordScreenParams {
  parkType?: ParkType;
  date?: string;
  visitId?: string;
}

export const RecordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RecordScreenParams;
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const isDark = theme.mode === 'dark';
  const { 
    dimensions, 
    breakpoint, 
    rSpacing, 
    rFontSize,
    isBreakpoint,
    layoutConfig 
  } = useResponsive();
  
  // Add safe fallback values
  const safeRSpacing = (value: number) => rSpacing ? rSpacing(value) : value;
  const safeRFontSize = (value: number) => rFontSize ? rFontSize(value) : value;
  
  // Responsive states
  const isTabletOrLarger = isBreakpoint('tablet');
  const isLaptopOrLarger = isBreakpoint('laptop');
  
  // Hooks
  const {
    companions,
    createVisit,
    updateVisit,
    getVisit,
    createCompanion,
    deleteCompanion,
    isLoading,
  } = useVisits();

  // Form state
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    console.log('RecordScreen params:', params);
    // Check for initialDate parameter as well as date
    return params?.date || (params as any)?.initialDate || '';
  });
  const [selectedPark, setSelectedPark] = useState<ParkType | undefined>(() => {
    console.log('RecordScreen parkType param:', params?.parkType);
    return params?.parkType;
  });
  const [selectedCompanionIds, setSelectedCompanionIds] = useState<string[]>([]);
  const [selectedWeather, setSelectedWeather] = useState<WeatherType | undefined>();
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedVisitId, setSavedVisitId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const advancedAnimValue = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const companionTitleRef = useRef<View>(null);

  // Handle params changes (in case user navigates to this screen multiple times with different params)
  useEffect(() => {
    if (params?.date && params.date !== selectedDate) {
      console.log('Updating selectedDate from params:', params.date);
      setSelectedDate(params.date);
    }
    if (params?.parkType && params.parkType !== selectedPark) {
      console.log('Updating selectedPark from params:', params.parkType);
      setSelectedPark(params.parkType);
    }
  }, [params]);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  // Animation refs
  const saveButtonScale = useRef(new Animated.Value(1)).current;

  // Validation
  const isFormValid = selectedDate && selectedPark;

  const handleCompanionToggle = (companionId: string) => {
    setSelectedCompanionIds(prev => 
      prev.includes(companionId)
        ? prev.filter(id => id !== companionId)
        : [...prev, companionId]
    );
  };

  const handleCompanionCreate = async (name: string) => {
    try {
      const newCompanion = await createCompanion({ name });
      setSelectedCompanionIds(prev => [...prev, newCompanion.id]);
    } catch (error) {
      throw error;
    }
  };

  const handleCompanionDelete = async (companionId: string) => {
    try {
      await deleteCompanion(companionId);
      setSelectedCompanionIds(prev => prev.filter(id => id !== companionId));
    } catch (error) {
      throw error;
    }
  };

  const handleWeatherSelect = (weather: WeatherType) => {
    setSelectedWeather(prev => prev === weather ? undefined : weather);
  };

  // Load visit data for editing
  useEffect(() => {
    const loadEditingVisit = async () => {
      if (params?.visitId) {
        try {
          const visit = await getVisit(params.visitId);
          if (visit) {
            setEditingVisit(visit);
            setSelectedDate(new Date(visit.date).toISOString().split('T')[0]);
            setSelectedPark(visit.parkType);
            setSelectedCompanionIds(visit.companionIds);
            setSelectedWeather(visit.weather);
            setNotes(visit.notes || '');
          }
        } catch (error) {
          Alert.alert(
            t('record.error'), 
            t('record.errorMessage')
          );
          navigation.goBack();
        }
      }
    };

    loadEditingVisit();
  }, [params?.visitId]);

  const handleSave = async () => {
    if (!isFormValid) {
      Alert.alert(t('record.incompleteForm'), t('record.selectDateAndPark'));
      return;
    }

    // Animate save button
    Animated.sequence([
      Animated.timing(saveButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(saveButtonScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();

    setIsSaving(true);
    try {
      const visitData = {
        date: new Date(selectedDate),
        parkType: selectedPark!,
        companionIds: selectedCompanionIds,
        weather: selectedWeather,
        notes: notes.trim() || undefined,
      };

      let resultVisit: Visit;
      
      if (editingVisit) {
        // Update existing visit
        resultVisit = await updateVisit(editingVisit.id, visitData);
      } else {
        // Create new visit
        resultVisit = await createVisit(visitData as CreateInput<Visit>);
      }
      
      // Reset form only for new visits
      if (!editingVisit) {
        setSelectedDate('');
        setSelectedPark(undefined);
        setSelectedCompanionIds([]);
        setSelectedWeather(undefined);
        setNotes('');
      }

      // Show success modal
      setSavedVisitId(resultVisit.id);
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert(t('record.error'), t('record.errorMessage'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    if (savedVisitId) {
      // Navigate to the specific visit detail page
      navigation.navigate('VisitDetail' as never, { visitId: savedVisitId } as never);
    }
  };

  const toggleAdvanced = () => {
    const toValue = showAdvanced ? 0 : 1;
    setShowAdvanced(!showAdvanced);
    
    Animated.timing(advancedAnimValue, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Handle companion add button press - scroll to make form visible
  const handleCompanionAddButtonPress = () => {
    // Delay to ensure the form animation starts
    setTimeout(() => {
      if (scrollViewRef.current && companionTitleRef.current) {
        // Get the layout of the companion title relative to the ScrollView
        companionTitleRef.current.measureLayout(
          scrollViewRef.current.getInnerViewRef(),
          (x, y, width, height) => {
            // Scroll to position the companion title near the top of the visible area
            const headerHeight = 100; // Account for header and some padding
            const targetY = y - headerHeight;
            
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, targetY),
              animated: true,
            });
          },
          () => {
            // Fallback if measureLayout fails
            console.log('measureLayout failed, using alternative scroll method');
          }
        );
      }
    }, 100);
  };

  return (
    <SwipeableScreen onSwipeFromLeft={() => setMenuVisible(true)}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Header 
          title={editingVisit ? t('record.editVisit') : t('nav.record')} 
          showBackButton={editingVisit ? true : false}
          onBackPress={editingVisit ? () => navigation.goBack() : undefined}
          onMenuOpen={() => setMenuVisible(true)}
        />
        
        <ScrollView
          ref={scrollViewRef}
        style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Clean Header Section */}
        <View style={[
          styles.header,
          {
            backgroundColor: colors.background.primary,
            paddingHorizontal: safeRSpacing(20),
            marginBottom: safeRSpacing(24),
          }
        ]}>
          <View style={[
            styles.headerContent,
            {
              backgroundColor: colors.background.card,
              borderRadius: safeRSpacing(20),
              padding: safeRSpacing(24),
              borderWidth: 1,
              borderColor: colors.utility.borderLight,
            }
          ]}>
            <Text style={[
              styles.headerTitle, 
              { 
                color: theme.colors.text.primary,
                fontSize: safeRFontSize(28),
                marginBottom: safeRSpacing(8),
              }
            ]}>
              {t('record.title')}
            </Text>
            <Text style={[
              styles.headerSubtitle, 
              { 
                color: theme.colors.text.secondary,
                fontSize: safeRFontSize(16),
                marginBottom: safeRSpacing(20),
              }
            ]}>
              {t('record.subtitle')}
            </Text>
            
          </View>
        </View>

        <View style={[
          styles.formContainer,
          {
            paddingHorizontal: safeRSpacing(20),
          }
        ]}>
          {/* Calendar Picker */}
          <View style={[styles.section, { marginBottom: safeRSpacing(24) }]}>
            <CalendarPicker
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              minDate={new Date(2020, 0, 1).toISOString().split('T')[0]}
              maxDate={(() => {
                const now = new Date();
                const jstOffset = 9 * 60; // JST is UTC+9
                const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000));
                return jstTime.toISOString().split('T')[0];
              })()}
            />
          </View>

          {/* Park Selector */}
          <View style={[styles.section, { marginBottom: safeRSpacing(24) }]}>
            <ParkSelector
              selectedPark={selectedPark}
              onParkSelect={setSelectedPark}
            />
          </View>

          {/* Companion Manager */}
          <View style={[styles.section, { marginBottom: safeRSpacing(24) }]}>
            <CompanionManager
              companions={companions}
              selectedCompanionIds={selectedCompanionIds}
              onCompanionToggle={handleCompanionToggle}
              onCompanionCreate={handleCompanionCreate}
              onCompanionDelete={handleCompanionDelete}
              isCreating={isLoading}
              titleRef={companionTitleRef}
              onAddButtonPress={handleCompanionAddButtonPress}
            />
          </View>

          {/* Advanced Settings Toggle */}
          <TouchableOpacity 
            style={[
              styles.advancedToggle,
              {
                backgroundColor: isDark
                  ? theme.colors.background.secondary
                  : theme.colors.background.elevated,
                borderRadius: safeRSpacing(12),
                marginBottom: safeRSpacing(16),
              }
            ]}
            onPress={toggleAdvanced}
            activeOpacity={0.7}
          >
            <View style={[styles.advancedToggleContent, { padding: safeRSpacing(16) }]}>
              <View style={styles.advancedToggleLeft}>
                <Ionicons 
                  name="settings-outline" 
                  size={20} 
                  color={colors.purple[500]} 
                  style={{ marginRight: safeRSpacing(12) }}
                />
                <Text style={[
                  styles.advancedToggleText,
                  { 
                    color: theme.colors.text.primary,
                    fontSize: safeRFontSize(16),
                  }
                ]}>
                  {language === 'ja' ? '詳細設定' : 'Advanced Settings'}
                </Text>
              </View>
              <Animated.View
                style={{
                  transform: [{
                    rotate: advancedAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  }],
                }}
              >
                <Ionicons 
                  name="chevron-down" 
                  size={20} 
                  color={theme.colors.text.secondary} 
                />
              </Animated.View>
            </View>
          </TouchableOpacity>

          {/* Advanced Settings Content */}
          <Animated.View
            style={[
              styles.advancedContent,
              {
                height: advancedAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 400], // Adjust based on content height
                }),
                opacity: advancedAnimValue,
                overflow: 'hidden',
              }
            ]}
          >
            {/* Weather Selection */}
            <View style={[styles.section, { marginBottom: safeRSpacing(24) }]}>
              <Text style={[
                styles.sectionTitle, 
                { 
                  color: theme.colors.text.primary,
                  fontSize: safeRFontSize(18),
                  marginBottom: safeRSpacing(12),
                }
              ]}>
                {t('record.weather')}
              </Text>
              <View style={[
                styles.weatherContainer,
                {
                  gap: safeRSpacing(12),
                  flexDirection: isTabletOrLarger ? 'row' : 'row',
                }
              ]}>
                {getWeatherOptions(t).map((weather) => {
                  const isSelected = selectedWeather === weather.type;
                  return (
                    <TouchableOpacity
                      key={weather.type}
                      onPress={() => handleWeatherSelect(weather.type)}
                      style={[
                        styles.weatherButton,
                        {
                          backgroundColor: isDark
                            ? theme.colors.background.secondary
                            : theme.colors.background.elevated,
                          borderColor: isSelected ? weather.color : colors.utility.borderLight,
                          borderRadius: safeRSpacing(12),
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.weatherGradient,
                          {
                            padding: safeRSpacing(12),
                            gap: safeRSpacing(8),
                            backgroundColor: isSelected ? `${weather.color}15` : 'transparent',
                            borderRadius: safeRSpacing(10),
                          }
                        ]}
                      >
                        <Ionicons
                          name={weather.icon as any}
                          size={24}
                          color={isSelected ? weather.color : theme.colors.text.secondary}
                        />
                        <Text
                          style={[
                            styles.weatherLabel,
                            {
                              color: isSelected
                                ? weather.color
                                : theme.colors.text.secondary,
                              fontWeight: isSelected ? '600' : '500',
                              fontSize: safeRFontSize(14),
                            },
                          ]}
                        >
                          {weather.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes Section */}
            <View style={[styles.section, { marginBottom: safeRSpacing(24) }]}>
              <Text style={[
                styles.sectionTitle, 
                { 
                  color: theme.colors.text.primary,
                  fontSize: safeRFontSize(18),
                  marginBottom: safeRSpacing(12),
                }
              ]}>
                {t('record.notes')}
              </Text>
              <View
                style={[
                  styles.notesContainer,
                  {
                    backgroundColor: isDark
                      ? theme.colors.background.secondary
                      : theme.colors.background.elevated,
                    borderRadius: safeRSpacing(12),
                  },
                ]}
              >
                <LinearGradient
                  colors={
                    notes.trim()
                      ? ['rgba(147, 51, 234, 0.1)', 'rgba(168, 85, 247, 0.05)']
                      : ['transparent', 'transparent']
                  }
                  style={[
                    styles.notesGradient,
                    {
                      padding: safeRSpacing(16),
                    }
                  ]}
                >
                  <TextInput
                    style={[
                      styles.notesInput, 
                      { 
                        color: theme.colors.text.primary,
                        fontSize: safeRFontSize(16),
                        marginBottom: safeRSpacing(8),
                      }
                    ]}
                    placeholder={t('record.notesPlaceholder')}
                    placeholderTextColor={theme.colors.text.secondary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={500}
                  />
                  <View style={styles.notesFooter}>
                    <Text style={[
                      styles.characterCount, 
                      { 
                        color: theme.colors.text.secondary,
                        fontSize: safeRFontSize(12),
                      }
                    ]}>
                      {notes.length}/500
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </Animated.View>

          {/* Save Button */}
          <Animated.View
            style={[
              styles.saveButtonContainer,
              { 
                transform: [{ scale: saveButtonScale }],
                marginTop: safeRSpacing(16),
                marginBottom: safeRSpacing(24),
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isFormValid || isSaving}
              style={[
                styles.saveButton,
                { 
                  opacity: !isFormValid || isSaving ? 0.5 : 1,
                  borderRadius: safeRSpacing(12),
                },
              ]}
            >
              <LinearGradient
                colors={['#a855f7', '#9333ea', '#7e22ce']}
                style={[
                  styles.saveGradient,
                  {
                    padding: safeRSpacing(20),
                  }
                ]}
              >
                <View style={[
                  styles.saveButtonContent,
                  {
                    gap: safeRSpacing(12),
                  }
                ]}>
                  {isSaving ? (
                    <>
                      <Animated.View style={styles.loadingSpinner}>
                        <Ionicons name="refresh" size={24} color={colors.text.dark.primary} />
                      </Animated.View>
                      <Text style={[
                        styles.saveText,
                        {
                          fontSize: safeRFontSize(18),
                        }
                      ]}>{t('record.savingVisit')}</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={24} color={colors.text.dark.primary} />
                      <Text style={[
                        styles.saveText,
                        {
                          fontSize: safeRFontSize(18),
                        }
                      ]}>{t('record.saveVisit')}</Text>
                    </>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      
      <DrawerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />

      <SuccessModal
        visible={showSuccessModal}
        title={t('record.success')}
        message={t('record.successMessage')}
        onConfirm={handleSuccessConfirm}
        confirmText={language === 'ja' ? '詳細を見る' : 'View Details'}
      />
    </SwipeableScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 0,
  },
  headerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {},
  section: {},
  sectionTitle: {
    fontWeight: '600',
  },
  advancedToggle: {
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  advancedToggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advancedToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advancedToggleText: {
    fontWeight: '600',
  },
  advancedContent: {
    marginBottom: 16,
  },
  weatherContainer: {
    flexDirection: 'row',
  },
  weatherButton: {
    flex: 1,
    borderWidth: 1,
    overflow: 'hidden',
  },
  weatherGradient: {
    alignItems: 'center',
  },
  weatherLabel: {
    textAlign: 'center',
  },
  notesContainer: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notesGradient: {},
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  notesFooter: {
    alignItems: 'flex-end',
  },
  characterCount: {},
  saveButtonContainer: {},
  saveButton: {
    overflow: 'hidden',
    shadowColor: '#a855f7',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  saveGradient: {
    alignItems: 'center',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveText: {
    fontWeight: '700',
    color: colors.text.dark.primary,
  },
  loadingSpinner: {
    // Add rotation animation here if needed
  },
});