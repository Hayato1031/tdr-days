/**
 * Data Migration Service
 * Handles export and import of user data for device migration
 */

import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { storage, STORAGE_KEYS } from './storage';
import { Visit, Companion, TimelineAction, Photo } from '../types/models';

export interface ExportData {
  version: string;
  exportDate: string;
  visits: Omit<Visit, 'totalPhotoCount'>[];
  companions: Companion[];
  actions: Array<Omit<TimelineAction, 'photos'> & { photoCount: number }>;
  metadata: {
    totalVisits: number;
    totalActions: number;
    totalCompanions: number;
    exportedPhotos: number;
    note: string;
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedData?: {
    visits: number;
    companions: number;
    actions: number;
  };
  errors?: string[];
}

class DataMigrationService {
  private static instance: DataMigrationService;

  private constructor() {}

  static getInstance(): DataMigrationService {
    if (!DataMigrationService.instance) {
      DataMigrationService.instance = new DataMigrationService();
    }
    return DataMigrationService.instance;
  }

  /**
   * Export all user data to JSON format
   */
  async exportData(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Get all data from storage
      const [visits, companions, actions] = await Promise.all([
        storage.getAll<Visit>(STORAGE_KEYS.VISITS),
        storage.getAll<Companion>(STORAGE_KEYS.COMPANIONS),
        storage.getAll<TimelineAction>(STORAGE_KEYS.ACTIONS),
      ]);

      // Remove photos from actions and count them
      let totalPhotos = 0;
      const sanitizedActions = actions.map(action => {
        const photoCount = action.photos.length;
        totalPhotos += photoCount;
        
        const { photos, ...actionWithoutPhotos } = action;
        return {
          ...actionWithoutPhotos,
          photoCount
        };
      });

      // Remove photo count from visits
      const sanitizedVisits = visits.map(visit => {
        const { totalPhotoCount, ...visitWithoutPhotoCount } = visit;
        return visitWithoutPhotoCount;
      });

      // Create export data structure
      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        visits: sanitizedVisits,
        companions,
        actions: sanitizedActions,
        metadata: {
          totalVisits: visits.length,
          totalActions: actions.length,
          totalCompanions: companions.length,
          exportedPhotos: totalPhotos,
          note: 'Photos are not included in this export. Only visit records, companions, and action data are exported.'
        }
      };

      // Create file name with timestamp
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `TDR_Days_Export_${timestamp}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      // Write to file
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export TDR Days Data'
        });
      }

      return {
        success: true,
        filePath
      };
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Import data from JSON file
   */
  async importData(): Promise<ImportResult> {
    try {
      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return {
          success: false,
          message: 'Import cancelled'
        };
      }

      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const importData: ExportData = JSON.parse(fileContent);

      // Validate import data structure
      const validationResult = this.validateImportData(importData);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Invalid file format',
          errors: validationResult.errors
        };
      }

      // Clear existing data
      await Promise.all([
        storage.clear(STORAGE_KEYS.VISITS),
        storage.clear(STORAGE_KEYS.COMPANIONS),
        storage.clear(STORAGE_KEYS.ACTIONS)
      ]);

      // Import companions first (needed for visit relationships)
      for (const companion of importData.companions) {
        await storage.create(STORAGE_KEYS.COMPANIONS, companion);
      }

      // Import visits
      for (const visit of importData.visits) {
        await storage.create(STORAGE_KEYS.VISITS, visit);
      }

      // Import actions (restore empty photos array)
      for (const action of importData.actions) {
        const { photoCount, ...actionData } = action;
        const fullAction = {
          ...actionData,
          photos: [] as Photo[] // Photos are not imported
        };
        await storage.create(STORAGE_KEYS.ACTIONS, fullAction);
      }

      return {
        success: true,
        message: 'Data imported successfully',
        importedData: {
          visits: importData.visits.length,
          companions: importData.companions.length,
          actions: importData.actions.length
        }
      };
    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Import failed'
      };
    }
  }

  /**
   * Validate import data structure
   */
  private validateImportData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Invalid JSON structure');
      return { isValid: false, errors };
    }

    if (!data.version) {
      errors.push('Missing version information');
    }

    if (!Array.isArray(data.visits)) {
      errors.push('Invalid visits data');
    }

    if (!Array.isArray(data.companions)) {
      errors.push('Invalid companions data');
    }

    if (!Array.isArray(data.actions)) {
      errors.push('Invalid actions data');
    }

    if (!data.metadata) {
      errors.push('Missing metadata');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get export preview (data counts)
   */
  async getExportPreview(): Promise<{
    visits: number;
    companions: number;
    actions: number;
    totalPhotos: number;
  }> {
    try {
      const [visits, companions, actions] = await Promise.all([
        storage.getAll<Visit>(STORAGE_KEYS.VISITS),
        storage.getAll<Companion>(STORAGE_KEYS.COMPANIONS),
        storage.getAll<TimelineAction>(STORAGE_KEYS.ACTIONS),
      ]);

      const totalPhotos = actions.reduce((total, action) => total + action.photos.length, 0);

      return {
        visits: visits.length,
        companions: companions.length,
        actions: actions.length,
        totalPhotos
      };
    } catch (error) {
      console.error('Preview error:', error);
      return {
        visits: 0,
        companions: 0,
        actions: 0,
        totalPhotos: 0
      };
    }
  }
}

export const dataMigrationService = DataMigrationService.getInstance();