import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { 
  TimelineAction, 
  ActionCategory, 
  ParkArea, 
  LandArea, 
  SeaArea, 
  ParkType,
  CreateInput,
  UpdateInput,
  Photo,
} from '../types/models';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';

// Import our new components
import { AreaPicker } from './AreaPicker';
import { LocationSelector } from './LocationSelector';
import { CategoryForm } from './CategoryForm';
import { PhotoManager } from './PhotoManager';
import { ValidationFeedback } from './ValidationFeedback';

// Import validation utilities
import { validateStep, validateAction, ValidationResult, ActionFormData } from '../utils/validation';

const { width, height } = Dimensions.get('window');

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (action: CreateInput<TimelineAction> | UpdateInput<TimelineAction>) => Promise<void>;
  action?: TimelineAction;
  visitId: string;
  visitDate: Date;
  parkType: ParkType;
}

interface PresetItem {
  id: string;
  name: string;
  nameEn?: string;
  category: ActionCategory;
  parkType: ParkType;
  area: ParkArea;
  tags?: string[];
  isPopular?: boolean;
  isNew?: boolean;
}

enum WizardStep {
  CATEGORY = 0,
  AREA = 1,
  LOCATION = 2,
  DETAILS = 3,
  PHOTOS = 4,
}

const STEP_TITLES = {
  [WizardStep.CATEGORY]: 'Select Category',
  [WizardStep.AREA]: 'Choose Area',
  [WizardStep.LOCATION]: 'Pick Location',
  [WizardStep.DETAILS]: 'Add Details',
  [WizardStep.PHOTOS]: 'Upload Photos',
};

