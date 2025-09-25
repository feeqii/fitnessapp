import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PHOTOS: 'progress_photos',
  SETTINGS: 'app_settings',
} as const;

class StorageService {
  // Initialize user with profile data
  async initializeUser(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      console.log('User initialized successfully with AsyncStorage');
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  }

  // Check if user is initialized
  async isUserInitialized(): Promise<boolean> {
    try {
      const onboardingCompleted = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      const userProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return onboardingCompleted === 'true' && userProfile !== null;
    } catch (error) {
      console.error('Error checking user initialization:', error);
      return false;
    }
  }

  // Get user profile
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profileData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (!profileData) return null;
      
      const profile = JSON.parse(profileData);
      // Convert date strings back to Date objects
      return {
        ...profile,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      const currentProfile = await this.getUserProfile();
      if (!currentProfile) {
        throw new Error('No existing user profile found');
      }

      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updatedAt: new Date(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Clear all user data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.PHOTOS,
        STORAGE_KEYS.SETTINGS,
      ]);
      console.log('All user data cleared');
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  }

  // Generic storage methods
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  // Store JSON data
  async setJSON(key: string, data: any): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }

  // Get JSON data
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error parsing JSON for key ${key}:`, error);
      return null;
    }
  }
}

// Export singleton instance
const storageService = new StorageService();
export default storageService;
