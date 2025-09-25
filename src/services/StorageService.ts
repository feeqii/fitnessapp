import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { UserProfile } from '../types';

export interface StoredPhoto {
  id: string;
  dayNumber: number;
  angle: 'front' | 'side' | 'back';
  photoUri: string;
  localPath: string;
  timestamp: Date;
  metadata: {
    fileSize: number;
    width: number;
    height: number;
  };
}

export interface UserProgress {
  startDate: Date;
  currentStreak: number;
  longestStreak: number;
  totalPhotos: number;
  lastPhotoDate: Date | null;
  photos: StoredPhoto[];
}

export interface AppData {
  userProfile: UserProfile | null;
  userProgress: UserProgress | null;
  isInitialized: boolean;
  onboardingCompleted: boolean;
}

class StorageService {
  private static readonly USER_PROFILE_KEY = 'user_profile';
  private static readonly USER_PROGRESS_KEY = 'user_progress';
  private static readonly APP_STATE_KEY = 'app_state';
  private static readonly PHOTOS_DIR = `${FileSystem.documentDirectory}progress_photos/`;

  // Initialize the storage service
  static async initialize(): Promise<void> {
    try {
      // Create photos directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.PHOTOS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.PHOTOS_DIR, { intermediates: true });
      }
      console.log('StorageService initialized successfully');
    } catch (error) {
      console.error('Error initializing StorageService:', error);
      throw error;
    }
  }

  // Initialize user profile and setup app state
  static async initializeUser(userProfile: UserProfile): Promise<void> {
    try {
      // Save user profile
      await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(userProfile));
      
      // Create initial user progress
      const initialProgress: UserProgress = {
        startDate: new Date(),
        currentStreak: 0,
        longestStreak: 0,
        totalPhotos: 0,
        lastPhotoDate: null,
        photos: [],
      };
      
      await AsyncStorage.setItem(this.USER_PROGRESS_KEY, JSON.stringify(initialProgress));
      
      // Mark app as initialized
      const appState = {
        isInitialized: true,
        onboardingCompleted: true,
        lastActiveDate: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(this.APP_STATE_KEY, JSON.stringify(appState));
      
      console.log('User initialized successfully:', userProfile.id);
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  }

  // Check if user is initialized
  static isUserInitialized(): boolean {
    try {
      // This is a synchronous check - we'll use async version in practice
      return true; // For now, we'll implement proper async checking elsewhere
    } catch (error) {
      console.error('Error checking user initialization:', error);
      return false;
    }
  }

  // Get user profile
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(this.USER_PROFILE_KEY);
      if (!data) return null;
      
      const profile = JSON.parse(data);
      // Convert date strings back to Date objects
      profile.createdAt = new Date(profile.createdAt);
      profile.updatedAt = new Date(profile.updatedAt);
      
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Update user profile
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      const currentProfile = await this.getUserProfile();
      if (!currentProfile) {
        throw new Error('No user profile found to update');
      }
      
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updatedAt: new Date(),
      };
      
      await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Get user progress
  static async getUserProgress(): Promise<UserProgress | null> {
    try {
      const data = await AsyncStorage.getItem(this.USER_PROGRESS_KEY);
      if (!data) return null;
      
      const progress = JSON.parse(data);
      // Convert date strings back to Date objects
      progress.startDate = new Date(progress.startDate);
      if (progress.lastPhotoDate) {
        progress.lastPhotoDate = new Date(progress.lastPhotoDate);
      }
      progress.photos = progress.photos.map((photo: any) => ({
        ...photo,
        timestamp: new Date(photo.timestamp),
      }));
      
      return progress;
    } catch (error) {
      console.error('Error getting user progress:', error);
      return null;
    }
  }

  // Save photo
  static async savePhoto(photoUri: string, angle: 'front' | 'side' | 'back'): Promise<StoredPhoto> {
    try {
      await this.initialize();
      
      const progress = await this.getUserProgress();
      if (!progress) {
        throw new Error('User progress not found');
      }
      
      const dayNumber = this.calculateDayNumber(progress.startDate);
      const photoId = `${dayNumber}_${angle}_${Date.now()}`;
      const localPath = `${this.PHOTOS_DIR}${photoId}.jpg`;
      
      // Copy photo to app directory
      await FileSystem.copyAsync({
        from: photoUri,
        to: localPath,
      });
      
      // Get image metadata
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      
      const storedPhoto: StoredPhoto = {
        id: photoId,
        dayNumber,
        angle,
        photoUri,
        localPath,
        timestamp: new Date(),
        metadata: {
          fileSize: fileInfo.size || 0,
          width: 0, // TODO: Get actual image dimensions
          height: 0, // TODO: Get actual image dimensions
        },
      };
      
      // Update progress
      progress.photos.push(storedPhoto);
      progress.totalPhotos = progress.photos.length;
      progress.lastPhotoDate = new Date();
      
      // Update streak
      this.updateStreak(progress);
      
      await AsyncStorage.setItem(this.USER_PROGRESS_KEY, JSON.stringify(progress));
      
      return storedPhoto;
    } catch (error) {
      console.error('Error saving photo:', error);
      throw error;
    }
  }

  // Calculate day number since start
  private static calculateDayNumber(startDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Update streak data
  private static updateStreak(progress: UserProgress): void {
    const today = new Date();
    const lastPhotoDate = progress.lastPhotoDate;
    
    if (!lastPhotoDate) {
      progress.currentStreak = 1;
    } else {
      const daysDiff = Math.floor((today.getTime() - lastPhotoDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        progress.currentStreak += 1;
      } else if (daysDiff === 0) {
        // Same day - don't change streak
      } else {
        // Streak broken
        progress.currentStreak = 1;
      }
    }
    
    // Update longest streak
    if (progress.currentStreak > progress.longestStreak) {
      progress.longestStreak = progress.currentStreak;
    }
  }

  // Check if user has taken photo today
  static async hasTakenPhotoToday(): Promise<boolean> {
    try {
      const progress = await this.getUserProgress();
      if (!progress || !progress.lastPhotoDate) return false;
      
      const today = new Date();
      const lastPhotoDate = progress.lastPhotoDate;
      
      return (
        today.getDate() === lastPhotoDate.getDate() &&
        today.getMonth() === lastPhotoDate.getMonth() &&
        today.getFullYear() === lastPhotoDate.getFullYear()
      );
    } catch (error) {
      console.error('Error checking if photo taken today:', error);
      return false;
    }
  }

  // Get photos for specific day
  static async getPhotosForDay(dayNumber: number): Promise<StoredPhoto[]> {
    try {
      const progress = await this.getUserProgress();
      if (!progress) return [];
      
      return progress.photos.filter(photo => photo.dayNumber === dayNumber);
    } catch (error) {
      console.error('Error getting photos for day:', error);
      return [];
    }
  }

  // Clear all data
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.USER_PROFILE_KEY,
        this.USER_PROGRESS_KEY,
        this.APP_STATE_KEY,
      ]);
      
      // Delete photos directory
      const dirInfo = await FileSystem.getInfoAsync(this.PHOTOS_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.PHOTOS_DIR);
      }
      
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Check app initialization status
  static async checkInitialization(): Promise<{ isInitialized: boolean; needsOnboarding: boolean }> {
    try {
      const appStateData = await AsyncStorage.getItem(this.APP_STATE_KEY);
      const userProfileData = await AsyncStorage.getItem(this.USER_PROFILE_KEY);
      
      if (!appStateData || !userProfileData) {
        return { isInitialized: false, needsOnboarding: true };
      }
      
      const appState = JSON.parse(appStateData);
      return {
        isInitialized: appState.isInitialized || false,
        needsOnboarding: !appState.onboardingCompleted,
      };
    } catch (error) {
      console.error('Error checking initialization:', error);
      return { isInitialized: false, needsOnboarding: true };
    }
  }
}

export default StorageService;