export const ActionModal: React.FC<ActionModalProps> = ({
  visible,
  onClose,
  onSave,
  action,
  visitId,
  visitDate,
  parkType,
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  // Animations
  const slideAnimation = useRef(new Animated.Value(height)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;
  const stepAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.CATEGORY);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation state
  const [currentValidation, setCurrentValidation] = useState<ValidationResult | undefined>();
  const [showValidation, setShowValidation] = useState(false);

  // Form data
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory>(
    action?.category || ActionCategory.ATTRACTION
  );
  const [selectedArea, setSelectedArea] = useState<ParkArea | undefined>(action?.area);
  const [selectedLocation, setSelectedLocation] = useState<string>(action?.locationName || '');
  const [selectedPreset, setSelectedPreset] = useState<PresetItem | null>(null);
  const [photos, setPhotos] = useState<Photo[]>(action?.photos || []);
  
  // Category-specific form data
  const [formData, setFormData] = useState({
    time: action ? new Date(action.time) : new Date(),
    duration: action?.duration?.toString() || '',
    notes: action?.notes || '',
    rating: action?.rating || 0,
    waitTime: action?.waitTime?.toString() || '',
    fastPass: false,
    mealType: action?.mealType || 'LUNCH' as const,
    reservationMade: false,
    partySize: '',
    purchaseAmount: action?.purchaseAmount?.toString() || '',
    purchasedItems: action?.purchasedItems?.join(', ') || '',
    performerNames: action?.performerNames?.join(', ') || '',
    showTime: action?.showTime || '',
    meetingDuration: '',
  });

  // Initialize step based on existing action
  useEffect(() => {
    if (action) {
      setCurrentStep(WizardStep.DETAILS);
      setSelectedCategory(action.category);
      setSelectedArea(action.area);
      setSelectedLocation(action.locationName);
    } else {
      setCurrentStep(WizardStep.CATEGORY);
      setSelectedArea(parkType === ParkType.LAND ? LandArea.FANTASYLAND : SeaArea.MEDITERRANEAN_HARBOR);
    }
  }, [action, parkType]);

  // Animation effects
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Step animation
  useEffect(() => {
    Animated.spring(stepAnimation, {
      toValue: currentStep,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Update progress
    Animated.timing(progressAnimation, {
      toValue: (currentStep + 1) / Object.keys(WizardStep).length * 2,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

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

  // Helper to get current form data in validation format
  const getCurrentFormData = (): Partial<ActionFormData> => ({
    category: selectedCategory,
    area: selectedArea,
    locationName: selectedLocation,
    time: formData.time,
    duration: formData.duration,
    notes: formData.notes,
    rating: formData.rating,
    waitTime: formData.waitTime,
    fastPass: formData.fastPass,
    mealType: formData.mealType,
    reservationMade: formData.reservationMade,
    partySize: formData.partySize,
    purchaseAmount: formData.purchaseAmount,
    purchasedItems: formData.purchasedItems,
    performerNames: formData.performerNames,
    showTime: formData.showTime,
    meetingDuration: formData.meetingDuration,
  });

  const validateCurrentStep = (): ValidationResult => {
    const validation = validateStep(currentStep, getCurrentFormData());
    setCurrentValidation(validation);
    setShowValidation(!validation.isValid || validation.warnings.length > 0);
    return validation;
  };

  const canProceedToNextStep = (): boolean => {
    const validation = validateCurrentStep();
    return validation.isValid;
  };

  const nextStep = () => {
    if (canProceedToNextStep() && currentStep < WizardStep.PHOTOS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > WizardStep.CATEGORY) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    // Final validation before saving
    const finalValidation = validateAction(getCurrentFormData(), visitDate);
    
    if (!finalValidation.isValid) {
      setCurrentValidation(finalValidation);
      setShowValidation(true);
      Alert.alert(
        'Validation Error',
        'Please fix the errors before saving:\n\n' + finalValidation.errors.join('\n'),
        [{ text: 'OK' }]
      );
      return;
    }

    // Show warnings if any
    if (finalValidation.warnings.length > 0) {
      Alert.alert(
        'Warning',
        'Please review the following warnings:\n\n' + finalValidation.warnings.join('\n'),
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Anyway', onPress: () => performSave() }
        ]
      );
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    setIsLoading(true);

    try {
      const actionData: any = {
        visitId,
        category: selectedCategory,
        area: selectedArea!,
        locationName: selectedLocation.trim(),
        time: formData.time,
        notes: formData.notes.trim() || undefined,
        photos: photos,
      };

      // Add optional fields
      if (formData.duration) {
        actionData.duration = parseInt(formData.duration);
      }
      if (formData.rating > 0) {
        actionData.rating = formData.rating as 1 | 2 | 3 | 4 | 5;
      }

      // Category-specific fields
      switch (selectedCategory) {
        case ActionCategory.ATTRACTION:
          if (formData.waitTime) {
            actionData.waitTime = parseInt(formData.waitTime);
          }
          break;

        case ActionCategory.RESTAURANT:
          actionData.mealType = formData.mealType;
          break;

        case ActionCategory.SHOPPING:
          if (formData.purchaseAmount) {
            actionData.purchaseAmount = parseFloat(formData.purchaseAmount);
          }
          if (formData.purchasedItems.trim()) {
            actionData.purchasedItems = formData.purchasedItems
              .split(',')
              .map(item => item.trim())
              .filter(item => item.length > 0);
          }
          break;

        case ActionCategory.SHOW:
        case ActionCategory.GREETING:
          if (formData.performerNames.trim()) {
            actionData.performerNames = formData.performerNames
              .split(',')
              .map(name => name.trim())
              .filter(name => name.length > 0);
          }
          if (formData.showTime.trim()) {
            actionData.showTime = formData.showTime.trim();
          }
          break;
      }

      await onSave(actionData);
      onClose();
    } catch (error) {
      console.error('Error saving action:', error);
      Alert.alert('Error', 'Failed to save action. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (locationName: string, preset?: PresetItem) => {
    setSelectedLocation(locationName);
    setSelectedPreset(preset || null);
    
    // Auto-detect area from preset
    if (preset && preset.area !== selectedArea) {
      setSelectedArea(preset.area);
    }
    
    // Re-validate when location changes
    if (currentStep === WizardStep.LOCATION) {
      setTimeout(() => validateCurrentStep(), 100);
    }
  };

  const handleCategorySelect = (category: ActionCategory) => {
    setSelectedCategory(category);
    
    // Re-validate when category changes
    if (currentStep === WizardStep.CATEGORY) {
      setTimeout(() => validateCurrentStep(), 100);
    }
  };

  const handleAreaSelect = (area: ParkArea) => {
    setSelectedArea(area);
    
    // Re-validate when area changes
    if (currentStep === WizardStep.AREA) {
      setTimeout(() => validateCurrentStep(), 100);
    }
  };

  const handleFormDataChange = (newData: Partial<typeof formData>) => {
    setFormData({ ...formData, ...newData });
    
    // Re-validate details step when form data changes
    if (currentStep === WizardStep.DETAILS) {
      setTimeout(() => validateCurrentStep(), 100);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: getCategoryColor(selectedCategory),
            width: progressAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <Text style={[styles.stepText, { color: theme.colors.text.secondary }]}>
        Step {currentStep + 1} of {Object.keys(WizardStep).length / 2}
      </Text>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        {STEP_TITLES[currentStep]}
      </Text>
    </View>
  );

  const renderCategoryStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: theme.colors.text.secondary }]}>
        What type of activity did you do?
      </Text>
      
      <View style={styles.categoryGrid}>
        {Object.values(ActionCategory).map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryCard,
              {
                backgroundColor: selectedCategory === category
                  ? getCategoryColor(category)
                  : theme.colors.background.elevated,
                borderColor: selectedCategory === category
                  ? getCategoryColor(category)
                  : theme.colors.border,
              },
            ]}
            onPress={() => handleCategorySelect(category)}
          >
            <Ionicons
              name={getCategoryIcon(category) as any}
              size={32}
              color={selectedCategory === category ? 'white' : getCategoryColor(category)}
            />
            <Text
              style={[
                styles.categoryText,
                {
                  color: selectedCategory === category
                    ? 'white'
                    : theme.colors.text.primary,
                },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAreaStep = () => (
    <AreaPicker
      parkType={parkType}
      selectedArea={selectedArea}
      onSelect={handleAreaSelect}
      style={styles.stepContent}
    />
  );

  const renderLocationStep = () => (
    <LocationSelector
      category={selectedCategory}
      parkType={parkType}
      selectedArea={selectedArea}
      selectedLocation={selectedLocation}
      onLocationSelect={handleLocationSelect}
      style={styles.stepContent}
    />
  );

  const renderDetailsStep = () => (
    <CategoryForm
      category={selectedCategory}
      formData={formData}
      onFormDataChange={handleFormDataChange}
      visitDate={visitDate}
      style={styles.stepContent}
    />
  );

  const renderPhotosStep = () => (
    <View style={styles.stepContent}>
      <PhotoManager
        photos={photos}
        onPhotosChange={setPhotos}
        maxPhotos={10}
      />
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.CATEGORY:
        return renderCategoryStep();
      case WizardStep.AREA:
        return renderAreaStep();
      case WizardStep.LOCATION:
        return renderLocationStep();
      case WizardStep.DETAILS:
        return renderDetailsStep();
      case WizardStep.PHOTOS:
        return renderPhotosStep();
      default:
        return null;
    }
  };

  const renderNavigation = () => (
    <View style={styles.navigation}>
      <TouchableOpacity
        style={[
          styles.navButton,
          styles.backButton,
          {
            backgroundColor: theme.colors.background.elevated,
            borderColor: theme.colors.border,
            opacity: currentStep === WizardStep.CATEGORY ? 0.5 : 1,
          },
        ]}
        onPress={prevStep}
        disabled={currentStep === WizardStep.CATEGORY}
      >
        <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
        <Text style={[styles.navButtonText, { color: theme.colors.text.primary }]}>
          Back
        </Text>
      </TouchableOpacity>

      {currentStep === WizardStep.PHOTOS ? (
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.saveButton,
            {
              backgroundColor: getCategoryColor(selectedCategory),
              opacity: isLoading ? 0.6 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : action ? 'Update' : 'Save'}
          </Text>
          <Ionicons name="checkmark" size={20} color="white" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            {
              backgroundColor: getCategoryColor(selectedCategory),
              opacity: canProceedToNextStep() ? 1 : 0.5,
            },
          ]}
          onPress={nextStep}
          disabled={!canProceedToNextStep()}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropAnimation,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnimation }],
          },
        ]}
      >
        <BlurView
          intensity={isDark ? 20 : 80}
          style={[
            styles.modal,
            {
              backgroundColor: isDark
                ? 'rgba(0, 0, 0, 0.85)'
                : 'rgba(255, 255, 255, 0.95)',
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
                
                <View style={styles.headerTitle}>
                  <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                    {action ? 'Edit Action' : 'New Action'}
                  </Text>
                  {renderStepIndicator()}
                </View>

                <View style={styles.headerSpacer} />
              </View>
              
              {renderProgressBar()}
            </View>

            {/* Content */}
            <Animated.View
              style={[
                styles.content,
                {
                  transform: [
                    {
                      translateX: stepAnimation.interpolate({
                        inputRange: [0, 1, 2, 3, 4],
                        outputRange: [0, -width, -width * 2, -width * 3, -width * 4],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.step, { width }]}>
                {/* Validation Feedback */}
                {showValidation && currentValidation && (
                  <ValidationFeedback
                    validation={currentValidation}
                    onDismiss={() => setShowValidation(false)}
                    style={styles.validationFeedback}
                  />
                )}
                
                {renderStepContent()}
              </View>
            </Animated.View>

            {/* Navigation */}
            {renderNavigation()}
          </KeyboardAvoidingView>
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    maxHeight: height * 0.92,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: spacing[3],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing[5],
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  stepIndicator: {
    alignItems: 'center',
    marginTop: spacing[2],
  },
  stepText: {
    fontSize: 12,
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing[1],
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  step: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: spacing[5],
  },
  stepDescription: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    padding: spacing[4],
    marginBottom: spacing[3],
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing[2],
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing[5],
    paddingTop: spacing[3],
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    minWidth: 100,
    justifyContent: 'center',
  },
  backButton: {
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: spacing[1],
  },
  nextButton: {
    backgroundColor: colors.purple[500],
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: spacing[1],
  },
  saveButton: {},
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: spacing[1],
  },
  validationFeedback: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
});