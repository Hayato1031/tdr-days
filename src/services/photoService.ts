// import * as ImageManipulator from 'expo-image-manipulator'; // Removed dependency
import * as FileSystem from 'expo-file-system';
// import * as MediaLibrary from 'expo-media-library'; // Removed dependency
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Photo-related types
export interface PhotoMetadata {
  id: string;
  uri: string;
  thumbnailUri?: string;
  width: number;
  height: number;
  takenAt: Date;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  exif?: {
    make?: string;
    model?: string;
    iso?: number;
    aperture?: number;
    exposureTime?: number;
    focalLength?: number;
    flash?: boolean;
    orientation?: number;
  };
  size: number; // File size in bytes
  mimeType: string;
  caption?: string;
  tags?: string[];
  album?: string;
  isFavorite?: boolean;
  editHistory?: PhotoEdit[];
}

export interface PhotoEdit {
  id: string;
  type: 'crop' | 'filter' | 'brightness' | 'contrast' | 'saturation' | 'rotation';
  params: any;
  timestamp: Date;
}

export interface PhotoFilter {
  id: string;
  name: string;
  matrix: number[];
}

export interface PhotoCompressionOptions {
  quality?: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png';
  keepAspectRatio?: boolean;
}

export interface PhotoOrganizationOptions {
  groupBy?: 'date' | 'location' | 'album' | 'tags';
  sortBy?: 'date' | 'name' | 'size' | 'favorites';
  sortOrder?: 'asc' | 'desc';
}

