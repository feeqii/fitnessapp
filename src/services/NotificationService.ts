import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for notification settings
const STORAGE_PREFIX = 'notifications_';

// AsyncStorage helper functions
const storage = {
  async set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_PREFIX + key, value);
  },
  
  async getString(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_PREFIX + key);
  },
  
  async delete(key: string): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_PREFIX + key);
  }
};

// Storage keys
const NOTIFICATION_KEYS = {
  SETTINGS: 'notification_settings',
  PERMISSION_GRANTED: 'permission_granted',
  PUSH_TOKEN: 'push_token',
  DAILY_REMINDER_ID: 'daily_reminder_id',
  STREAK_CELEBRATION_ENABLED: 'streak_celebration_enabled',
} as const;

export interface NotificationSettings {
  dailyReminder: {
    enabled: boolean;
    time: string; // HH:MM format
  };
  streakCelebration: {
    enabled: boolean;
    milestones: number[]; // [7, 14, 30, 60, 90, 180, 365]
  };
  weeklyProgress: {
    enabled: boolean;
    day: number; // 0-6 (Sunday-Saturday)
    time: string; // HH:MM format
  };
  graceReminder: {
    enabled: boolean;
    hoursAfterMissed: number; // Hours to wait before sending grace reminder
  };
}

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminder: {
    enabled: true,
    time: '18:00', // 6 PM
  },
  streakCelebration: {
    enabled: true,
    milestones: [3, 7, 14, 30, 60, 90, 180, 365],
  },
  weeklyProgress: {
    enabled: true,
    day: 0, // Sunday
    time: '10:00', // 10 AM
  },
  graceReminder: {
    enabled: true,
    hoursAfterMissed: 12, // 12 hours after missing daily photo
  },
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private isInitialized = false;
  private pushToken: string | null = null;

  constructor() {
    this.initializeDefaults();
  }

  // Initialize with default settings if not exists
  private initializeDefaults() {
    const existingSettings = this.getSettings();
    if (!existingSettings) {
      this.saveSettings(DEFAULT_SETTINGS);
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Must use physical device for push notifications');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      // Get push token for this device
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.pushToken = pushTokenData.data;
      await storage.set(NOTIFICATION_KEYS.PUSH_TOKEN, this.pushToken);
      await storage.set(NOTIFICATION_KEYS.PERMISSION_GRANTED, 'true');

      this.isInitialized = true;
      console.log('Notifications initialized successfully');
      return true;

    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Check if permissions are granted
  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // Get notification settings
  async getSettings(): Promise<NotificationSettings> {
    try {
      const settingsData = await storage.getString(NOTIFICATION_KEYS.SETTINGS);
      if (!settingsData) return DEFAULT_SETTINGS;
      
      return JSON.parse(settingsData);
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  // Save notification settings
  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await storage.set(NOTIFICATION_KEYS.SETTINGS, JSON.stringify(settings));
      
      // Re-schedule notifications with new settings
      this.scheduleAllNotifications();
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  // Update specific setting
  updateSettings(updates: Partial<NotificationSettings>): void {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    this.saveSettings(newSettings);
  }

  // Schedule daily reminder notification
  async scheduleDailyReminder(): Promise<void> {
    try {
      const settings = this.getSettings();
      
      if (!settings.dailyReminder.enabled) {
        await this.cancelDailyReminder();
        return;
      }

      // Cancel existing reminder
      await this.cancelDailyReminder();

      const [hours, minutes] = settings.dailyReminder.time.split(':').map(Number);
      
      const trigger = {
        hour: hours,
        minute: minutes,
        repeats: true,
      } as const;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📸 Time for your progress photo!',
          body: "Don't break your streak! Take today's progress photo to keep your momentum going.",
          data: { type: 'daily_reminder' },
          sound: true,
        },
        trigger,
      });

      await storage.set(NOTIFICATION_KEYS.DAILY_REMINDER_ID, identifier);
      console.log('Daily reminder scheduled for', settings.dailyReminder.time);

    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }

  // Cancel daily reminder
  async cancelDailyReminder(): Promise<void> {
    try {
      const existingId = await storage.getString(NOTIFICATION_KEYS.DAILY_REMINDER_ID);
      if (existingId) {
        await Notifications.cancelScheduledNotificationAsync(existingId);
        await storage.delete(NOTIFICATION_KEYS.DAILY_REMINDER_ID);
      }
    } catch (error) {
      console.error('Error canceling daily reminder:', error);
    }
  }

  // Send streak celebration notification
  async sendStreakCelebration(streakDays: number): Promise<void> {
    try {
      const settings = this.getSettings();
      
      if (!settings.streakCelebration.enabled) return;
      
      // Check if this milestone should be celebrated
      if (!settings.streakCelebration.milestones.includes(streakDays)) return;

      let title: string;
      let body: string;
      let emoji: string;

      if (streakDays <= 7) {
        emoji = '🔥';
        title = `${emoji} ${streakDays} Day Streak!`;
        body = "You're building momentum! Keep going strong!";
      } else if (streakDays <= 30) {
        emoji = '💪';
        title = `${emoji} ${streakDays} Day Streak!`;
        body = "Amazing consistency! Your dedication is showing results!";
      } else if (streakDays <= 90) {
        emoji = '🚀';
        title = `${emoji} ${streakDays} Day Streak!`;
        body = "Incredible! You're a progress tracking champion!";
      } else {
        emoji = '👑';
        title = `${emoji} ${streakDays} Day Streak!`;
        body = "LEGENDARY! You're an inspiration to everyone!";
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            type: 'streak_celebration',
            streakDays,
          },
          sound: true,
        },
        trigger: null, // Send immediately
      });

      console.log(`Streak celebration sent for ${streakDays} days`);

    } catch (error) {
      console.error('Error sending streak celebration:', error);
    }
  }

  // Send grace period reminder
  async scheduleGraceReminder(): Promise<void> {
    try {
      const settings = this.getSettings();
      
      if (!settings.graceReminder.enabled) return;

      const delayHours = settings.graceReminder.hoursAfterMissed;
      const triggerDate = new Date();
      triggerDate.setHours(triggerDate.getHours() + delayHours);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Don\'t lose your streak!',
          body: 'You haven\'t taken your progress photo today. Take it now to keep your streak alive!',
          data: { type: 'grace_reminder' },
          sound: true,
        },
        trigger: {
          date: triggerDate,
        },
      });

      console.log(`Grace reminder scheduled for ${delayHours} hours from now`);

    } catch (error) {
      console.error('Error scheduling grace reminder:', error);
    }
  }

  // Send weekly progress summary
  async scheduleWeeklyProgress(): Promise<void> {
    try {
      const settings = this.getSettings();
      
      if (!settings.weeklyProgress.enabled) return;

      const [hours, minutes] = settings.weeklyProgress.time.split(':').map(Number);
      
      const trigger = {
        weekday: settings.weeklyProgress.day + 1, // Expo uses 1-7 (Sunday-Saturday)
        hour: hours,
        minute: minutes,
        repeats: true,
      } as const;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Weekly Progress Update',
          body: 'Check out your weekly progress and see how far you\'ve come!',
          data: { type: 'weekly_progress' },
          sound: true,
        },
        trigger,
      });

      console.log('Weekly progress notification scheduled');

    } catch (error) {
      console.error('Error scheduling weekly progress:', error);
    }
  }

  // Schedule all notifications based on current settings
  async scheduleAllNotifications(): Promise<void> {
    try {
      // Cancel all existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      const hasPermissions = await this.hasPermissions();
      if (!hasPermissions) {
        console.warn('No notification permissions - cannot schedule notifications');
        return;
      }

      // Schedule each type of notification
      await Promise.all([
        this.scheduleDailyReminder(),
        this.scheduleWeeklyProgress(),
      ]);

      console.log('All notifications scheduled successfully');

    } catch (error) {
      console.error('Error scheduling all notifications:', error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications canceled');
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  // Get scheduled notification count
  async getScheduledNotificationCount(): Promise<number> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      return scheduledNotifications.length;
    } catch (error) {
      console.error('Error getting scheduled notification count:', error);
      return 0;
    }
  }

  // Handle notification received while app is in foreground
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Handle notification tapped
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Test notification (for development)
  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from ProgressPal!',
          data: { type: 'test' },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  // Get push token for this device
  async getPushToken(): Promise<string | null> {
    return this.pushToken || await storage.getString(NOTIFICATION_KEYS.PUSH_TOKEN) || null;
  }

  // Check if notifications are properly set up
  isSetup(): boolean {
    return this.isInitialized && this.pushToken !== null;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;


