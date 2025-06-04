import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';
import { Companion } from '../types/models';

interface CompanionManagerModalProps {
  visible: boolean;
  onClose: () => void;
  companions: Companion[];
  onCompanionCreate: (name: string) => Promise<void>;
  onCompanionDelete: (companionId: string) => Promise<void>;
  onCompanionUpdate: (companionId: string, name: string) => Promise<void>;
}

export const CompanionManagerModal: React.FC<CompanionManagerModalProps> = ({
  visible,
  onClose,
  companions,
  onCompanionCreate,
  onCompanionDelete,
  onCompanionUpdate,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme.mode === 'dark';
  const [newCompanionName, setNewCompanionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCompanion, setEditingCompanion] = useState<Companion | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddCompanion = async () => {
    if (!newCompanionName.trim()) {
      Alert.alert(
        language === 'ja' ? 'エラー' : 'Error',
        language === 'ja' ? '名前を入力してください' : 'Please enter a name'
      );
      return;
    }

    setIsCreating(true);
    try {
      await onCompanionCreate(newCompanionName.trim());
      setNewCompanionName('');
      setShowAddForm(false);
    } catch (error) {
      Alert.alert(
        language === 'ja' ? 'エラー' : 'Error',
        language === 'ja' ? '同行者の追加に失敗しました' : 'Failed to add companion'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCompanion = (companion: Companion) => {
    Alert.alert(
      language === 'ja' ? '同行者を削除' : 'Delete Companion',
      language === 'ja' 
        ? `${companion.name}を削除しますか？` 
        : `Delete ${companion.name}?`,
      [
        {
          text: language === 'ja' ? 'キャンセル' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'ja' ? '削除' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onCompanionDelete(companion.id);
            } catch (error) {
              Alert.alert(
                language === 'ja' ? 'エラー' : 'Error',
                language === 'ja' ? '削除に失敗しました' : 'Failed to delete'
              );
            }
          },
        },
      ]
    );
  };

  const handleEditStart = (companion: Companion) => {
    setEditingCompanion(companion);
    setEditName(companion.name);
  };

  const handleEditCancel = () => {
    setEditingCompanion(null);
    setEditName('');
  };

  const handleEditSave = async () => {
    if (!editingCompanion || !editName.trim()) {
      Alert.alert(
        language === 'ja' ? 'エラー' : 'Error',
        language === 'ja' ? '名前を入力してください' : 'Please enter a name'
      );
      return;
    }

    try {
      await onCompanionUpdate(editingCompanion.id, editName.trim());
      handleEditCancel();
    } catch (error) {
      Alert.alert(
        language === 'ja' ? 'エラー' : 'Error',
        language === 'ja' ? '更新に失敗しました' : 'Failed to update'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.container}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[
              styles.modal,
              {
                backgroundColor: isDark ? theme.colors.background.card : colors.utility.white,
              }
            ]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                  {language === 'ja' ? '同行者管理' : 'Manage Companions'}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Add New Companion Button/Form */}
                {!showAddForm ? (
                  <TouchableOpacity
                    style={[styles.addButton, { borderColor: colors.purple[500] }]}
                    onPress={() => setShowAddForm(true)}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={colors.purple[500]} />
                    <Text style={[styles.addButtonText, { color: colors.purple[500] }]}>
                      {language === 'ja' ? '同行者を追加' : 'Add Companion'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.addForm, { backgroundColor: colors.purple[50] }]}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? theme.colors.background.secondary : colors.utility.white,
                          color: theme.colors.text.primary,
                        }
                      ]}
                      placeholder={language === 'ja' ? '名前を入力' : 'Enter name'}
                      placeholderTextColor={theme.colors.text.secondary}
                      value={newCompanionName}
                      onChangeText={setNewCompanionName}
                      maxLength={50}
                      autoFocus
                    />
                    <View style={styles.addFormButtons}>
                      <TouchableOpacity
                        style={[styles.formButton, styles.cancelButton]}
                        onPress={() => {
                          setShowAddForm(false);
                          setNewCompanionName('');
                        }}
                      >
                        <Text style={[styles.formButtonText, { color: theme.colors.text.secondary }]}>
                          {language === 'ja' ? 'キャンセル' : 'Cancel'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.formButton,
                          styles.confirmButton,
                          { backgroundColor: colors.purple[500] }
                        ]}
                        onPress={handleAddCompanion}
                        disabled={isCreating}
                      >
                        <Text style={[styles.formButtonText, { color: colors.utility.white }]}>
                          {isCreating 
                            ? (language === 'ja' ? '追加中...' : 'Adding...')
                            : (language === 'ja' ? '追加' : 'Add')
                          }
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Companions List */}
                <View style={styles.companionsList}>
                  {companions.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="people-outline" size={48} color={theme.colors.text.secondary} />
                      <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                        {language === 'ja' 
                          ? 'まだ同行者が登録されていません' 
                          : 'No companions registered yet'
                        }
                      </Text>
                    </View>
                  ) : (
                    companions.map((companion) => (
                      <View
                        key={companion.id}
                        style={[
                          styles.companionItem,
                          {
                            backgroundColor: isDark 
                              ? theme.colors.background.secondary 
                              : colors.background.tertiary,
                          }
                        ]}
                      >
                        {editingCompanion?.id === companion.id ? (
                          // Edit Mode
                          <>
                            <TextInput
                              style={[
                                styles.editInput,
                                {
                                  backgroundColor: isDark ? theme.colors.background.primary : colors.utility.white,
                                  color: theme.colors.text.primary,
                                }
                              ]}
                              value={editName}
                              onChangeText={setEditName}
                              autoFocus
                              maxLength={50}
                            />
                            <View style={styles.editActions}>
                              <TouchableOpacity
                                onPress={handleEditCancel}
                                style={styles.editButton}
                              >
                                <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={handleEditSave}
                                style={styles.editButton}
                              >
                                <Ionicons name="checkmark" size={20} color={colors.purple[500]} />
                              </TouchableOpacity>
                            </View>
                          </>
                        ) : (
                          // Normal Mode
                          <>
                            <View style={styles.companionInfo}>
                              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.purple[100] }]}>
                                <Ionicons name="person" size={20} color={colors.purple[500]} />
                              </View>
                              <Text style={[styles.companionName, { color: theme.colors.text.primary }]}>
                                {companion.name}
                              </Text>
                            </View>
                            <View style={styles.actionButtons}>
                              <TouchableOpacity
                                onPress={() => handleEditStart(companion)}
                                style={styles.actionButton}
                              >
                                <Ionicons name="pencil" size={18} color={colors.purple[500]} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDeleteCompanion(companion)}
                                style={styles.actionButton}
                              >
                                <Ionicons name="trash-outline" size={18} color={colors.semantic.error.main} />
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: 320,
    maxHeight: 600,
    borderRadius: borderRadius['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.utility.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: spacing[2],
  },
  content: {
    padding: spacing[6],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addForm: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
  },
  input: {
    padding: spacing[3],
    borderRadius: borderRadius.md,
    fontSize: 16,
    marginBottom: spacing[3],
  },
  addFormButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  formButton: {
    flex: 1,
    padding: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  confirmButton: {},
  formButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  companionsList: {
    gap: spacing[3],
  },
  companionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
  companionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    padding: spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    gap: spacing[3],
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  editInput: {
    flex: 1,
    padding: spacing[2],
    marginRight: spacing[2],
    borderRadius: borderRadius.md,
    fontSize: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  editButton: {
    padding: spacing[2],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    padding: spacing[2],
  },
});