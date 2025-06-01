/**
 * Data models for TDR Days app
 * Designed to support future Rails backend sync
 */

// Park type enum
export enum ParkType {
  LAND = 'LAND',
  SEA = 'SEA',
}

// Action category enum
export enum ActionCategory {
  ATTRACTION = 'ATTRACTION',
  RESTAURANT = 'RESTAURANT',
  SHOW = 'SHOW',
  GREETING = 'GREETING',
  SHOPPING = 'SHOPPING',
}

// Area definitions for both parks
export enum LandArea {
  WORLD_BAZAAR = 'WORLD_BAZAAR',
  ADVENTURELAND = 'ADVENTURELAND',
  WESTERNLAND = 'WESTERNLAND',
  CRITTER_COUNTRY = 'CRITTER_COUNTRY',
  FANTASYLAND = 'FANTASYLAND',
  TOONTOWN = 'TOONTOWN',
  TOMORROWLAND = 'TOMORROWLAND',
}

export enum SeaArea {
  MEDITERRANEAN_HARBOR = 'MEDITERRANEAN_HARBOR',
  AMERICAN_WATERFRONT = 'AMERICAN_WATERFRONT',
  PORT_DISCOVERY = 'PORT_DISCOVERY',
  LOST_RIVER_DELTA = 'LOST_RIVER_DELTA',
  ARABIAN_COAST = 'ARABIAN_COAST',
  MERMAID_LAGOON = 'MERMAID_LAGOON',
  MYSTERIOUS_ISLAND = 'MYSTERIOUS_ISLAND',
  FANTASY_SPRINGS = 'FANTASY_SPRINGS',
}

export type ParkArea = LandArea | SeaArea;

// Base model interface with common fields
interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // For future Rails sync
  syncedAt?: Date;
  remoteId?: string;
}

// Companion model
export interface Companion extends BaseModel {
  name: string;
  visitIds: string[]; // Array of visit IDs
  avatar?: string; // Optional avatar URL/path
  notes?: string;
}

// Visit model
export interface Visit extends BaseModel {
  date: Date;
  parkType: ParkType;
  companionIds: string[]; // Array of companion IDs
  numberOfPeople?: number; // Optional total number of people
  notes?: string;
  weather?: 'SUNNY' | 'CLOUDY' | 'RAINY' | 'SNOWY';
  startTime?: Date;
  endTime?: Date;
  // Cached values for performance
  actionCount?: number;
  totalPhotoCount?: number;
}

// Photo model for timeline actions
export interface Photo {
  id: string;
  uri: string; // Local URI or URL
  thumbnailUri?: string;
  width?: number;
  height?: number;
  takenAt?: Date;
  caption?: string;
}

// Timeline action model
export interface TimelineAction extends BaseModel {
  visitId: string;
  category: ActionCategory;
  area: ParkArea;
  locationName: string; // e.g., "Space Mountain", "Queen of Hearts Banquet Hall"
  locationId?: string; // For future preset location reference
  time: Date;
  duration?: number; // Duration in minutes
  waitTime?: number; // Wait time in minutes (for attractions)
  notes?: string;
  photos: Photo[];
  rating?: 1 | 2 | 3 | 4 | 5;
  // For shopping actions
  purchaseAmount?: number;
  purchasedItems?: string[];
  // For restaurant actions
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  // For show/greeting actions
  performerNames?: string[];
  showTime?: string; // Specific show time if applicable
  // Sorting support
  sortOrder?: number;
}

// Analytics data types
export interface VisitStats {
  totalVisits: number;
  landVisits: number;
  seaVisits: number;
  averageVisitDuration?: number;
  favoriteCompanions: Array<{
    companion: Companion;
    visitCount: number;
  }>;
  visitsByMonth: Array<{
    month: string; // YYYY-MM format
    count: number;
  }>;
  visitsByYear: Array<{
    year: number;
    count: number;
  }>;
}

export interface ActionStats {
  totalActions: number;
  actionsByCategory: Record<ActionCategory, number>;
  topAttractions: Array<{
    locationName: string;
    count: number;
    averageWaitTime?: number;
  }>;
  topRestaurants: Array<{
    locationName: string;
    count: number;
  }>;
  areaDistribution: Array<{
    area: ParkArea;
    visitCount: number;
    timeSpent?: number; // in minutes
  }>;
  averageActionsPerVisit: number;
  photoCount: number;
}

export interface CompanionStats {
  companion: Companion;
  visitCount: number;
  lastVisitDate: Date;
  favoriteAreas: ParkArea[];
  commonActivities: Array<{
    category: ActionCategory;
    count: number;
  }>;
}

// Date range for analytics queries
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Filter options for queries
export interface VisitFilter {
  dateRange?: DateRange;
  parkType?: ParkType;
  companionIds?: string[];
}

export interface ActionFilter {
  visitId?: string;
  category?: ActionCategory;
  area?: ParkArea;
  dateRange?: DateRange;
  locationName?: string;
}

// Sort options
export type SortDirection = 'ASC' | 'DESC';

export interface SortOptions<T> {
  field: keyof T;
  direction: SortDirection;
}

// Migration support
export interface DataMigration {
  version: number;
  appliedAt: Date;
  description: string;
}

// App metadata
export interface AppMetadata extends BaseModel {
  dataVersion: number;
  lastSyncDate?: Date;
  userId?: string; // For future user accounts
  settings?: Record<string, any>;
}

// Preset location data (for future implementation)
export interface PresetLocation {
  id: string;
  name: string;
  nameEn?: string;
  category: ActionCategory;
  parkType: ParkType;
  area: ParkArea;
  isActive: boolean;
  openingDate?: Date;
  closingDate?: Date;
  tags?: string[];
}

// Export utility types
export type CreateInput<T extends BaseModel> = Omit<T, keyof BaseModel>;
export type UpdateInput<T extends BaseModel> = Partial<Omit<T, 'id' | 'createdAt'>>;