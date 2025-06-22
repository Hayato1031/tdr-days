import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

interface ReviewData {
  appOpenCount: number;
  lastRequestedDate: string | null;
  hasRated: boolean;
}

const REVIEW_KEY = '@TDRDays:review';
const MIN_OPEN_COUNT = 3; // Minimum app opens before requesting review
const REVIEW_CHANCE = 0.5; // 50% chance to show review request
const DAYS_BETWEEN_REQUESTS = 14; // Days to wait before showing review again

class ReviewService {
  private async getReviewData(): Promise<ReviewData> {
    try {
      const data = await AsyncStorage.getItem(REVIEW_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading review data:', error);
    }
    
    return {
      appOpenCount: 0,
      lastRequestedDate: null,
      hasRated: false,
    };
  }

  private async saveReviewData(data: ReviewData): Promise<void> {
    try {
      await AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving review data:', error);
    }
  }

  async incrementAppOpenCount(): Promise<void> {
    const data = await this.getReviewData();
    data.appOpenCount++;
    await this.saveReviewData(data);
  }

  async checkAndRequestReview(force: boolean = false): Promise<boolean> {
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) {
        console.log('Store review is not available');
        return false;
      }

      const data = await this.getReviewData();
      
      // Force mode for development testing
      if (force && __DEV__) {
        return true; // Show modal in force mode
      }
      
      // Check if user has already rated
      if (data.hasRated) {
        return false;
      }
      
      // Check minimum app open count
      if (data.appOpenCount < MIN_OPEN_COUNT) {
        return false;
      }
      
      // Check if enough time has passed since last request
      if (data.lastRequestedDate) {
        const lastDate = new Date(data.lastRequestedDate);
        const daysSinceLastRequest = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastRequest < DAYS_BETWEEN_REQUESTS) {
          return false;
        }
      }
      
      // Random chance check
      if (Math.random() > REVIEW_CHANCE) {
        return false;
      }
      
      // Update last requested date
      data.lastRequestedDate = new Date().toISOString();
      await this.saveReviewData(data);
      
      return true; // Show modal
      
    } catch (error) {
      // Silently ignore review errors in development
      console.log('Review request failed:', error);
      return false;
    }
  }
  
  async markAsRated(): Promise<void> {
    const data = await this.getReviewData();
    data.hasRated = true;
    await this.saveReviewData(data);
  }

  async resetReviewData(): Promise<void> {
    // Development only - reset all review data
    if (__DEV__) {
      await this.saveReviewData({
        appOpenCount: 0,
        lastRequestedDate: null,
        hasRated: false,
      });
    }
  }

  async getReviewStatus(): Promise<{
    hasRated: boolean;
    appOpenCount: number;
    daysSinceLastRequest: number | null;
  }> {
    const data = await this.getReviewData();
    let daysSinceLastRequest = null;
    
    if (data.lastRequestedDate) {
      const lastDate = new Date(data.lastRequestedDate);
      daysSinceLastRequest = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return {
      hasRated: data.hasRated,
      appOpenCount: data.appOpenCount,
      daysSinceLastRequest,
    };
  }
}

export const reviewService = new ReviewService();