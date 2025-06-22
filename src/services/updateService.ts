import * as Updates from 'expo-updates';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UpdateCheckData {
  lastCheckedDate: string | null;
  lastSkippedVersion: string | null;
}

const UPDATE_CHECK_KEY = '@TDRDays:updateCheck';
const HOURS_BETWEEN_CHECKS = 24; // Check for updates every 24 hours

class UpdateService {
  private async getUpdateCheckData(): Promise<UpdateCheckData> {
    try {
      const data = await AsyncStorage.getItem(UPDATE_CHECK_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading update check data:', error);
    }
    
    return {
      lastCheckedDate: null,
      lastSkippedVersion: null,
    };
  }

  private async saveUpdateCheckData(data: UpdateCheckData): Promise<void> {
    try {
      await AsyncStorage.setItem(UPDATE_CHECK_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving update check data:', error);
    }
  }

  async checkForUpdates(force: boolean = false): Promise<void> {
    try {
      // Skip update checks in development/Expo Go
      if (!Updates.isEnabled) {
        console.log('Updates are not enabled in this build (development or Expo Go)');
        return;
      }

      const data = await this.getUpdateCheckData();
      
      // Check if enough time has passed since last check
      if (!force && data.lastCheckedDate) {
        const lastDate = new Date(data.lastCheckedDate);
        const hoursSinceLastCheck = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastCheck < HOURS_BETWEEN_CHECKS) {
          return;
        }
      }

      console.log('Checking for updates...');
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        const currentVersion = Updates.runtimeVersion || '1.0.0';
        
        // Don't show update notification for skipped versions
        if (data.lastSkippedVersion === currentVersion) {
          return;
        }

        Alert.alert(
          'アップデートが利用可能です',
          'アプリの新しいバージョンが利用可能です。今すぐアップデートしますか？',
          [
            {
              text: 'スキップ',
              style: 'cancel',
              onPress: async () => {
                const updateData = await this.getUpdateCheckData();
                updateData.lastSkippedVersion = currentVersion;
                await this.saveUpdateCheckData(updateData);
              },
            },
            {
              text: 'アップデート',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  Alert.alert(
                    'アップデート完了',
                    'アップデートが完了しました。アプリを再起動します。',
                    [
                      {
                        text: 'OK',
                        onPress: () => Updates.reloadAsync(),
                      },
                    ]
                  );
                } catch (error) {
                  console.error('Update failed:', error);
                  Alert.alert(
                    'アップデートエラー',
                    'アップデートに失敗しました。後でもう一度お試しください。'
                  );
                }
              },
            },
          ]
        );
      }
      
      // Update last checked date
      data.lastCheckedDate = new Date().toISOString();
      await this.saveUpdateCheckData(data);
      
    } catch (error) {
      // Silently ignore update errors in development/Expo Go
      if (error instanceof Error && error.message.includes('Expo Go')) {
        console.log('Update check skipped in Expo Go');
        return;
      }
      console.error('Error checking for updates:', error);
    }
  }
}

export const updateService = new UpdateService();