// Cache configuration
const CACHE_KEY_PREFIX = 'photo_cache_';
const THUMBNAIL_CACHE_PREFIX = 'thumb_cache_';
const METADATA_CACHE_PREFIX = 'meta_cache_';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Photo filters
export const PHOTO_FILTERS: PhotoFilter[] = [
  {
    id: 'original',
    name: 'Original',
    matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: 'grayscale',
    name: 'Grayscale',
    matrix: [0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: 'sepia',
    name: 'Sepia',
    matrix: [0.393, 0.769, 0.189, 0, 0, 0.349, 0.686, 0.168, 0, 0, 0.272, 0.534, 0.131, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: 'vintage',
    name: 'Vintage',
    matrix: [0.5, 0.5, 0.1, 0, 0, 0.3, 0.5, 0.1, 0, 0, 0.1, 0.3, 0.5, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: 'cold',
    name: 'Cold',
    matrix: [1, 0, 0, 0, 0, 0, 1, 0.1, 0, 0, 0, 0.1, 1.2, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: 'warm',
    name: 'Warm',
    matrix: [1.2, 0.1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: 'contrast',
    name: 'High Contrast',
    matrix: [1.5, 0, 0, 0, -0.25, 0, 1.5, 0, 0, -0.25, 0, 0, 1.5, 0, -0.25, 0, 0, 0, 1, 0],
  },
];

class PhotoService {
  private cacheDir: string;
  private thumbnailDir: string;

  constructor() {
    this.cacheDir = `${FileSystem.cacheDirectory}photos/`;
    this.thumbnailDir = `${FileSystem.cacheDirectory}thumbnails/`;
    this.initializeDirectories();
  }

  private async initializeDirectories() {
    try {
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      await FileSystem.makeDirectoryAsync(this.thumbnailDir, { intermediates: true });
    } catch (error) {
      console.error('Failed to initialize photo directories:', error);
    }
  }

  // Photo compression and optimization
  async compressPhoto(uri: string, options: PhotoCompressionOptions = {}): Promise<string> {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1920,
      format = 'jpeg',
      keepAspectRatio = true,
    } = options;

    try {
      // Note: Image compression is not available without expo-image-manipulator
      // Returning original URI for now
      console.log('Compression would be applied with options:', { quality, maxWidth, maxHeight, format, keepAspectRatio });
      return uri;
    } catch (error) {
      console.error('Photo compression failed:', error);
      throw error;
    }
  }

  // Generate thumbnail
  async generateThumbnail(uri: string, size: number = 200): Promise<string> {
    const cacheKey = `${THUMBNAIL_CACHE_PREFIX}${size}_${this.getFileNameFromUri(uri)}`;
    
    // Check cache first
    const cachedThumbnail = await this.getCachedItem(cacheKey);
    if (cachedThumbnail) {
      return cachedThumbnail;
    }

    try {
      // Note: Thumbnail generation is not available without expo-image-manipulator
      // Returning original URI for now
      console.log('Thumbnail would be generated with size:', size);
      
      // Cache the original URI
      await this.setCachedItem(cacheKey, uri);
      
      return uri;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return uri; // Return original URI as fallback
    }
  }

  // Extract EXIF data
  async extractExifData(uri: string): Promise<PhotoMetadata['exif'] | undefined> {
    try {
      // Note: Expo doesn't provide direct EXIF reading, so we'll use ImagePicker's exif option
      // This is a placeholder for demonstration
      // In a real implementation, you might use a native module or server-side processing
      return {
        make: 'Unknown',
        model: 'Unknown',
        iso: undefined,
        aperture: undefined,
        exposureTime: undefined,
        focalLength: undefined,
        flash: false,
        orientation: 1,
      };
    } catch (error) {
      console.error('EXIF extraction failed:', error);
      return undefined;
    }
  }

  // Extract location from photo
  async extractLocation(uri: string): Promise<PhotoMetadata['location'] | undefined> {
    try {
      // This is a placeholder - actual implementation would require native modules
      // or server-side processing to extract GPS EXIF data
      return undefined;
    } catch (error) {
      console.error('Location extraction failed:', error);
      return undefined;
    }
  }

  // Apply photo filter
  async applyFilter(uri: string, filter: PhotoFilter): Promise<string> {
    if (filter.id === 'original') {
      return uri;
    }

    try {
      // Note: Filter application is not available without expo-image-manipulator
      // This would require a custom native module or server-side processing
      console.log('Filter would be applied:', filter.name);
      return uri;
    } catch (error) {
      console.error('Filter application failed:', error);
      throw error;
    }
  }

  // Adjust photo brightness
  async adjustBrightness(uri: string, brightness: number): Promise<string> {
    try {
      // Brightness should be between -1 and 1
      const adjustedBrightness = Math.max(-1, Math.min(1, brightness));
      
      // Note: Expo Image Manipulator doesn't support brightness adjustment directly
      // This would require a custom implementation
      return uri;
    } catch (error) {
      console.error('Brightness adjustment failed:', error);
      throw error;
    }
  }

  // Crop photo
  async cropPhoto(
    uri: string,
    cropData: { originX: number; originY: number; width: number; height: number }
  ): Promise<string> {
    try {
      // Note: Cropping is not available without expo-image-manipulator
      console.log('Crop would be applied with data:', cropData);
      return uri;
    } catch (error) {
      console.error('Photo crop failed:', error);
      throw error;
    }
  }

  // Rotate photo
  async rotatePhoto(uri: string, degrees: number): Promise<string> {
    try {
      // Note: Rotation is not available without expo-image-manipulator
      console.log('Rotation would be applied with degrees:', degrees);
      return uri;
    } catch (error) {
      console.error('Photo rotation failed:', error);
      throw error;
    }
  }

  // Batch process photos
  async batchProcess(
    uris: string[],
    processFunc: (uri: string) => Promise<string>,
    onProgress?: (current: number, total: number) => void
  ): Promise<string[]> {
    const results: string[] = [];
    const total = uris.length;

    for (let i = 0; i < total; i++) {
      try {
        const result = await processFunc(uris[i]);
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, total);
        }
      } catch (error) {
        console.error(`Batch processing failed for photo ${i}:`, error);
        results.push(uris[i]); // Use original on failure
      }
    }

    return results;
  }

  // Organize photos by criteria
  async organizePhotos(
    photos: PhotoMetadata[],
    options: PhotoOrganizationOptions = {}
  ): Promise<Map<string, PhotoMetadata[]>> {
    const { groupBy = 'date', sortBy = 'date', sortOrder = 'desc' } = options;
    
    // Sort photos
    const sortedPhotos = [...photos].sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'date':
          compareValue = a.takenAt.getTime() - b.takenAt.getTime();
          break;
        case 'name':
          compareValue = a.id.localeCompare(b.id);
          break;
        case 'size':
          compareValue = a.size - b.size;
          break;
        case 'favorites':
          compareValue = (a.isFavorite ? 1 : 0) - (b.isFavorite ? 1 : 0);
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    // Group photos
    const grouped = new Map<string, PhotoMetadata[]>();
    
    sortedPhotos.forEach(photo => {
      let key: string;
      
      switch (groupBy) {
        case 'date':
          key = photo.takenAt.toDateString();
          break;
        case 'location':
          key = photo.location 
            ? `${photo.location.latitude.toFixed(2)},${photo.location.longitude.toFixed(2)}`
            : 'No Location';
          break;
        case 'album':
          key = photo.album || 'Uncategorized';
          break;
        case 'tags':
          key = photo.tags?.join(', ') || 'No Tags';
          break;
        default:
          key = 'All Photos';
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(photo);
    });

    return grouped;
  }

  // Auto-categorize photos using basic heuristics
  async autoCategorizePhoto(metadata: PhotoMetadata): Promise<string[]> {
    const categories: string[] = [];
    
    // Time-based categories
    const hour = metadata.takenAt.getHours();
    if (hour >= 5 && hour < 12) {
      categories.push('morning');
    } else if (hour >= 12 && hour < 17) {
      categories.push('afternoon');
    } else if (hour >= 17 && hour < 21) {
      categories.push('evening');
    } else {
      categories.push('night');
    }
    
    // Size-based categories
    if (metadata.width > metadata.height * 1.5) {
      categories.push('landscape');
    } else if (metadata.height > metadata.width * 1.5) {
      categories.push('portrait');
    } else {
      categories.push('square');
    }
    
    // Location-based categories (if available)
    if (metadata.location) {
      categories.push('geotagged');
    }
    
    return categories;
  }

  // Cache management
  private async getCachedItem(key: string): Promise<string | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { uri, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
          return uri;
        }
        // Remove expired cache
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Cache retrieval failed:', error);
    }
    return null;
  }

  private async setCachedItem(key: string, uri: string): Promise<void> {
    try {
      await AsyncStorage.setItem(
        key,
        JSON.stringify({
          uri,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Cache storage failed:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      // Clear AsyncStorage cache
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith(CACHE_KEY_PREFIX) || 
        key.startsWith(THUMBNAIL_CACHE_PREFIX) || 
        key.startsWith(METADATA_CACHE_PREFIX)
      );
      await AsyncStorage.multiRemove(cacheKeys);
      
      // Clear file system cache
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      await FileSystem.deleteAsync(this.thumbnailDir, { idempotent: true });
      
      // Recreate directories
      await this.initializeDirectories();
    } catch (error) {
      console.error('Cache clearing failed:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const cacheInfo = await FileSystem.getInfoAsync(this.cacheDir);
      const thumbnailInfo = await FileSystem.getInfoAsync(this.thumbnailDir);
      
      let totalSize = 0;
      if (cacheInfo.exists && cacheInfo.size) {
        totalSize += cacheInfo.size;
      }
      if (thumbnailInfo.exists && thumbnailInfo.size) {
        totalSize += thumbnailInfo.size;
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }

  // Helper methods
  private getFileNameFromUri(uri: string): string {
    return uri.split('/').pop() || `photo_${Date.now()}`;
  }

  generatePhotoId(): string {
    return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getPhotoInfo(uri: string): Promise<{ width: number; height: number; size: number }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      // Note: Getting image dimensions would require additional implementation
      // Using placeholder values for demonstration
      return {
        width: 1920,
        height: 1080,
        size: fileInfo.exists && fileInfo.size ? fileInfo.size : 0,
      };
    } catch (error) {
      console.error('Failed to get photo info:', error);
      return { width: 0, height: 0, size: 0 };
    }
  }
}

export const photoService = new PhotoService();