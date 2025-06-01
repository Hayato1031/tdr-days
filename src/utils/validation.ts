/**
 * Validation utilities for TDR Days app
 * Provides comprehensive validation for action registration
 */

import { ActionCategory, ParkArea, ParkType } from '../types/models';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ActionFormData {
  // Basic fields
  category: ActionCategory;
  area?: ParkArea;
  locationName: string;
  time: Date;
  duration: string;
  notes: string;
  rating: number;
  
  // Attraction-specific
  waitTime: string;
  fastPass: boolean;
  
  // Restaurant-specific
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  reservationMade: boolean;
  partySize: string;
  
  // Shopping-specific
  purchaseAmount: string;
  purchasedItems: string;
  
  // Show/Greeting-specific
  performerNames: string;
  showTime: string;
  meetingDuration: string;
}

export class ActionValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Validate complete action form data
   */
  validateAction(data: Partial<ActionFormData>, visitDate: Date): ValidationResult {
    this.errors = [];
    this.warnings = [];

    // Required field validation
    this.validateRequiredFields(data);
    
    // Time validation
    this.validateTime(data.time, visitDate);
    
    // Duration validation
    this.validateDuration(data.duration);
    
    // Category-specific validation
    this.validateCategorySpecificFields(data);
    
    // Business logic validation
    this.validateBusinessLogic(data);

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Validate step completion for wizard flow
   */
  validateStep(step: number, data: Partial<ActionFormData>): ValidationResult {
    this.errors = [];
    this.warnings = [];

    switch (step) {
      case 0: // Category
        this.validateCategory(data.category);
        break;
      case 1: // Area
        this.validateArea(data.area);
        break;
      case 2: // Location
        this.validateLocation(data.locationName);
        break;
      case 3: // Details
        this.validateDetails(data);
        break;
      case 4: // Photos
        // Photos are optional, no validation needed
        break;
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  private validateRequiredFields(data: Partial<ActionFormData>) {
    if (!data.category) {
      this.errors.push('Category is required');
    }

    if (!data.area) {
      this.errors.push('Area is required');
    }

    if (!data.locationName?.trim()) {
      this.errors.push('Location name is required');
    } else if (data.locationName.trim().length < 2) {
      this.errors.push('Location name must be at least 2 characters');
    } else if (data.locationName.trim().length > 100) {
      this.errors.push('Location name must be less than 100 characters');
    }

    if (!data.time) {
      this.errors.push('Time is required');
    }
  }

  private validateCategory(category?: ActionCategory) {
    if (!category) {
      this.errors.push('Please select a category');
      return;
    }

    if (!Object.values(ActionCategory).includes(category)) {
      this.errors.push('Invalid category selected');
    }
  }

  private validateArea(area?: ParkArea) {
    if (!area) {
      this.errors.push('Please select an area');
      return;
    }

    // Area validation would depend on park type, but we don't have that context here
    // This would be handled at a higher level
  }

  private validateLocation(locationName?: string) {
    if (!locationName?.trim()) {
      this.errors.push('Please enter or select a location');
      return;
    }

    if (locationName.trim().length < 2) {
      this.errors.push('Location name must be at least 2 characters');
    }

    if (locationName.trim().length > 100) {
      this.errors.push('Location name must be less than 100 characters');
    }

    // Check for potentially invalid characters
    const invalidChars = /[<>{}[\]\\]/;
    if (invalidChars.test(locationName)) {
      this.errors.push('Location name contains invalid characters');
    }
  }

  private validateTime(time?: Date, visitDate?: Date) {
    if (!time) {
      return; // Already handled in required fields
    }

    if (!(time instanceof Date) || isNaN(time.getTime())) {
      this.errors.push('Invalid time format');
      return;
    }

    if (visitDate) {
      const timeDate = new Date(time);
      const visit = new Date(visitDate);
      
      // Check if time is on the same day as visit
      if (timeDate.toDateString() !== visit.toDateString()) {
        this.warnings.push('Time is not on the same day as your visit');
      }
      
      // Check for reasonable time ranges (4 AM to 11:59 PM)
      const hours = timeDate.getHours();
      if (hours < 4 || hours >= 24) {
        this.warnings.push('Time seems outside typical park hours');
      }
    }

    // Check if time is in the future for today's visits
    const now = new Date();
    if (visitDate && 
        visitDate.toDateString() === now.toDateString() && 
        time > now) {
      this.warnings.push('Time is in the future');
    }
  }

  private validateDuration(duration?: string) {
    if (!duration?.trim()) {
      return; // Duration is optional
    }

    const durationNum = parseFloat(duration);
    if (isNaN(durationNum)) {
      this.errors.push('Duration must be a valid number');
      return;
    }

    if (durationNum < 0) {
      this.errors.push('Duration cannot be negative');
    } else if (durationNum > 720) { // 12 hours
      this.warnings.push('Duration seems very long (over 12 hours)');
    } else if (durationNum > 0 && durationNum < 1) {
      this.warnings.push('Duration seems very short (less than 1 minute)');
    }
  }

  private validateDetails(data: Partial<ActionFormData>) {
    // Notes validation
    if (data.notes && data.notes.length > 1000) {
      this.errors.push('Notes must be less than 1000 characters');
    }

    // Rating validation
    if (data.rating !== undefined && data.rating !== 0) {
      if (data.rating < 1 || data.rating > 5) {
        this.errors.push('Rating must be between 1 and 5');
      }
    }
  }

  private validateCategorySpecificFields(data: Partial<ActionFormData>) {
    switch (data.category) {
      case ActionCategory.ATTRACTION:
        this.validateAttractionFields(data);
        break;
      case ActionCategory.RESTAURANT:
        this.validateRestaurantFields(data);
        break;
      case ActionCategory.SHOPPING:
        this.validateShoppingFields(data);
        break;
      case ActionCategory.SHOW:
      case ActionCategory.GREETING:
        this.validateShowGreetingFields(data);
        break;
    }
  }

  private validateAttractionFields(data: Partial<ActionFormData>) {
    // Wait time validation
    if (data.waitTime?.trim()) {
      const waitTimeNum = parseFloat(data.waitTime);
      if (isNaN(waitTimeNum)) {
        this.errors.push('Wait time must be a valid number');
      } else if (waitTimeNum < 0) {
        this.errors.push('Wait time cannot be negative');
      } else if (waitTimeNum > 300) { // 5 hours
        this.warnings.push('Wait time seems very long (over 5 hours)');
      }
    }
  }

  private validateRestaurantFields(data: Partial<ActionFormData>) {
    // Meal type validation
    const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
    if (data.mealType && !validMealTypes.includes(data.mealType)) {
      this.errors.push('Invalid meal type');
    }

    // Party size validation
    if (data.partySize?.trim()) {
      const partySizeNum = parseInt(data.partySize);
      if (isNaN(partySizeNum)) {
        this.errors.push('Party size must be a valid number');
      } else if (partySizeNum < 1) {
        this.errors.push('Party size must be at least 1');
      } else if (partySizeNum > 20) {
        this.warnings.push('Very large party size');
      }
    }
  }

  private validateShoppingFields(data: Partial<ActionFormData>) {
    // Purchase amount validation
    if (data.purchaseAmount?.trim()) {
      const amountNum = parseFloat(data.purchaseAmount);
      if (isNaN(amountNum)) {
        this.errors.push('Purchase amount must be a valid number');
      } else if (amountNum < 0) {
        this.errors.push('Purchase amount cannot be negative');
      } else if (amountNum > 1000000) { // 1 million yen
        this.warnings.push('Very large purchase amount');
      }
    }

    // Items validation
    if (data.purchasedItems && data.purchasedItems.length > 500) {
      this.errors.push('Purchased items description is too long');
    }
  }

  private validateShowGreetingFields(data: Partial<ActionFormData>) {
    // Performer names validation
    if (data.performerNames && data.performerNames.length > 200) {
      this.errors.push('Performer names list is too long');
    }

    // Show time validation
    if (data.showTime && data.showTime.length > 50) {
      this.errors.push('Show time description is too long');
    }

    // Meeting duration validation (for greetings)
    if (data.meetingDuration?.trim()) {
      const durationNum = parseFloat(data.meetingDuration);
      if (isNaN(durationNum)) {
        this.errors.push('Meeting duration must be a valid number');
      } else if (durationNum < 0) {
        this.errors.push('Meeting duration cannot be negative');
      } else if (durationNum > 60) {
        this.warnings.push('Very long meeting duration');
      }
    }
  }

  private validateBusinessLogic(data: Partial<ActionFormData>) {
    // Fast Pass logic for attractions
    if (data.category === ActionCategory.ATTRACTION && data.fastPass) {
      if (data.waitTime && parseFloat(data.waitTime) > 10) {
        this.warnings.push('Fast Pass usually reduces wait time significantly');
      }
    }

    // Meal type vs time consistency
    if (data.category === ActionCategory.RESTAURANT && data.time && data.mealType) {
      const hours = data.time.getHours();
      const mealTime = this.getMealTimeRange(data.mealType);
      
      if (hours < mealTime.start || hours > mealTime.end) {
        this.warnings.push(`${data.mealType.toLowerCase()} time seems unusual for ${hours}:00`);
      }
    }

    // Shopping amount vs items consistency
    if (data.category === ActionCategory.SHOPPING) {
      const hasAmount = data.purchaseAmount?.trim() && parseFloat(data.purchaseAmount) > 0;
      const hasItems = data.purchasedItems?.trim();
      
      if (hasAmount && !hasItems) {
        this.warnings.push('Consider adding what items you purchased');
      } else if (hasItems && !hasAmount) {
        this.warnings.push('Consider adding the purchase amount');
      }
    }
  }

  private getMealTimeRange(mealType: string): { start: number; end: number } {
    switch (mealType) {
      case 'BREAKFAST':
        return { start: 6, end: 11 };
      case 'LUNCH':
        return { start: 11, end: 15 };
      case 'DINNER':
        return { start: 17, end: 22 };
      case 'SNACK':
        return { start: 8, end: 21 };
      default:
        return { start: 0, end: 23 };
    }
  }
}

// Convenience functions
export const validateAction = (data: Partial<ActionFormData>, visitDate: Date): ValidationResult => {
  const validator = new ActionValidator();
  return validator.validateAction(data, visitDate);
};

export const validateStep = (step: number, data: Partial<ActionFormData>): ValidationResult => {
  const validator = new ActionValidator();
  return validator.validateStep(step, data);
};

// Location name sanitization
export const sanitizeLocationName = (name: string): string => {
  return name
    .trim()
    .replace(/[<>{}[\]\\]/g, '') // Remove invalid characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100); // Limit length
};

// Time validation helpers
export const isValidTime = (time: Date, visitDate: Date): boolean => {
  if (!(time instanceof Date) || isNaN(time.getTime())) {
    return false;
  }
  
  // Should be on the same day or reasonable nearby
  const timeDiff = Math.abs(time.getTime() - visitDate.getTime());
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  return timeDiff <= oneDayMs;
};

// Duration validation helpers
export const isValidDuration = (duration: string): boolean => {
  if (!duration.trim()) return true; // Optional field
  
  const num = parseFloat(duration);
  return !isNaN(num) && num >= 0 && num <= 720;
};

// Amount validation helpers
export const isValidAmount = (amount: string): boolean => {
  if (!amount.trim()) return true; // Optional field
  
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0 && num <= 1000000;
};