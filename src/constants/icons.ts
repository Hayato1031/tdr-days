/**
 * Icon mappings for Tokyo Disney Resort categories, areas, and specific locations
 * Uses Expo Vector Icons (@expo/vector-icons)
 */

import { 
  ActionCategory, 
  ParkType, 
  LandArea, 
  SeaArea 
} from '../types/models';

// Icon library types for Expo Vector Icons
export type IconLibrary = 
  | 'AntDesign'
  | 'Entypo' 
  | 'EvilIcons'
  | 'Feather'
  | 'FontAwesome'
  | 'FontAwesome5'
  | 'Foundation'
  | 'Ionicons'
  | 'MaterialCommunityIcons'
  | 'MaterialIcons'
  | 'Octicons'
  | 'SimpleLineIcons'
  | 'Zocial';

export interface IconConfig {
  library: IconLibrary;
  name: string;
  color?: string;
  size?: number;
}

// Park Type Icons
export const PARK_TYPE_ICONS: Record<ParkType, IconConfig> = {
  [ParkType.LAND]: {
    library: 'FontAwesome5',
    name: 'fort-awesome',
    color: '#FF6B9D',
  },
  [ParkType.SEA]: {
    library: 'FontAwesome5',
    name: 'globe',
    color: '#4FC3F7',
  },
};

// Action Category Icons
export const ACTION_CATEGORY_ICONS: Record<ActionCategory, IconConfig> = {
  [ActionCategory.ATTRACTION]: {
    library: 'MaterialCommunityIcons',
    name: 'ferris-wheel',
    color: '#FF5722',
  },
  [ActionCategory.RESTAURANT]: {
    library: 'MaterialCommunityIcons',
    name: 'silverware-fork-knife',
    color: '#4CAF50',
  },
  [ActionCategory.SHOW]: {
    library: 'MaterialCommunityIcons',
    name: 'theater',
    color: '#9C27B0',
  },
  [ActionCategory.GREETING]: {
    library: 'MaterialCommunityIcons',
    name: 'hand-wave',
    color: '#FF9800',
  },
  [ActionCategory.SHOPPING]: {
    library: 'MaterialCommunityIcons',
    name: 'shopping',
    color: '#E91E63',
  },
};

// Tokyo Disneyland Area Icons
export const LAND_AREA_ICONS: Record<LandArea, IconConfig> = {
  [LandArea.WORLD_BAZAAR]: {
    library: 'MaterialCommunityIcons',
    name: 'store',
    color: '#8E24AA',
  },
  [LandArea.ADVENTURELAND]: {
    library: 'MaterialCommunityIcons',
    name: 'palm-tree',
    color: '#2E7D32',
  },
  [LandArea.WESTERNLAND]: {
    library: 'MaterialCommunityIcons',
    name: 'hat-fedora',
    color: '#8D6E63',
  },
  [LandArea.CRITTER_COUNTRY]: {
    library: 'MaterialCommunityIcons',
    name: 'pine-tree',
    color: '#388E3C',
  },
  [LandArea.FANTASYLAND]: {
    library: 'MaterialCommunityIcons',
    name: 'castle',
    color: '#E91E63',
  },
  [LandArea.TOONTOWN]: {
    library: 'MaterialCommunityIcons',
    name: 'home-city',
    color: '#FF9800',
  },
  [LandArea.TOMORROWLAND]: {
    library: 'MaterialCommunityIcons',
    name: 'rocket',
    color: '#3F51B5',
  },
};

// Tokyo DisneySea Area Icons
export const SEA_AREA_ICONS: Record<SeaArea, IconConfig> = {
  [SeaArea.MEDITERRANEAN_HARBOR]: {
    library: 'MaterialCommunityIcons',
    name: 'lighthouse',
    color: '#1976D2',
  },
  [SeaArea.AMERICAN_WATERFRONT]: {
    library: 'MaterialCommunityIcons',
    name: 'city',
    color: '#F57C00',
  },
  [SeaArea.PORT_DISCOVERY]: {
    library: 'MaterialCommunityIcons',
    name: 'submarine',
    color: '#00BCD4',
  },
  [SeaArea.LOST_RIVER_DELTA]: {
    library: 'MaterialCommunityIcons',
    name: 'temple-hindu',
    color: '#8BC34A',
  },
  [SeaArea.ARABIAN_COAST]: {
    library: 'MaterialCommunityIcons',
    name: 'dome-light',
    color: '#FF9800',
  },
  [SeaArea.MERMAID_LAGOON]: {
    library: 'MaterialCommunityIcons',
    name: 'waves',
    color: '#4FC3F7',
  },
  [SeaArea.MYSTERIOUS_ISLAND]: {
    library: 'MaterialCommunityIcons',
    name: 'volcano',
    color: '#F44336',
  },
  [SeaArea.FANTASY_SPRINGS]: {
    library: 'MaterialCommunityIcons',
    name: 'snowflake',
    color: '#9C27B0',
  },
};

