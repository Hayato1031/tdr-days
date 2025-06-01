import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker'; // Removed dependency
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { ActionCategory } from '../types/models';

interface CategoryFormData {
  // Common fields
  time: Date;
  duration: string;
  notes: string;
  rating: number;
  
  // Attraction-specific
  waitTime: string;
  fastPass: boolean;
  
  // Restaurant-specific
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  reservationMade: boolean;
  partySize: string;
  
  // Shopping-specific
  purchaseAmount: string;
  purchasedItems: string;
  
  // Show/Greeting-specific
  performerNames: string;
  showTime: string;
  meetingDuration: string;
}

interface CategoryFormProps {
  category: ActionCategory;
  formData: Partial<CategoryFormData>;
  onFormDataChange: (data: Partial<CategoryFormData>) => void;
  visitDate: Date;
  style?: any;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  formData,
  onFormDataChange,
  visitDate,
  style,
}) => {
  const { theme } = useTheme();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const getCategoryColor = (category: ActionCategory) => {
    switch (category) {
      case ActionCategory.ATTRACTION:
        return colors.purple[500];
      case ActionCategory.RESTAURANT:
        return colors.orange[500];
      case ActionCategory.SHOW:
        return colors.pink[500];
      case ActionCategory.GREETING:
        return colors.yellow[500];
      case ActionCategory.SHOPPING:
        return colors.green[500];
      default:
        return colors.gray[500];
    }
  };

  const getCategoryIcon = (category: ActionCategory) => {
    switch (category) {
      case ActionCategory.ATTRACTION:
        return 'rocket';
      case ActionCategory.RESTAURANT:
        return 'restaurant';
      case ActionCategory.SHOW:
        return 'musical-notes';
      case ActionCategory.GREETING:
        return 'hand-left';
      case ActionCategory.SHOPPING:
        return 'bag';
      default:
        return 'calendar';
    }
  };

  const updateFormData = (updates: Partial<CategoryFormData>) => {
    onFormDataChange({ ...formData, ...updates });
  };

  const renderStarRating = () => {
    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          Rating
        </Text>
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => updateFormData({ 
                rating: formData.rating === star ? 0 : star 
              })}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= (formData.rating || 0) ? 'star' : 'star-outline'}
                size={24}
                color={colors.yellow[500]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderTimeInput = () => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        Time *
      </Text>
      <TouchableOpacity
        style={[
          styles.input,
          styles.timeInput,
          {
            backgroundColor: theme.colors.background.elevated,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => setShowTimePicker(true)}
      >
        <Text style={[styles.timeText, { color: theme.colors.text.primary }]}>
          {(formData.time || visitDate).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );

  const renderDurationInput = () => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        Duration (minutes)
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.background.elevated,
            color: theme.colors.text.primary,
            borderColor: theme.colors.border,
          },
        ]}
        value={formData.duration || ''}
        onChangeText={(text) => updateFormData({ duration: text })}
        placeholder="30"
        placeholderTextColor={theme.colors.text.tertiary}
        keyboardType="numeric"
      />
    </View>
  );

  const renderNotesInput = () => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        Notes
      </Text>
      <TextInput
        style={[
          styles.input,
          styles.notesInput,
          {
            backgroundColor: theme.colors.background.elevated,
            color: theme.colors.text.primary,
            borderColor: theme.colors.border,
          },
        ]}
        value={formData.notes || ''}
        onChangeText={(text) => updateFormData({ notes: text })}
        placeholder="Add your thoughts about this experience..."
        placeholderTextColor={theme.colors.text.tertiary}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );

  const renderAttractionFields = () => (
    <>
      <View style={styles.rowContainer}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>
            Wait Time (min)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.background.elevated,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              },
            ]}
            value={formData.waitTime || ''}
            onChangeText={(text) => updateFormData({ waitTime: text })}
            placeholder="15"
            placeholderTextColor={theme.colors.text.tertiary}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>
            Fast Pass
          </Text>
          <View style={styles.switchContainer}>
            <Switch
              value={formData.fastPass || false}
              onValueChange={(value) => updateFormData({ fastPass: value })}
              trackColor={{ 
                false: theme.colors.background.elevated, 
                true: getCategoryColor(category) 
              }}
              thumbColor={formData.fastPass ? 'white' : theme.colors.text.tertiary}
            />
            <Text style={[styles.switchLabel, { color: theme.colors.text.secondary }]}>
              {formData.fastPass ? 'Used' : 'None'}
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderRestaurantFields = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          Meal Type
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
          {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.chip,
                {
                  backgroundColor: formData.mealType === type
                    ? getCategoryColor(category)
                    : theme.colors.background.elevated,
                  borderColor: formData.mealType === type
                    ? getCategoryColor(category)
                    : theme.colors.border,
                },
              ]}
              onPress={() => updateFormData({ mealType: type as any })}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: formData.mealType === type
                      ? 'white'
                      : theme.colors.text.primary,
                  },
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.rowContainer}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>
            Party Size
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.background.elevated,
                color: theme.colors.text.primary,
                borderColor: theme.colors.border,
              },
            ]}
            value={formData.partySize || ''}
            onChangeText={(text) => updateFormData({ partySize: text })}
            placeholder="2"
            placeholderTextColor={theme.colors.text.tertiary}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>
            Reservation
          </Text>
          <View style={styles.switchContainer}>
            <Switch
              value={formData.reservationMade || false}
              onValueChange={(value) => updateFormData({ reservationMade: value })}
              trackColor={{ 
                false: theme.colors.background.elevated, 
                true: getCategoryColor(category) 
              }}
              thumbColor={formData.reservationMade ? 'white' : theme.colors.text.tertiary}
            />
            <Text style={[styles.switchLabel, { color: theme.colors.text.secondary }]}>
              {formData.reservationMade ? 'Made' : 'Walk-in'}
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderShoppingFields = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          Purchase Amount (¥)
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background.elevated,
              color: theme.colors.text.primary,
              borderColor: theme.colors.border,
            },
          ]}
          value={formData.purchaseAmount || ''}
          onChangeText={(text) => updateFormData({ purchaseAmount: text })}
          placeholder="0"
          placeholderTextColor={theme.colors.text.tertiary}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          Items Purchased
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.notesInput,
            {
              backgroundColor: theme.colors.background.elevated,
              color: theme.colors.text.primary,
              borderColor: theme.colors.border,
            },
          ]}
          value={formData.purchasedItems || ''}
          onChangeText={(text) => updateFormData({ purchasedItems: text })}
          placeholder="T-shirt, Keychain, etc. (separate with commas)"
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>
    </>
  );

  const renderShowGreetingFields = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {category === ActionCategory.SHOW ? 'Show Time' : 'Meeting Duration (min)'}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background.elevated,
              color: theme.colors.text.primary,
              borderColor: theme.colors.border,
            },
          ]}
          value={category === ActionCategory.SHOW ? (formData.showTime || '') : (formData.meetingDuration || '')}
          onChangeText={(text) => updateFormData(
            category === ActionCategory.SHOW 
              ? { showTime: text } 
              : { meetingDuration: text }
          )}
          placeholder={category === ActionCategory.SHOW ? "14:30 Show" : "5"}
          placeholderTextColor={theme.colors.text.tertiary}
          keyboardType={category === ActionCategory.GREETING ? "numeric" : "default"}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {category === ActionCategory.SHOW ? 'Performers' : 'Characters Met'}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background.elevated,
              color: theme.colors.text.primary,
              borderColor: theme.colors.border,
            },
          ]}
          value={formData.performerNames || ''}
          onChangeText={(text) => updateFormData({ performerNames: text })}
          placeholder="Mickey Mouse, Minnie Mouse (separate with commas)"
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
        />
      </View>
    </>
  );

  const renderCategorySpecificFields = () => {
    switch (category) {
      case ActionCategory.ATTRACTION:
        return renderAttractionFields();
      case ActionCategory.RESTAURANT:
        return renderRestaurantFields();
      case ActionCategory.SHOPPING:
        return renderShoppingFields();
      case ActionCategory.SHOW:
      case ActionCategory.GREETING:
        return renderShowGreetingFields();
      default:
        return null;
    }
  };

  return (
    <ScrollView 
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <LinearGradient
          colors={[getCategoryColor(category), `${getCategoryColor(category)}80`]}
          style={styles.headerGradient}
        >
          <Ionicons
            name={getCategoryIcon(category) as any}
            size={24}
            color="white"
          />
          <Text style={styles.headerTitle}>
            {category.charAt(0) + category.slice(1).toLowerCase()} Details
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        {renderTimeInput()}
        {renderDurationInput()}
        {renderCategorySpecificFields()}
        {renderStarRating()}
        {renderNotesInput()}
      </View>

      {/* Time Picker Modal - Functionality disabled due to removed dependency */}
      {showTimePicker && (
        <View style={styles.timePickerPlaceholder}>
          <Text style={[styles.placeholderText, { color: theme.colors.text.secondary }]}>
            Time picker functionality is unavailable
          </Text>
          <TouchableOpacity
            style={[styles.placeholderButton, { backgroundColor: colors.purple[500] }]}
            onPress={() => setShowTimePicker(false)}
          >
            <Text style={styles.placeholderButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: spacing[4],
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    margin: spacing[4],
    marginBottom: 0,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: spacing[2],
  },
  content: {
    paddingHorizontal: spacing[4],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    fontSize: 16,
    fontWeight: '500',
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  halfWidth: {
    width: '48%',
    marginBottom: 0,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  switchLabel: {
    marginLeft: spacing[2],
    fontSize: 14,
    fontWeight: '500',
  },
  chipContainer: {
    marginTop: spacing[1],
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginRight: spacing[2],
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  starContainer: {
    flexDirection: 'row',
    marginTop: spacing[1],
  },
  starButton: {
    padding: spacing[1],
    marginRight: spacing[1],
  },
  timePickerPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    marginBottom: spacing[4],
  },
  placeholderButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  placeholderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});