import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../styles/colors';
import { Header } from '../components/Header';
import { CalendarPicker } from '../components/CalendarPicker';
import { ParkSelector } from '../components/ParkSelector';
import { CompanionManager } from '../components/CompanionManager';
import { SuccessModal } from '../components/SuccessModal';
import { useVisits } from '../hooks/useVisits';
import { ParkType, PassType } from '../types/models';

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

interface RouteParams {
  visitId: string;
}

const getPassTypeOptions = (language: string) => [
  {
    type: PassType.ONE_DAY,
    label: language === 'ja' ? '1デーパスポート' : '1-Day Passport',
    icon: 'sunny-outline' as const,
    time: language === 'ja' ? '開園〜閉園' : 'Open to Close',
  },
  {
    type: PassType.EARLY_EVENING,
    label: language === 'ja' ? 'アーリーイブニングパスポート' : 'Early Evening Passport',
    icon: 'partly-sunny-outline' as const,
    time: language === 'ja' ? '15時〜閉園' : '3PM to Close',
  },
  {
    type: PassType.WEEKNIGHT,
    label: language === 'ja' ? 'ウィークナイトパスポート' : 'Weeknight Passport',
    icon: 'moon-outline' as const,
    time: language === 'ja' ? '17時〜閉園' : '5PM to Close',
  },
];

