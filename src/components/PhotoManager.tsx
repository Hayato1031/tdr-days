import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { spacing, borderRadius } from '../styles/theme';

interface PhotoManagerProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 10,
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('写真の上限', `最大${maxPhotos}枚まで追加できます`);
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('権限が必要です', 'フォトライブラリへのアクセス権限が必要です');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: Math.min(maxPhotos - photos.length, 5),
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        onPhotosChange([...photos, ...newPhotos]);
      }
    } catch (error) {
      Alert.alert('エラー', '写真の選択に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('写真の上限', `最大${maxPhotos}枚まで追加できます`);
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('権限が必要です', 'カメラへのアクセス権限が必要です');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newPhoto = result.assets[0].uri;
        onPhotosChange([...photos, newPhoto]);
      }
    } catch (error) {
      Alert.alert('エラー', '写真の撮影に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const showPhotoOptions = () => {
    Alert.alert(
      '写真を追加',
      '写真の追加方法を選択してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'カメラで撮影', onPress: takePhoto },
        { text: 'ライブラリから選択', onPress: pickImage },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Photo Grid */}
      {photos.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.photosContainer}
          contentContainerStyle={styles.photosContent}
        >
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={20} color={colors.red[500]} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add Photo Button */}
      {photos.length < maxPhotos && (
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.border,
              opacity: isLoading ? 0.5 : 1,
            }
          ]}
          onPress={showPhotoOptions}
          disabled={isLoading}
        >
          <Ionicons 
            name="camera-outline" 
            size={24} 
            color={theme.colors.text.secondary} 
          />
          <Text style={[styles.addButtonText, { color: theme.colors.text.secondary }]}>
            {photos.length === 0 ? '写真を追加' : '写真を追加'}
          </Text>
          <Text style={[styles.addButtonSubtext, { color: theme.colors.text.secondary }]}>
            ({photos.length}/{maxPhotos})
          </Text>
        </TouchableOpacity>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>
            写真でアクションの思い出を残しましょう
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 100,
  },
  photosContainer: {
    marginBottom: spacing[3],
  },
  photosContent: {
    paddingRight: spacing[2],
  },
  photoItem: {
    position: 'relative',
    marginRight: spacing[2],
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  addButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing[2],
  },
  addButtonSubtext: {
    fontSize: 12,
    marginTop: spacing[1],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
});