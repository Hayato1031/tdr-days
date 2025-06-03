import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useActions } from '../hooks/useActions';
import { TimelineAction, ActionCategory, ParkType, ParkArea } from '../types/models';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { AreaPicker } from './AreaPicker';
import { LocationSelector } from './LocationSelector';
import { PhotoManager } from './PhotoManager';
import { ValidationFeedback } from './ValidationFeedback';

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  visitId: string;
  parkType: ParkType;
  action?: TimelineAction;
  onSave?: (action: TimelineAction) => void;
}

interface FormData {
  category: ActionCategory;
  area: ParkArea | '';
  locationName: string;
  customTitle: string;
  time: Date;
  notes: string;
  photos: string[];
  waitTime?: number;
  duration?: number;
}

interface FormErrors {
  category?: string;
  area?: string;
  locationName?: string;
  time?: string;
}

const getCategoryOptions = (language: string) => [
  { 
    value: ActionCategory.ATTRACTION, 
    label: language === 'ja' ? 'アトラクション' : 'Attraction', 
    icon: 'rocket' 
  },
  { 
    value: ActionCategory.RESTAURANT, 
    label: language === 'ja' ? 'レストラン' : 'Restaurant', 
    icon: 'restaurant' 
  },
  { 
    value: ActionCategory.SHOW, 
    label: language === 'ja' ? 'ショー/パレード' : 'Show/Parade', 
    icon: 'musical-notes' 
  },
  { 
    value: ActionCategory.GREETING, 
    label: language === 'ja' ? 'グリーティング' : 'Character Greeting', 
    icon: 'hand-left' 
  },
  { 
    value: ActionCategory.SHOPPING, 
    label: language === 'ja' ? 'ショッピング' : 'Shopping', 
    icon: 'bag' 
  },
  { 
    value: ActionCategory.CUSTOM, 
    label: language === 'ja' ? 'カスタム' : 'Custom', 
    icon: 'create' 
  },
];

