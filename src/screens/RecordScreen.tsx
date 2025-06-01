import React, { useState, useRef } from 'react';
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
} from 'react-native';
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
  { type: 'SNOWY', label: t('record.snowy'), icon: 'snow', color: '#f1faee' },
];

export const RecordScreen = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
    createCompanion,
    deleteCompanion,
    isLoading,
  } = useVisits();

  // Form state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedPark, setSelectedPark] = useState<ParkType | undefined>();
  const [selectedCompanionIds, setSelectedCompanionIds] = useState<string[]>([]);
  const [selectedWeather, setSelectedWeather] = useState<WeatherType | undefined>();
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Animation refs
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const formProgressAnim = useRef(new Animated.Value(0)).current;

  // Validation
  const isFormValid = selectedDate && selectedPark;
  const completionPercentage = [
    selectedDate,
    selectedPark,
    selectedCompanionIds.length > 0,
    selectedWeather,
    notes.trim(),
  ].filter(Boolean).length / 5;

  // Update progress animation
  React.useEffect(() => {
    Animated.timing(formProgressAnim, {
      toValue: completionPercentage,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [completionPercentage]);

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
      const visitData: CreateInput<Visit> = {
        date: new Date(selectedDate),
        parkType: selectedPark!,
        companionIds: selectedCompanionIds,
        weather: selectedWeather,
        notes: notes.trim() || undefined,
      };

      await createVisit(visitData);
      
      // Reset form
      setSelectedDate('');
      setSelectedPark(undefined);
      setSelectedCompanionIds([]);
      setSelectedWeather(undefined);
      setNotes('');

      Alert.alert(t('record.success'), t('record.successMessage'), [
        { text: t('common.ok'), style: 'default' },
      ]);
    } catch (error) {
      Alert.alert(t('record.error'), t('record.errorMessage'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SwipeableScreen onSwipeFromLeft={() => setMenuVisible(true)}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Header 
          title={t('nav.record')} 
          onMenuOpen={() => setMenuVisible(true)}
        />
        <ScrollView
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
            
            {/* Progress Bar */}
            <View style={[
              styles.progressContainer,
              {
                gap: safeRSpacing(12),
              }
            ]}>
              <View style={[
                styles.progressTrack,
                {
                  backgroundColor: colors.background.tertiary,
                  borderRadius: safeRSpacing(8),
                }
              ]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.purple.bright,
                      borderRadius: safeRSpacing(8),
                      width: formProgressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={[
                styles.progressText, 
                { 
                  color: theme.colors.text.secondary,
                  fontSize: safeRFontSize(14),
                }
              ]}>
                {Math.round(completionPercentage * 100)}{t('record.complete')}
              </Text>
            </View>
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
              maxDate={new Date().toISOString().split('T')[0]}
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
            />
          </View>

          {/* Weather Selection */}
          <View style={[styles.section, { marginBottom: safeRSpacing(24) }]}>
            <Text style={[
              styles.sectionTitle, 
              { 
                color: theme.colors.text.primary,
                fontSize: safeRFontSize(20),
                marginBottom: safeRSpacing(16),
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
                        backgroundColor: isSelected
                          ? `${weather.color}20`
                          : isDark
                          ? theme.colors.background.secondary
                          : theme.colors.background.elevated,
                        borderColor: isSelected ? weather.color : 'transparent',
                        borderRadius: safeRSpacing(12),
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isSelected
                          ? [`${weather.color}30`, `${weather.color}10`]
                          : ['transparent', 'transparent']
                      }
                      style={[
                        styles.weatherGradient,
                        {
                          padding: safeRSpacing(12),
                          gap: safeRSpacing(8),
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
                    </LinearGradient>
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
                fontSize: safeRFontSize(20),
                marginBottom: safeRSpacing(16),
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
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontWeight: '600',
  },
  formContainer: {},
  section: {},
  sectionTitle: {
    fontWeight: '600',
  },
  weatherContainer: {
    flexDirection: 'row',
  },
  weatherButton: {
    flex: 1,
    borderWidth: 2,
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