// Specific Attraction Type Icons
export const ATTRACTION_TYPE_ICONS: Record<string, IconConfig> = {
  // Ride types
  'roller coaster': {
    library: 'MaterialCommunityIcons',
    name: 'roller-coaster',
    color: '#F44336',
  },
  'dark ride': {
    library: 'MaterialCommunityIcons',
    name: 'train-car',
    color: '#673AB7',
  },
  'boat ride': {
    library: 'MaterialCommunityIcons',
    name: 'sail-boat',
    color: '#2196F3',
  },
  'flying': {
    library: 'MaterialCommunityIcons',
    name: 'airplane',
    color: '#03DAC6',
  },
  'spinning': {
    library: 'MaterialCommunityIcons',
    name: 'loading',
    color: '#FF9800',
  },
  'simulator': {
    library: 'MaterialCommunityIcons',
    name: 'monitor',
    color: '#9C27B0',
  },
  'water ride': {
    library: 'MaterialCommunityIcons',
    name: 'water',
    color: '#2196F3',
  },
  'thrill': {
    library: 'MaterialCommunityIcons',
    name: 'flash',
    color: '#FF5722',
  },
  'family': {
    library: 'MaterialCommunityIcons',
    name: 'account-group',
    color: '#4CAF50',
  },
  'gentle': {
    library: 'MaterialCommunityIcons',
    name: 'heart',
    color: '#E91E63',
  },
  
  // Show types
  'theater show': {
    library: 'MaterialCommunityIcons',
    name: 'theater',
    color: '#9C27B0',
  },
  'interactive show': {
    library: 'MaterialCommunityIcons',
    name: 'hand-pointing-up',
    color: '#FF9800',
  },
  '3d show': {
    library: 'MaterialCommunityIcons',
    name: 'glasses',
    color: '#3F51B5',
  },
  
  // Interactive types
  'interactive': {
    library: 'MaterialCommunityIcons',
    name: 'hand-point-right',
    color: '#FF9800',
  },
  'shooting': {
    library: 'MaterialCommunityIcons',
    name: 'target',
    color: '#F44336',
  },
  'arcade': {
    library: 'MaterialCommunityIcons',
    name: 'gamepad-variant',
    color: '#9C27B0',
  },
  
  // Transportation
  'transport': {
    library: 'MaterialCommunityIcons',
    name: 'train',
    color: '#607D8B',
  },
  'train': {
    library: 'MaterialCommunityIcons',
    name: 'train',
    color: '#795548',
  },
  'steamer': {
    library: 'MaterialCommunityIcons',
    name: 'ferry',
    color: '#607D8B',
  },
  'raft': {
    library: 'MaterialCommunityIcons',
    name: 'raft',
    color: '#8BC34A',
  },
  
  // Exploration
  'walkthrough': {
    library: 'MaterialCommunityIcons',
    name: 'walk',
    color: '#8BC34A',
  },
  'playground': {
    library: 'MaterialCommunityIcons',
    name: 'playground',
    color: '#FF9800',
  },
  'treehouse': {
    library: 'MaterialCommunityIcons',
    name: 'tree',
    color: '#4CAF50',
  },
};