export const ActionModal: React.FC<ActionModalProps> = ({
  visible,
  onClose,
  visitId,
  parkType,
  action,
  onSave,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { createAction, updateAction } = useActions();
  
  const categoryOptions = getCategoryOptions(language);
  
  const [formData, setFormData] = useState<FormData>({
    category: ActionCategory.ATTRACTION,
    area: '',
    locationName: '',
    customTitle: '',
    time: new Date(),
    notes: '',
    photos: [],
    waitTime: undefined,
    duration: undefined,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (action) {
      setFormData({
        category: action.category,
        area: action.area,
        locationName: action.locationName || '',
        customTitle: action.customTitle || '',
        time: new Date(action.time),
        notes: action.notes || '',
        photos: action.photos.map(p => p.uri),
        waitTime: action.waitTime,
        duration: action.duration,
      });
    } else {
      setFormData({
        category: ActionCategory.ATTRACTION,
        area: '',
        locationName: '',
        customTitle: '',
        time: new Date(),
        notes: '',
        photos: [],
        waitTime: undefined,
        duration: undefined,
      });
    }
    setErrors({});
  }, [action, visible]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.category) {
      newErrors.category = language === 'ja' ? 'カテゴリを選択してください' : 'Please select a category';
    }

    if (!formData.area) {
      newErrors.area = language === 'ja' ? 'エリアを選択してください' : 'Please select an area';
    }

    // Location is only required for ATTRACTION, RESTAURANT, SHOW, and SHOPPING
    const requiresLocation = [
      ActionCategory.ATTRACTION,
      ActionCategory.RESTAURANT,
      ActionCategory.SHOW,
      ActionCategory.SHOPPING
    ].includes(formData.category);

    if (requiresLocation && !formData.locationName.trim()) {
      newErrors.locationName = language === 'ja' ? '施設名を入力してください' : 'Please enter a facility name';
    }

    // For CUSTOM category, either locationName or customTitle is required
    if (formData.category === ActionCategory.CUSTOM && 
        !formData.locationName.trim() && 
        !formData.customTitle.trim()) {
      newErrors.locationName = language === 'ja' ? 'タイトルまたは施設名を入力してください' : 'Please enter a title or facility name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const actionData: Omit<TimelineAction, 'id' | 'createdAt' | 'updatedAt'> = {
        visitId,
        category: formData.category,
        area: formData.area as ParkArea,
        locationName: formData.locationName.trim() || undefined,
        customTitle: formData.customTitle.trim() || undefined,
        time: formData.time,
        notes: formData.notes.trim() || undefined,
        photos: formData.photos.map((uri, index) => ({
          id: `photo-${Date.now()}-${index}`,
          uri,
        })),
        waitTime: formData.waitTime,
        duration: formData.duration,
      };

      let savedAction: TimelineAction;
      
      if (action) {
        savedAction = await updateAction(action.id, actionData);
      } else {
        savedAction = await createAction(actionData);
      }

      onSave?.(savedAction);
      onClose();
    } catch (error) {
      Alert.alert(
        language === 'ja' ? 'エラー' : 'Error',
        language === 'ja' ? 'アクションの保存に失敗しました' : 'Failed to save action'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setFormData(prev => ({ ...prev, time: selectedTime }));
    }
  };

  const getCategoryIcon = (category: ActionCategory): string => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option?.icon || 'ellipse';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {action 
              ? (language === 'ja' ? 'アクション編集' : 'Edit Action') 
              : (language === 'ja' ? 'アクション追加' : 'Add Action')
            }
          </Text>
          
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            style={[
              styles.headerButton,
              { opacity: isLoading ? 0.5 : 1 }
            ]}
          >
            <Text style={[styles.saveText, { color: colors.blue[500] }]}>
              {language === 'ja' ? '保存' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Selection */}
          <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? 'カテゴリ' : 'Category'}
            </Text>
            
            <View style={styles.categoryGrid}>
              {categoryOptions.map((option) => {
                const isSelected = formData.category === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.categoryOption,
                      {
                        backgroundColor: isSelected 
                          ? colors.blue[500] + '20'
                          : theme.colors.background.secondary,
                        borderColor: isSelected 
                          ? colors.blue[500]
                          : theme.colors.border,
                      }
                    ]}
                    onPress={() => setFormData(prev => ({ 
                      ...prev, 
                      category: option.value,
                      area: '', // Reset area when category changes
                      locationName: '', // Reset location when category changes
                      customTitle: '' // Reset custom title when category changes
                    }))}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={20} 
                      color={isSelected ? colors.blue[500] : theme.colors.text.secondary}
                    />
                    <Text style={[
                      styles.categoryLabel,
                      { 
                        color: isSelected ? colors.blue[500] : theme.colors.text.primary,
                        fontWeight: isSelected ? '600' : '400'
                      }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {errors.category && (
              <ValidationFeedback 
                validation={{
                  isValid: false,
                  errors: [errors.category],
                  warnings: []
                }}
              />
            )}
          </View>

          {/* Area Selection */}
          <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? 'エリア' : 'Area'}
            </Text>
            
            <AreaPicker
              parkType={parkType}
              selectedArea={formData.area}
              onAreaSelect={(area) => setFormData(prev => ({ 
                ...prev, 
                area,
                locationName: '', // Reset location when area changes
                customTitle: '' // Reset custom title when area changes
              }))}
            />
            
            {errors.area && (
              <ValidationFeedback 
                validation={{
                  isValid: false,
                  errors: [errors.area],
                  warnings: []
                }}
              />
            )}
          </View>

          {/* Location Selection - Only for categories that require specific locations */}
          {formData.area && [ActionCategory.ATTRACTION, ActionCategory.RESTAURANT, ActionCategory.SHOW, ActionCategory.SHOPPING].includes(formData.category) && (
            <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {language === 'ja' ? '施設名' : 'Facility Name'}
              </Text>
              
              <LocationSelector
                category={formData.category}
                parkType={parkType}
                area={formData.area as ParkArea}
                selectedLocation={formData.locationName}
                onLocationSelect={(locationName) => 
                  setFormData(prev => ({ ...prev, locationName }))
                }
                onCustomLocation={(locationName) => 
                  setFormData(prev => ({ ...prev, locationName }))
                }
              />
              
              {errors.locationName && (
                <ValidationFeedback 
                  validation={{
                    isValid: false,
                    errors: [errors.locationName],
                    warnings: []
                  }}
                />
              )}
            </View>
          )}

          {/* Custom Title for CUSTOM category */}
          {formData.category === ActionCategory.CUSTOM && formData.area && (
            <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {language === 'ja' ? 'タイトル' : 'Title'}
              </Text>
              
              <TextInput
                style={[
                  styles.titleInput,
                  {
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text.primary,
                  }
                ]}
                value={formData.customTitle}
                onChangeText={(text) => setFormData(prev => ({ ...prev, customTitle: text }))}
                placeholder={language === 'ja' ? 'カスタムアクションのタイトルを入力...' : 'Enter custom action title...'}
                placeholderTextColor={theme.colors.text.secondary}
              />
              
              {errors.locationName && (
                <ValidationFeedback 
                  validation={{
                    isValid: false,
                    errors: [errors.locationName],
                    warnings: []
                  }}
                />
              )}
            </View>
          )}

          {/* Optional Location for GREETING and CUSTOM */}
          {formData.area && [ActionCategory.GREETING, ActionCategory.CUSTOM].includes(formData.category) && (
            <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {formData.category === ActionCategory.GREETING 
                  ? (language === 'ja' ? 'グリーティング場所（任意）' : 'Greeting Location (Optional)') 
                  : (language === 'ja' ? '場所（任意）' : 'Location (Optional)')
                }
              </Text>
              
              <TextInput
                style={[
                  styles.titleInput,
                  {
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text.primary,
                  }
                ]}
                value={formData.locationName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, locationName: text }))}
                placeholder={formData.category === ActionCategory.GREETING 
                  ? (language === 'ja' ? 'グリーティング場所を入力...' : 'Enter greeting location...')
                  : (language === 'ja' ? '場所を入力...' : 'Enter location...')
                }
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>
          )}

          {/* Time Selection */}
          <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? '時刻' : 'Time'}
            </Text>
            
            <TouchableOpacity
              style={[styles.timeButton, { borderColor: theme.colors.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time" size={20} color={theme.colors.text.secondary} />
              <Text style={[styles.timeText, { color: theme.colors.text.primary }]}>
                {formData.time.toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            
            {showTimePicker && (
              <DateTimePicker
                value={formData.time}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>

          {/* Additional Fields for Attractions */}
          {formData.category === ActionCategory.ATTRACTION && (
            <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {language === 'ja' ? '詳細情報' : 'Additional Information'}
              </Text>
              
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                    {language === 'ja' ? '待ち時間（分）' : 'Wait Time (minutes)'}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.colors.background.secondary,
                        borderColor: theme.colors.border,
                        color: theme.colors.text.primary,
                      }
                    ]}
                    value={formData.waitTime?.toString() || ''}
                    onChangeText={(text) => {
                      const number = parseInt(text) || undefined;
                      setFormData(prev => ({ ...prev, waitTime: number }));
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.text.secondary}
                  />
                </View>
                
                <View style={styles.inputHalf}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                    {language === 'ja' ? '体験時間（分）' : 'Duration (minutes)'}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.colors.background.secondary,
                        borderColor: theme.colors.border,
                        color: theme.colors.text.primary,
                      }
                    ]}
                    value={formData.duration?.toString() || ''}
                    onChangeText={(text) => {
                      const number = parseInt(text) || undefined;
                      setFormData(prev => ({ ...prev, duration: number }));
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.text.secondary}
                  />
                </View>
              </View>
            </View>
          )}


          {/* Notes */}
          <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? 'メモ' : 'Notes'}
            </Text>
            
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                }
              ]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder={language === 'ja' ? 'メモを入力...' : 'Enter notes...'}
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Photos */}
          <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {language === 'ja' ? '写真' : 'Photos'}
            </Text>
            
            <PhotoManager
              photos={formData.photos}
              onPhotosChange={(photos) => setFormData(prev => ({ ...prev, photos }))}
              maxPhotos={10}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: spacing[2],
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: spacing[4],
    marginBottom: spacing[2],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minWidth: '47%',
  },
  categoryLabel: {
    fontSize: 14,
    marginLeft: spacing[2],
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 16,
    flex: 1,
    marginLeft: spacing[2],
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: spacing[2],
  },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
  },
  star: {
    marginHorizontal: spacing[1],
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 16,
    minHeight: 100,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 16,
  },
});