export const EditVisitScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { visitId } = route.params as RouteParams;
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const isDark = theme.mode === 'dark';

  const { 
    rSpacing, 
    rFontSize 
  } = useResponsive();

  const {
    updateVisit,
    getVisit,
    createCompanion,
    updateCompanion,
    deleteCompanion,
    companions,
  } = useVisits();

  // Form state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedPark, setSelectedPark] = useState<ParkType | undefined>();
  const [selectedPassType, setSelectedPassType] = useState<PassType>(PassType.ONE_DAY);
  const [selectedCompanionIds, setSelectedCompanionIds] = useState<string[]>([]);
  const [selectedWeather, setSelectedWeather] = useState<WeatherType | undefined>();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form validation
  const isFormValid = selectedDate && selectedPark && selectedPassType;

  // Load visit data
  useEffect(() => {
    const loadVisitData = async () => {
      try {
        setIsLoading(true);
        const visit = await getVisit(visitId);
        if (visit) {
          setSelectedDate(new Date(visit.date).toISOString().split('T')[0]);
          setSelectedPark(visit.parkType);
          setSelectedPassType(visit.passType || PassType.ONE_DAY);
          setSelectedCompanionIds(visit.companionIds);
          setSelectedWeather(visit.weather);
          setNotes(visit.notes || '');
        } else {
          Alert.alert(
            t('record.error'),
            'Visit not found'
          );
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading visit:', error);
        Alert.alert(
          t('record.error'),
          t('record.errorMessage')
        );
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    loadVisitData();
  }, [visitId]);

  const handleSave = async () => {
    if (!isFormValid) {
      Alert.alert(
        t('record.incompleteForm'),
        language === 'ja' 
          ? '日付、パーク、パスタイプを選択してください' 
          : 'Please select date, park, and pass type'
      );
      return;
    }

    try {
      setIsSaving(true);

      const visitData = {
        date: new Date(selectedDate),
        parkType: selectedPark!,
        passType: selectedPassType,
        companionIds: selectedCompanionIds,
        weather: selectedWeather,
        notes: notes.trim() || undefined,
      };

      await updateVisit(visitId, visitData);

      // Show success modal instead of alert
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating visit:', error);
      Alert.alert(
        t('record.error'),
        t('record.errorMessage')
      );
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text.primary }}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <Header
        title={language === 'ja' ? '来園記録を編集' : 'Edit Visit'}
        showBackButton={true}
        onBackPress={() => {
          console.log('Back button pressed'); // デバッグ用
          navigation.goBack();
        }}
        rightComponent={
          <TouchableOpacity
            onPress={() => {
              console.log('Close button pressed'); // デバッグ用
              navigation.goBack();
            }}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <Ionicons
              name="close"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Clean Header Section */}
        <View style={[
          styles.header,
          {
            backgroundColor: colors.background.primary,
            paddingHorizontal: rSpacing(20),
            marginBottom: rSpacing(24),
          }
        ]}>
          <View style={[
            styles.headerContent,
            {
              backgroundColor: colors.background.card,
              borderRadius: rSpacing(20),
              padding: rSpacing(24),
              borderWidth: 1,
              borderColor: colors.utility.borderLight,
            }
          ]}>
            <Text style={[
              styles.headerTitle, 
              { 
                color: theme.colors.text.primary,
                fontSize: rFontSize(28),
                marginBottom: rSpacing(8),
              }
            ]}>
              {language === 'ja' ? '来園記録を編集' : 'Edit Visit'}
            </Text>
            <Text style={[
              styles.headerSubtitle, 
              { 
                color: theme.colors.text.secondary,
                fontSize: rFontSize(16),
                marginBottom: rSpacing(20),
              }
            ]}>
              {language === 'ja' ? '魔法の思い出を更新しましょう' : 'Update your magical memories'}
            </Text>
          </View>
        </View>

        <View style={[
          styles.formContainer,
          {
            paddingHorizontal: rSpacing(20),
          }
        ]}>
          {/* Calendar Picker */}
          <View style={[styles.section, { marginBottom: rSpacing(24) }]}>
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
          <View style={[styles.section, { marginBottom: rSpacing(24) }]}>
            <ParkSelector
              selectedPark={selectedPark}
              onParkSelect={setSelectedPark}
            />
          </View>

          {/* Pass Type Selector */}
          <View style={[styles.section, { marginBottom: rSpacing(24) }]}>
            <Text style={[
              styles.sectionTitle, 
              { 
                color: theme.colors.text.primary,
                fontSize: rFontSize(18),
                marginBottom: rSpacing(12),
              }
            ]}>
              {language === 'ja' ? 'パスタイプ' : 'Pass Type'} 
              <Text style={{ color: colors.semantic.error.main }}> *</Text>
            </Text>
            <View style={[
              styles.passTypeContainer,
              {
                gap: rSpacing(12),
              }
            ]}>
              {getPassTypeOptions(language).map((passOption) => {
                const isSelected = selectedPassType === passOption.type;
                return (
                  <TouchableOpacity
                    key={passOption.type}
                    onPress={() => setSelectedPassType(passOption.type)}
                    style={[
                      styles.passTypeOption,
                      {
                        backgroundColor: isSelected
                          ? `${colors.purple[500]}10`
                          : colors.background.card,
                        borderColor: isSelected
                          ? colors.purple[500]
                          : colors.utility.border,
                        borderWidth: isSelected ? 2 : 1,
                        padding: rSpacing(16),
                        borderRadius: rSpacing(12),
                      }
                    ]}
                  >
                    <View style={styles.passTypeHeader}>
                      <View style={[
                        styles.passTypeIconContainer,
                        {
                          backgroundColor: isSelected
                            ? colors.purple[500]
                            : colors.utility.border,
                        }
                      ]}>
                        <Ionicons
                          name={passOption.icon}
                          size={20}
                          color={isSelected ? colors.utility.white : theme.colors.text.secondary}
                        />
                      </View>
                      {isSelected && (
                        <View style={[
                          styles.checkmark,
                          { backgroundColor: colors.purple[500] }
                        ]}>
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={colors.utility.white}
                          />
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.passTypeLabel,
                      {
                        color: isSelected
                          ? colors.purple[600]
                          : theme.colors.text.primary,
                        fontWeight: isSelected ? '600' : '500',
                        fontSize: rFontSize(16),
                        marginBottom: rSpacing(4),
                      }
                    ]}>
                      {passOption.label}
                    </Text>
                    <Text style={[
                      styles.passTypeTime,
                      {
                        color: theme.colors.text.secondary,
                        fontSize: rFontSize(14),
                      }
                    ]}>
                      {passOption.time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Companion Manager */}
          <View style={[styles.section, { marginBottom: rSpacing(24) }]}>
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
          <View style={[styles.section, { marginBottom: rSpacing(24) }]}>
            <Text style={[
              styles.sectionTitle, 
              { 
                color: theme.colors.text.primary,
                fontSize: rFontSize(18),
                marginBottom: rSpacing(12),
              }
            ]}>
              {t('record.weather')}
            </Text>
            <View style={[
              styles.weatherContainer,
              {
                gap: rSpacing(12),
                flexDirection: 'row',
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
                        borderRadius: rSpacing(12),
                        borderWidth: isSelected ? 2 : 1,
                        padding: rSpacing(12),
                        flex: 1,
                        alignItems: 'center',
                      },
                    ]}
                  >
                    <Ionicons
                      name={weather.icon as any}
                      size={24}
                      color={isSelected ? weather.color : theme.colors.text.secondary}
                      style={{ marginBottom: 4 }}
                    />
                    <Text
                      style={[
                        styles.weatherText,
                        {
                          color: isSelected ? weather.color : theme.colors.text.secondary,
                          fontSize: rFontSize(12),
                          fontWeight: isSelected ? '600' : '500',
                        },
                      ]}
                    >
                      {weather.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes Input */}
          <View style={[styles.section, { marginBottom: rSpacing(32) }]}>
            <Text style={[
              styles.sectionTitle, 
              { 
                color: theme.colors.text.primary,
                fontSize: rFontSize(18),
                marginBottom: rSpacing(12),
              }
            ]}>
              {language === 'ja' ? 'メモ' : 'Notes'}
            </Text>
            <View style={[
              styles.notesContainer,
              {
                backgroundColor: isDark
                  ? theme.colors.background.secondary
                  : theme.colors.background.elevated,
                borderRadius: rSpacing(12),
                borderWidth: 1,
                borderColor: colors.utility.borderLight,
              }
            ]}>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    color: theme.colors.text.primary,
                    fontSize: rFontSize(16),
                    padding: rSpacing(16),
                    minHeight: 100,
                  },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder={
                  language === 'ja'
                    ? 'この日の思い出を記録しましょう...'
                    : 'Record your memories from this day...'
                }
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Save Button */}
      <View style={[
        styles.fixedSaveContainer,
        {
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          borderTopColor: colors.utility.borderLight,
        }
      ]}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isFormValid || isSaving}
          style={[
            styles.fixedSaveButton,
            {
              backgroundColor: isFormValid && !isSaving
                ? colors.purple[500]
                : colors.utility.border,
              borderRadius: rSpacing(12),
            },
          ]}
        >
          <Text
            style={[
              styles.fixedSaveButtonText,
              {
                color: isFormValid && !isSaving
                  ? colors.utility.white
                  : theme.colors.text.secondary,
                fontSize: rFontSize(16),
              },
            ]}
          >
            {isSaving ? (language === 'ja' ? '保存中...' : 'Saving...') : (language === 'ja' ? '保存' : 'Save')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title={language === 'ja' ? '更新完了！' : 'Update Complete!'}
        message={language === 'ja' ? '来園記録が正常に更新されました' : 'Your visit record has been successfully updated'}
        onConfirm={handleSuccessConfirm}
        confirmText={language === 'ja' ? '完了' : 'Done'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingTop: 16,
  },
  headerContent: {
    shadowColor: colors.effects.shadowSoft,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
  },
  section: {
    // Base section styles
  },
  sectionTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  passTypeContainer: {
    // Container for pass type options
  },
  passTypeOption: {
    // Individual pass type option styles
  },
  passTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passTypeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passTypeLabel: {
    // Pass type label styles
  },
  passTypeTime: {
    // Pass type time description styles
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  weatherButton: {
    // Weather button styles handled in component
  },
  weatherText: {
    textAlign: 'center',
  },
  notesContainer: {
    // Notes container styles handled in component
  },
  notesInput: {
    // Notes input styles handled in component
  },
  fixedSaveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  fixedSaveButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fixedSaveButtonText: {
    fontWeight: '600',
  },
});