// Restaurant Type Icons
export const RESTAURANT_TYPE_ICONS: Record<string, IconConfig> = {
  // Service types
  'table service': {
    library: 'MaterialCommunityIcons',
    name: 'silverware-fork-knife',
    color: '#4CAF50',
  },
  'quick service': {
    library: 'MaterialCommunityIcons',
    name: 'fast-forward',
    color: '#FF9800',
  },
  'buffet': {
    library: 'MaterialCommunityIcons',
    name: 'food-variant',
    color: '#2196F3',
  },
  'character dining': {
    library: 'MaterialCommunityIcons',
    name: 'face-agent',
    color: '#E91E63',
  },
  'show dining': {
    library: 'MaterialCommunityIcons',
    name: 'theater',
    color: '#9C27B0',
  },
  
  // Cuisine types
  'american': {
    library: 'MaterialCommunityIcons',
    name: 'hamburger',
    color: '#F44336',
  },
  'italian': {
    library: 'MaterialCommunityIcons',
    name: 'pasta',
    color: '#4CAF50',
  },
  'chinese': {
    library: 'MaterialCommunityIcons',
    name: 'noodles',
    color: '#FF9800',
  },
  'japanese': {
    library: 'MaterialCommunityIcons',
    name: 'rice',
    color: '#795548',
  },
  'french': {
    library: 'MaterialCommunityIcons',
    name: 'baguette',
    color: '#3F51B5',
  },
  'mexican': {
    library: 'MaterialCommunityIcons',
    name: 'chili-hot',
    color: '#FF5722',
  },
  'middle eastern': {
    library: 'MaterialCommunityIcons',
    name: 'food-drumstick',
    color: '#FF9800',
  },
  'mediterranean': {
    library: 'MaterialCommunityIcons',
    name: 'fish',
    color: '#2196F3',
  },
  'polynesian': {
    library: 'MaterialCommunityIcons',
    name: 'palm-tree',
    color: '#4CAF50',
  },
  'creole': {
    library: 'MaterialCommunityIcons',
    name: 'pot-steam',
    color: '#8BC34A',
  },
  
  // Food types
  'pizza': {
    library: 'MaterialCommunityIcons',
    name: 'pizza',
    color: '#FF5722',
  },
  'hamburgers': {
    library: 'MaterialCommunityIcons',
    name: 'hamburger',
    color: '#F44336',
  },
  'pasta': {
    library: 'MaterialCommunityIcons',
    name: 'pasta',
    color: '#4CAF50',
  },
  'curry': {
    library: 'MaterialCommunityIcons',
    name: 'bowl-mix',
    color: '#FF9800',
  },
  'ramen': {
    library: 'MaterialCommunityIcons',
    name: 'noodles',
    color: '#795548',
  },
  'hot dogs': {
    library: 'MaterialCommunityIcons',
    name: 'hot-dog',
    color: '#F44336',
  },
  'coffee': {
    library: 'MaterialCommunityIcons',
    name: 'coffee',
    color: '#795548',
  },
  'dessert': {
    library: 'MaterialCommunityIcons',
    name: 'cupcake',
    color: '#E91E63',
  },
  'sweets': {
    library: 'MaterialCommunityIcons',
    name: 'candy',
    color: '#E91E63',
  },
  'snacks': {
    library: 'MaterialCommunityIcons',
    name: 'food-apple',
    color: '#FF9800',
  },
  'popcorn': {
    library: 'MaterialCommunityIcons',
    name: 'popcorn',
    color: '#FFEB3B',
  },
};

// Shopping Type Icons
export const SHOPPING_TYPE_ICONS: Record<string, IconConfig> = {
  // Store types
  'souvenirs': {
    library: 'MaterialCommunityIcons',
    name: 'gift',
    color: '#E91E63',
  },
  'clothing': {
    library: 'MaterialCommunityIcons',
    name: 'tshirt-crew',
    color: '#9C27B0',
  },
  'accessories': {
    library: 'MaterialCommunityIcons',
    name: 'watch',
    color: '#FF9800',
  },
  'toys': {
    library: 'MaterialCommunityIcons',
    name: 'teddy-bear',
    color: '#2196F3',
  },
  'plush': {
    library: 'MaterialCommunityIcons',
    name: 'teddy-bear',
    color: '#E91E63',
  },
  'candy': {
    library: 'MaterialCommunityIcons',
    name: 'candy',
    color: '#F44336',
  },
  'confectionery': {
    library: 'MaterialCommunityIcons',
    name: 'cake',
    color: '#E91E63',
  },
  'stationery': {
    library: 'MaterialCommunityIcons',
    name: 'pen',
    color: '#3F51B5',
  },
  'books': {
    library: 'MaterialCommunityIcons',
    name: 'book-open',
    color: '#795548',
  },
  'home goods': {
    library: 'MaterialCommunityIcons',
    name: 'home',
    color: '#4CAF50',
  },
  'kitchen': {
    library: 'MaterialCommunityIcons',
    name: 'pot',
    color: '#607D8B',
  },
  'perfume': {
    library: 'MaterialCommunityIcons',
    name: 'spray-bottle',
    color: '#E91E63',
  },
  'cosmetics': {
    library: 'MaterialCommunityIcons',
    name: 'lipstick',
    color: '#E91E63',
  },
  'fashion': {
    library: 'MaterialCommunityIcons',
    name: 'hanger',
    color: '#9C27B0',
  },
  
  // Character themed
  'duffy': {
    library: 'MaterialCommunityIcons',
    name: 'teddy-bear',
    color: '#8D6E63',
  },
  'department store': {
    library: 'MaterialCommunityIcons',
    name: 'store',
    color: '#2196F3',
  },
  'bazaar': {
    library: 'MaterialCommunityIcons',
    name: 'tent',
    color: '#FF9800',
  },
  'marketplace': {
    library: 'MaterialCommunityIcons',
    name: 'storefront',
    color: '#4CAF50',
  },
};

