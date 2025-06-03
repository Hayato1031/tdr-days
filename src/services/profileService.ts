import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'user_profile';

export interface UserProfile {
  name: string;
  avatarUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const profileService = {
  async getProfile(): Promise<UserProfile | null> {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('AsyncStorage timeout')), 1000);
      });
      
      const storagePromise = AsyncStorage.getItem(PROFILE_KEY);
      
      const profileData = await Promise.race([storagePromise, timeoutPromise]);
      
      if (!profileData) return null;
      
      const parsed = JSON.parse(profileData);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
      };
    } catch (error) {
      console.warn('Error loading profile:', error);
      return null;
    }
  },

  async saveProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    try {
      const existingProfile = await this.getProfile();
      const now = new Date();
      
      const newProfile: UserProfile = {
        ...profile,
        createdAt: existingProfile?.createdAt || now,
        updatedAt: now,
      };

      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
      return newProfile;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  },

  async updateProfile(updates: Partial<Pick<UserProfile, 'name' | 'avatarUri'>>): Promise<UserProfile> {
    try {
      const existingProfile = await this.getProfile();
      if (!existingProfile) {
        throw new Error('No existing profile found');
      }

      const updatedProfile: UserProfile = {
        ...existingProfile,
        ...updates,
        updatedAt: new Date(),
      };

      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async deleteProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROFILE_KEY);
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  },

  async hasProfile(): Promise<boolean> {
    try {
      // Add timeout protection
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Profile check timeout')), 1000);
      });
      
      const checkPromise = async () => {
        const profile = await this.getProfile();
        return profile !== null && profile.name && profile.name.trim() !== '';
      };
      
      return await Promise.race([checkPromise(), timeoutPromise]);
    } catch (error) {
      console.warn('Error checking profile existence, assuming false:', error);
      return false;
    }
  },
};