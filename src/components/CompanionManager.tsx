import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { Companion } from '../types/models';

const { width } = Dimensions.get('window');

interface CompanionManagerProps {
  companions: Companion[];
  selectedCompanionIds: string[];
  onCompanionToggle: (companionId: string) => void;
  onCompanionCreate: (name: string) => Promise<void>;
  onCompanionDelete?: (companionId: string) => Promise<void>;
  isCreating?: boolean;
}

export const CompanionManager: React.FC<CompanionManagerProps> = ({
  companions,
  selectedCompanionIds,
  onCompanionToggle,
  onCompanionCreate,
  onCompanionDelete,
  isCreating = false,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme.mode === 'dark';
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanionName, setNewCompanionName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(new Map<string, Animated.Value>()).current;

  // Initialize scale animations for companions
  React.useEffect(() => {
    companions.forEach(companion => {
      if (!scaleAnims.has(companion.id)) {
        scaleAnims.set(companion.id, new Animated.Value(1));
      }
    });
  }, [companions]);

  const toggleAddForm = () => {
    if (showAddForm) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowAddForm(false);
        setNewCompanionName('');
      });
    } else {
      setShowAddForm(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleAddCompanion = async () => {
    if (!newCompanionName.trim()) {
      Alert.alert(
        language === 'ja' ? 'エラー' : 'Error',
        language === 'ja' ? '同行者の名前を入力してください' : 'Please enter a companion name'
      );
      return;
    }

    setIsAdding(true);
    try {
      await onCompanionCreate(newCompanionName.trim());
      setNewCompanionName('');
      toggleAddForm();
    } catch (error) {
      Alert.alert(
        language === 'ja' ? 'エラー' : 'Error',
        language === 'ja' ? '同行者の追加に失敗しました' : 'Failed to add companion'
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleCompanionToggle = (companionId: string) => {
    const scaleAnim = scaleAnims.get(companionId);
    if (scaleAnim) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
      ]).start();
    }
    onCompanionToggle(companionId);
  };

  const handleDeleteCompanion = (companion: Companion) => {
    Alert.alert(
      'Delete Companion',
      `Are you sure you want to delete "${companion.name}"? This will remove them from all visits.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (onCompanionDelete) {
              try {
                await onCompanionDelete(companion.id);
              } catch (error) {
                Alert.alert('Error', 'Failed to delete companion');
              }
            }
          },
        },
      ]
    );
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7b8', '#96ceb4', '#feca57',
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
      '#10ac84', '#ee5a6f', '#c44569', '#f8b500', '#778beb',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const renderCompanionItem = ({ item: companion }: { item: Companion }) => {
    const isSelected = selectedCompanionIds.includes(companion.id);
    const scaleAnim = scaleAnims.get(companion.id) || new Animated.Value(1);
    const avatarColor = getAvatarColor(companion.name);

    return (
      <Animated.View
        style={[
          styles.companionItemContainer,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleCompanionToggle(companion.id)}
          style={[
            styles.companionItem,
            {
              backgroundColor: isDark
                ? isSelected
                  ? 'rgba(147, 51, 234, 0.3)'
                  : theme.colors.background.secondary
                : isSelected
                ? 'rgba(147, 51, 234, 0.1)'
                : theme.colors.background.elevated,
            },
          ]}
        >
          <LinearGradient
            colors={
              isSelected
                ? ['rgba(147, 51, 234, 0.2)', 'rgba(168, 85, 247, 0.1)']
                : ['transparent', 'transparent']
            }
            style={styles.companionGradient}
          >
            <View style={styles.companionContent}>
              {/* Avatar */}
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: isSelected ? colors.purple[500] : avatarColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    {
                      color: isSelected
                        ? colors.utility.white
                        : colors.text.primary,
                    },
                  ]}
                >
                  {companion.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Name and Details */}
              <View style={styles.companionInfo}>
                <Text
                  style={[
                    styles.companionName,
                    {
                      color: isSelected
                        ? colors.purple[600]
                        : theme.colors.text.primary,
                      fontWeight: isSelected ? '600' : '500',
                    },
                  ]}
                >
                  {companion.name}
                </Text>
                {companion.visitIds.length > 0 && (
                  <Text
                    style={[
                      styles.visitCount,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    {companion.visitIds.length} visit{companion.visitIds.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>

              {/* Selection Indicator */}
              <View style={styles.selectionArea}>
                {isSelected ? (
                  <View style={styles.selectedIndicator}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.purple[500]}
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.unselectedIndicator,
                      {
                        borderColor: theme.colors.text.secondary,
                      },
                    ]}
                  />
                )}
              </View>

              {/* Delete Button */}
              {onCompanionDelete && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCompanion(companion)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={theme.colors.text.secondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          {language === 'ja' ? '一緒に行く人は？' : 'Who are you going with?'}
        </Text>
        <TouchableOpacity
          onPress={toggleAddForm}
          style={[
            styles.addButton,
            {
              backgroundColor: colors.purple[500],
            },
          ]}
          disabled={isCreating}
        >
          <Ionicons
            name={showAddForm ? 'close' : 'add'}
            size={20}
            color={colors.utility.white}
          />
        </TouchableOpacity>
      </View>

      {/* Add Form */}
      {showAddForm && (
        <Animated.View
          style={[
            styles.addFormContainer,
            {
              opacity: slideAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <BlurView
            intensity={60}
            style={[
              styles.addFormBlur,
              {
                backgroundColor: isDark
                  ? 'rgba(30, 30, 30, 0.8)'
                  : 'rgba(255, 255, 255, 0.8)',
              },
            ]}
          >
            <LinearGradient
              colors={[
                'rgba(147, 51, 234, 0.1)',
                'rgba(168, 85, 247, 0.05)',
              ]}
              style={styles.addFormGradient}
            >
              <View style={styles.addFormContent}>
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      color: theme.colors.text.primary,
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  placeholder={language === 'ja' ? '一緒に行く人の名前を入力' : 'Enter companion name'}
                  placeholderTextColor={theme.colors.text.secondary}
                  value={newCompanionName}
                  onChangeText={setNewCompanionName}
                  autoFocus
                  maxLength={50}
                />
                
                <View style={styles.addFormActions}>
                  <TouchableOpacity
                    onPress={toggleAddForm}
                    style={[
                      styles.formButton,
                      styles.cancelButton,
                      {
                        backgroundColor: theme.colors.background.secondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.formButtonText,
                        { color: theme.colors.text.secondary },
                      ]}
                    >
                      {language === 'ja' ? 'キャンセル' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleAddCompanion}
                    disabled={isAdding || !newCompanionName.trim()}
                    style={[
                      styles.formButton,
                      styles.saveButton,
                      {
                        backgroundColor: colors.purple[500],
                        opacity: isAdding || !newCompanionName.trim() ? 0.5 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.formButtonText,
                        { color: colors.utility.white },
                      ]}
                    >
                      {isAdding 
                        ? (language === 'ja' ? '追加中...' : 'Adding...') 
                        : (language === 'ja' ? '追加' : 'Add')
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      )}

      {/* Companions List */}
      {companions.length > 0 ? (
        <View style={styles.listContainer}>
          {companions.map((companion, index) => (
            <View key={companion.id}>
              {renderCompanionItem({ item: companion, index })}
              {index < companions.length - 1 && <View style={{ height: spacing[3] }} />}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="people-outline"
            size={48}
            color={theme.colors.text.secondary}
          />
          <Text
            style={[
              styles.emptyStateText,
              { color: theme.colors.text.secondary },
            ]}
          >
            {language === 'ja' ? '同行者がまだいません' : 'No companions yet'}
          </Text>
          <Text
            style={[
              styles.emptyStateSubtext,
              { color: theme.colors.text.secondary },
            ]}
          >
            {language === 'ja' ? '一緒に行った友達や家族を追加しましょう' : 'Add friends or family members you went with'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[6],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFormContainer: {
    marginBottom: spacing[4],
  },
  addFormBlur: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  addFormGradient: {
    padding: spacing[4],
  },
  addFormContent: {
    gap: spacing[3],
  },
  nameInput: {
    fontSize: 16,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  addFormActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  formButton: {
    flex: 1,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cancelButton: {},
  saveButton: {},
  formButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: spacing[4],
  },
  companionItemContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  companionItem: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  companionGradient: {
    padding: spacing[4],
  },
  companionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  companionInfo: {
    flex: 1,
  },
  companionName: {
    fontSize: 16,
    marginBottom: spacing[1],
  },
  visitCount: {
    fontSize: 14,
  },
  selectionArea: {
    marginRight: spacing[2],
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  deleteButton: {
    padding: spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    gap: spacing[3],
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing[4],
  },
});