// Character Type Icons for Greetings
export const CHARACTER_TYPE_ICONS: Record<string, IconConfig> = {
  // Main characters
  'mickey': {
    library: 'MaterialCommunityIcons',
    name: 'mouse',
    color: '#000000',
  },
  'minnie': {
    library: 'MaterialCommunityIcons',
    name: 'mouse-variant',
    color: '#E91E63',
  },
  'donald': {
    library: 'MaterialCommunityIcons',
    name: 'duck',
    color: '#2196F3',
  },
  'goofy': {
    library: 'MaterialCommunityIcons',
    name: 'dog',
    color: '#FF9800',
  },
  'chip': {
    library: 'MaterialCommunityIcons',
    name: 'rodent',
    color: '#8BC34A',
  },
  'dale': {
    library: 'MaterialCommunityIcons',
    name: 'rodent',
    color: '#F44336',
  },
  
  // Disney characters
  'princesses': {
    library: 'MaterialCommunityIcons',
    name: 'crown',
    color: '#E91E63',
  },
  'winnie the pooh': {
    library: 'MaterialCommunityIcons',
    name: 'teddy-bear',
    color: '#FFEB3B',
  },
  'stitch': {
    library: 'MaterialCommunityIcons',
    name: 'alien',
    color: '#3F51B5',
  },
  'toy story': {
    library: 'MaterialCommunityIcons',
    name: 'toy-brick',
    color: '#FFEB3B',
  },
  'little mermaid': {
    library: 'MaterialCommunityIcons',
    name: 'waves',
    color: '#4FC3F7',
  },
  'aladdin': {
    library: 'MaterialCommunityIcons',
    name: 'lamp',
    color: '#FF9800',
  },
  'frozen': {
    library: 'MaterialCommunityIcons',
    name: 'snowflake',
    color: '#03DAC6',
  },
  'beauty and the beast': {
    library: 'MaterialCommunityIcons',
    name: 'flower-tulip',
    color: '#FFEB3B',
  },
  'peter pan': {
    library: 'MaterialCommunityIcons',
    name: 'airplane',
    color: '#4CAF50',
  },
  'tangled': {
    library: 'MaterialCommunityIcons',
    name: 'lightbulb',
    color: '#FF9800',
  },
  'alice': {
    library: 'MaterialCommunityIcons',
    name: 'cards',
    color: '#2196F3',
  },
  
  // DisneySea exclusive
  'duffy': {
    library: 'MaterialCommunityIcons',
    name: 'teddy-bear',
    color: '#8D6E63',
  },
  'shelliemay': {
    library: 'MaterialCommunityIcons',
    name: 'teddy-bear',
    color: '#E91E63',
  },
  'gelatoni': {
    library: 'MaterialCommunityIcons',
    name: 'palette',
    color: '#4CAF50',
  },
  'stellalou': {
    library: 'MaterialCommunityIcons',
    name: 'rabbit',
    color: '#9C27B0',
  },
  
  // Groups
  'bears': {
    library: 'MaterialCommunityIcons',
    name: 'teddy-bear',
    color: '#8D6E63',
  },
  'chipmunks': {
    library: 'MaterialCommunityIcons',
    name: 'rodent',
    color: '#FF9800',
  },
  'classic': {
    library: 'MaterialCommunityIcons',
    name: 'star',
    color: '#FFEB3B',
  },
  'main characters': {
    library: 'MaterialCommunityIcons',
    name: 'star-circle',
    color: '#FFEB3B',
  },
};

// Weather Icons
export const WEATHER_ICONS: Record<string, IconConfig> = {
  'SUNNY': {
    library: 'MaterialCommunityIcons',
    name: 'weather-sunny',
    color: '#FFEB3B',
  },
  'CLOUDY': {
    library: 'MaterialCommunityIcons',
    name: 'weather-cloudy',
    color: '#9E9E9E',
  },
  'RAINY': {
    library: 'MaterialCommunityIcons',
    name: 'weather-rainy',
    color: '#2196F3',
  },
  'SNOWY': {
    library: 'MaterialCommunityIcons',
    name: 'weather-snowy',
    color: '#03DAC6',
  },
};

