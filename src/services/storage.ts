/**
 * AsyncStorage wrapper with type safety and error handling
 * Supports future Rails backend sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaseModel, DataMigration, AppMetadata } from '../types/models';

// Storage key prefixes
const STORAGE_KEYS = {
  VISITS: '@tdr_days:visits',
  ACTIONS: '@tdr_days:actions',
  COMPANIONS: '@tdr_days:companions',
  METADATA: '@tdr_days:metadata',
  MIGRATIONS: '@tdr_days:migrations',
} as const;

// Error types
export class StorageError extends Error {
  constructor(message: string, public code: string, public originalError?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

// Storage service class
export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Generic CRUD operations
  async get<T extends BaseModel>(key: string, id: string): Promise<T | null> {
    try {
      const data = await this.getAll<T>(key);
      return data.find(item => item.id === id) || null;
    } catch (error) {
      throw new StorageError(
        `Failed to get item with id: ${id}`,
        'GET_ERROR',
        error as Error
      );
    }
  }

  async getAll<T extends BaseModel>(key: string): Promise<T[]> {
    try {
      const jsonData = await AsyncStorage.getItem(key);
      if (!jsonData) return [];
      
      const data = JSON.parse(jsonData);
      // Convert date strings back to Date objects
      return this.deserializeDates(data);
    } catch (error) {
      throw new StorageError(
        'Failed to get all items',
        'GET_ALL_ERROR',
        error as Error
      );
    }
  }

  async create<T extends BaseModel>(
    key: string,
    item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<T> {
    try {
      const now = new Date();
      const newItem = {
        ...item,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now,
      } as T;

      const data = await this.getAll<T>(key);
      data.push(newItem);
      await this.saveAll(key, data);

      return newItem;
    } catch (error) {
      throw new StorageError(
        'Failed to create item',
        'CREATE_ERROR',
        error as Error
      );
    }
  }

  async update<T extends BaseModel>(
    key: string,
    id: string,
    updates: Partial<Omit<T, 'id' | 'createdAt'>>
  ): Promise<T | null> {
    try {
      const data = await this.getAll<T>(key);
      const index = data.findIndex(item => item.id === id);
      
      if (index === -1) return null;

      const updatedItem = {
        ...data[index],
        ...updates,
        updatedAt: new Date(),
      } as T;

      data[index] = updatedItem;
      await this.saveAll(key, data);

      return updatedItem;
    } catch (error) {
      throw new StorageError(
        `Failed to update item with id: ${id}`,
        'UPDATE_ERROR',
        error as Error
      );
    }
  }

  async delete<T extends BaseModel>(key: string, id: string): Promise<boolean> {
    try {
      const data = await this.getAll<T>(key);
      const filteredData = data.filter(item => item.id !== id);
      
      if (data.length === filteredData.length) return false;

      await this.saveAll(key, filteredData);
      return true;
    } catch (error) {
      throw new StorageError(
        `Failed to delete item with id: ${id}`,
        'DELETE_ERROR',
        error as Error
      );
    }
  }

  // Batch operations
  async createMany<T extends BaseModel>(
    key: string,
    items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<T[]> {
    try {
      const now = new Date();
      const newItems = items.map(item => ({
        ...item,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now,
      })) as T[];

      const data = await this.getAll<T>(key);
      data.push(...newItems);
      await this.saveAll(key, data);

      return newItems;
    } catch (error) {
      throw new StorageError(
        'Failed to create multiple items',
        'CREATE_MANY_ERROR',
        error as Error
      );
    }
  }

  async updateMany<T extends BaseModel>(
    key: string,
    updates: Array<{ id: string; data: Partial<Omit<T, 'id' | 'createdAt'>> }>
  ): Promise<T[]> {
    try {
      const data = await this.getAll<T>(key);
      const updatedItems: T[] = [];
      const now = new Date();

      updates.forEach(({ id, data: updateData }) => {
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
          data[index] = {
            ...data[index],
            ...updateData,
            updatedAt: now,
          } as T;
          updatedItems.push(data[index]);
        }
      });

      await this.saveAll(key, data);
      return updatedItems;
    } catch (error) {
      throw new StorageError(
        'Failed to update multiple items',
        'UPDATE_MANY_ERROR',
        error as Error
      );
    }
  }

  async deleteMany<T extends BaseModel>(key: string, ids: string[]): Promise<number> {
    try {
      const data = await this.getAll<T>(key);
      const originalLength = data.length;
      const filteredData = data.filter(item => !ids.includes(item.id));
      
      await this.saveAll(key, filteredData);
      return originalLength - filteredData.length;
    } catch (error) {
      throw new StorageError(
        'Failed to delete multiple items',
        'DELETE_MANY_ERROR',
        error as Error
      );
    }
  }

  // Query operations
  async find<T extends BaseModel>(
    key: string,
    predicate: (item: T) => boolean
  ): Promise<T[]> {
    try {
      const data = await this.getAll<T>(key);
      return data.filter(predicate);
    } catch (error) {
      throw new StorageError(
        'Failed to find items',
        'FIND_ERROR',
        error as Error
      );
    }
  }

  async findOne<T extends BaseModel>(
    key: string,
    predicate: (item: T) => boolean
  ): Promise<T | null> {
    try {
      const data = await this.getAll<T>(key);
      return data.find(predicate) || null;
    } catch (error) {
      throw new StorageError(
        'Failed to find item',
        'FIND_ONE_ERROR',
        error as Error
      );
    }
  }

  // Clear operations
  async clear(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      throw new StorageError(
        `Failed to clear storage for key: ${key}`,
        'CLEAR_ERROR',
        error as Error
      );
    }
  }

  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      throw new StorageError(
        'Failed to clear all storage',
        'CLEAR_ALL_ERROR',
        error as Error
      );
    }
  }

  // Migration support
  async getDataVersion(): Promise<number> {
    try {
      const metadata = await this.getMetadata();
      return metadata?.dataVersion || 1;
    } catch (error) {
      return 1;
    }
  }

  async setDataVersion(version: number): Promise<void> {
    try {
      const metadata = await this.getMetadata();
      if (metadata) {
        await this.update(STORAGE_KEYS.METADATA, metadata.id, { dataVersion: version });
      } else {
        await this.create(STORAGE_KEYS.METADATA, {
          dataVersion: version,
          settings: {},
        } as Omit<AppMetadata, 'id' | 'createdAt' | 'updatedAt'>);
      }
    } catch (error) {
      throw new StorageError(
        'Failed to set data version',
        'SET_VERSION_ERROR',
        error as Error
      );
    }
  }

  async getMigrations(): Promise<DataMigration[]> {
    try {
      const jsonData = await AsyncStorage.getItem(STORAGE_KEYS.MIGRATIONS);
      if (!jsonData) return [];
      return JSON.parse(jsonData);
    } catch (error) {
      throw new StorageError(
        'Failed to get migrations',
        'GET_MIGRATIONS_ERROR',
        error as Error
      );
    }
  }

  async addMigration(migration: DataMigration): Promise<void> {
    try {
      const migrations = await this.getMigrations();
      migrations.push(migration);
      await AsyncStorage.setItem(STORAGE_KEYS.MIGRATIONS, JSON.stringify(migrations));
    } catch (error) {
      throw new StorageError(
        'Failed to add migration',
        'ADD_MIGRATION_ERROR',
        error as Error
      );
    }
  }

  // Export/Import support for future sync
  async exportData(): Promise<Record<string, any>> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      const data: Record<string, any> = {};

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      }

      return data;
    } catch (error) {
      throw new StorageError(
        'Failed to export data',
        'EXPORT_ERROR',
        error as Error
      );
    }
  }

  async importData(data: Record<string, any>): Promise<void> {
    try {
      const entries = Object.entries(data).map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(entries);
    } catch (error) {
      throw new StorageError(
        'Failed to import data',
        'IMPORT_ERROR',
        error as Error
      );
    }
  }

  // Private helper methods
  private async saveAll<T>(key: string, data: T[]): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonData);
    } catch (error) {
      throw new StorageError(
        'Failed to save data',
        'SAVE_ERROR',
        error as Error
      );
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getMetadata(): Promise<AppMetadata | null> {
    const metadataList = await this.getAll<AppMetadata>(STORAGE_KEYS.METADATA);
    return metadataList[0] || null;
  }

  private deserializeDates<T>(data: T[]): T[] {
    return data.map(item => {
      const newItem = { ...item };
      
      // List of fields that should be converted to Date
      const dateFields = ['createdAt', 'updatedAt', 'syncedAt', 'date', 'time', 'startTime', 'endTime', 'takenAt', 'lastVisitDate'];
      
      Object.keys(newItem as any).forEach(key => {
        if (dateFields.includes(key) && (newItem as any)[key]) {
          (newItem as any)[key] = new Date((newItem as any)[key]);
        }
      });

      return newItem;
    });
  }
}

// Export singleton instance
export const storage = StorageService.getInstance();

// Export storage keys for direct access if needed
export { STORAGE_KEYS };