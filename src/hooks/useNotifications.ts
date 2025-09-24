import { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import notificationService, { NotificationSettings } from '../services/NotificationService';
import storageService from '../services/StorageService';

interface NotificationState {
  isSetup: boolean;
  hasPermissions: boolean;
  settings: NotificationSettings;
  isLoading: boolean;
  error: string | null;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    isSetup: false,
    hasPermissions: false,
    settings: notificationService.getSettings(),
    isLoading: true,
    error: null,
  });

  const appState = useRef(AppState.currentState);
  const notificationReceivedListener = useRef<Notifications.Subscription>();
  const responseReceivedListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    initializeNotifications();
    setupAppStateListener();
    setupNotificationListeners();

    return () => {
      cleanup();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const hasPermissions = await notificationService.hasPermissions();
      const isSetup = notificationService.isSetup();

      if (!hasPermissions) {
        // Request permissions
        const granted = await notificationService.requestPermissions();
        if (granted) {
          await notificationService.scheduleAllNotifications();
        }
      } else if (!isSetup) {
        // Re-initialize if permissions exist but service isn't set up
        await notificationService.requestPermissions();
        await notificationService.scheduleAllNotifications();
      }

      setState({
        isSetup: notificationService.isSetup(),
        hasPermissions: await notificationService.hasPermissions(),
        settings: notificationService.getSettings(),
        isLoading: false,
        error: null,
      });

    } catch (error) {
      console.error('Error initializing notifications:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize notifications',
      }));
    }
  };

  const setupAppStateListener = () => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        handleAppForeground();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return subscription;
  };

  const handleAppForeground = async () => {
    try {
      // Check if user missed their daily photo and needs a grace reminder
      const hasPhotoToday = storageService.hasPhotoToday();
      const settings = notificationService.getSettings();
      
      if (!hasPhotoToday && settings.graceReminder.enabled) {
        // Check if it's past the daily reminder time
        const now = new Date();
        const [reminderHour, reminderMinute] = settings.dailyReminder.time.split(':').map(Number);
        const reminderTime = new Date();
        reminderTime.setHours(reminderHour, reminderMinute, 0, 0);
        
        if (now > reminderTime) {
          await notificationService.scheduleGraceReminder();
        }
      }

      // Clear badge count
      await Notifications.setBadgeCountAsync(0);
      
    } catch (error) {
      console.error('Error handling app foreground:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Handle notification received while app is in foreground
    notificationReceivedListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // You could show an in-app notification here
      }
    );

    // Handle notification tapped
    responseReceivedListener.current = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        handleNotificationResponse(response);
      }
    );
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { type } = response.notification.request.content.data;
    
    switch (type) {
      case 'daily_reminder':
      case 'grace_reminder':
        // Navigate to camera or home screen
        // This would need to be handled by the navigation system
        console.log('Should navigate to camera screen');
        break;
        
      case 'streak_celebration':
        // Navigate to progress screen
        console.log('Should navigate to progress screen');
        break;
        
      case 'weekly_progress':
        // Navigate to progress screen
        console.log('Should navigate to progress screen');
        break;
        
      default:
        console.log('Unknown notification type:', type);
    }
  };

  const cleanup = () => {
    notificationReceivedListener.current?.remove();
    responseReceivedListener.current?.remove();
  };

  // Update notification settings
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const currentSettings = notificationService.getSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      
      notificationService.saveSettings(updatedSettings);
      
      setState(prev => ({
        ...prev,
        settings: updatedSettings,
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update settings',
      }));
      return false;
    }
  };

  // Request permissions manually
  const requestPermissions = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const granted = await notificationService.requestPermissions();
      
      if (granted) {
        await notificationService.scheduleAllNotifications();
      }
      
      setState(prev => ({
        ...prev,
        hasPermissions: granted,
        isSetup: notificationService.isSetup(),
        isLoading: false,
      }));
      
      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to request permissions',
      }));
      return false;
    }
  };

  // Trigger streak celebration
  const celebrateStreak = async (streakDays: number) => {
    try {
      await notificationService.sendStreakCelebration(streakDays);
      return true;
    } catch (error) {
      console.error('Error celebrating streak:', error);
      return false;
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    try {
      await notificationService.sendTestNotification();
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  };

  // Get scheduled notification count
  const getScheduledCount = async () => {
    try {
      return await notificationService.getScheduledNotificationCount();
    } catch (error) {
      console.error('Error getting scheduled count:', error);
      return 0;
    }
  };

  return {
    ...state,
    updateSettings,
    requestPermissions,
    celebrateStreak,
    sendTestNotification,
    getScheduledCount,
    refresh: initializeNotifications,
  };
};

export default useNotifications;