// Time of Day Icons
export const TIME_OF_DAY_ICONS: Record<string, IconConfig> = {
  'morning': {
    library: 'MaterialCommunityIcons',
    name: 'weather-sunset-up',
    color: '#FF9800',
  },
  'afternoon': {
    library: 'MaterialCommunityIcons',
    name: 'weather-sunny',
    color: '#FFEB3B',
  },
  'evening': {
    library: 'MaterialCommunityIcons',
    name: 'weather-sunset-down',
    color: '#FF5722',
  },
  'night': {
    library: 'MaterialCommunityIcons',
    name: 'weather-night',
    color: '#3F51B5',
  },
};

// Rating Icons
export const RATING_ICONS: Record<number, IconConfig> = {
  1: {
    library: 'MaterialCommunityIcons',
    name: 'star',
    color: '#FFC107',
  },
  2: {
    library: 'MaterialCommunityIcons',
    name: 'star',
    color: '#FFC107',
  },
  3: {
    library: 'MaterialCommunityIcons',
    name: 'star',
    color: '#FFC107',
  },
  4: {
    library: 'MaterialCommunityIcons',
    name: 'star',
    color: '#FFC107',
  },
  5: {
    library: 'MaterialCommunityIcons',
    name: 'star',
    color: '#FFC107',
  },
};

// Status Icons
export const STATUS_ICONS = {
  popular: {
    library: 'MaterialCommunityIcons' as const,
    name: 'fire',
    color: '#FF5722',
  },
  new: {
    library: 'MaterialCommunityIcons' as const,
    name: 'new-box',
    color: '#4CAF50',
  },
  fastpass: {
    library: 'MaterialCommunityIcons' as const,
    name: 'clock-fast',
    color: '#2196F3',
  },
  closed: {
    library: 'MaterialCommunityIcons' as const,
    name: 'close-circle',
    color: '#F44336',
  },
  refurbishment: {
    library: 'MaterialCommunityIcons' as const,
    name: 'wrench',
    color: '#FF9800',
  },
};

// Helper function to get icon for a specific item based on its tags
export const getIconForItem = (tags: string[] = [], category: ActionCategory): IconConfig => {
  // Check for specific tag matches first
  for (const tag of tags) {
    if (category === ActionCategory.ATTRACTION && ATTRACTION_TYPE_ICONS[tag]) {
      return ATTRACTION_TYPE_ICONS[tag];
    }
    if (category === ActionCategory.RESTAURANT && RESTAURANT_TYPE_ICONS[tag]) {
      return RESTAURANT_TYPE_ICONS[tag];
    }
    if (category === ActionCategory.SHOPPING && SHOPPING_TYPE_ICONS[tag]) {
      return SHOPPING_TYPE_ICONS[tag];
    }
    if (category === ActionCategory.GREETING && CHARACTER_TYPE_ICONS[tag]) {
      return CHARACTER_TYPE_ICONS[tag];
    }
  }
  
  // Fall back to category icon
  return ACTION_CATEGORY_ICONS[category];
};

// Helper function to get area icon
export const getAreaIcon = (area: LandArea | SeaArea): IconConfig => {
  if (Object.values(LandArea).includes(area as LandArea)) {
    return LAND_AREA_ICONS[area as LandArea];
  }
  return SEA_AREA_ICONS[area as SeaArea];
};

// Helper function to get multiple status icons for an item
export const getStatusIcons = (isPopular?: boolean, isNew?: boolean): IconConfig[] => {
  const icons: IconConfig[] = [];
  
  if (isPopular) {
    icons.push(STATUS_ICONS.popular);
  }
  
  if (isNew) {
    icons.push(STATUS_ICONS.new);
  }
  
  return icons;
};

// Export all icon mappings
export const ALL_ICONS = {
  parkType: PARK_TYPE_ICONS,
  category: ACTION_CATEGORY_ICONS,
  landArea: LAND_AREA_ICONS,
  seaArea: SEA_AREA_ICONS,
  attractionType: ATTRACTION_TYPE_ICONS,
  restaurantType: RESTAURANT_TYPE_ICONS,
  shoppingType: SHOPPING_TYPE_ICONS,
  characterType: CHARACTER_TYPE_ICONS,
  weather: WEATHER_ICONS,
  timeOfDay: TIME_OF_DAY_ICONS,
  rating: RATING_ICONS,
  status: STATUS_ICONS,
};