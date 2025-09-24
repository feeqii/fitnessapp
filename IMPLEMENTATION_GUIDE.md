# ProgressPal - Technical Implementation Guide

## 🚀 **IMMEDIATE NEXT STEPS** (Priority Order)

---

## 1. **Photo Storage & Management System** ⭐ **START HERE**

### **Implementation Steps:**

#### **Step 1: Install Storage Dependencies**
```bash
npm install react-native-mmkv @react-native-async-storage/async-storage
```

#### **Step 2: Create Storage Service**
Create `src/services/StorageService.ts`:

```typescript
import { MMKV } from 'react-native-mmkv';
import * as FileSystem from 'expo-file-system';

const storage = new MMKV();

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

class StorageService {
  private static readonly PHOTOS_KEY = 'progress_photos';
  private static readonly USER_PROGRESS_KEY = 'user_progress';
  private static readonly PHOTOS_DIR = `${FileSystem.documentDirectory}progress_photos/`;

  // Initialize photos directory
  static async initialize() {
    const dirInfo = await FileSystem.getInfoAsync(this.PHOTOS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.PHOTOS_DIR, { intermediates: true });
    }
  }

  // Save photo to local storage
  static async savePhoto(photoUri: string, angle: 'front' | 'side' | 'back'): Promise<StoredPhoto> {
    await this.initialize();
    
    const progress = this.getUserProgress();
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
        width: 0, // TODO: Get from image
        height: 0, // TODO: Get from image
      },
    };
    
    // Update storage
    this.addPhotoToStorage(storedPhoto);
    this.updateStreakData(new Date());
    
    return storedPhoto;
  }

  // Get user progress data
  static getUserProgress(): UserProgress {
    const stored = storage.getString(this.USER_PROGRESS_KEY);
    if (!stored) {
      const defaultProgress: UserProgress = {
        startDate: new Date(),
        currentStreak: 0,
        longestStreak: 0,
        totalPhotos: 0,
        lastPhotoDate: null,
        photos: [],
      };
      this.setUserProgress(defaultProgress);
      return defaultProgress;
    }
    return JSON.parse(stored);
  }

  // Set user progress data
  static setUserProgress(progress: UserProgress) {
    storage.set(this.USER_PROGRESS_KEY, JSON.stringify(progress));
  }

  // Calculate current day number
  static calculateDayNumber(startDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Update streak data
  static updateStreakData(photoDate: Date) {
    const progress = this.getUserProgress();
    const today = new Date().toDateString();
    const photoDateStr = photoDate.toDateString();
    
    if (photoDateStr === today) {
      // Photo taken today
      if (progress.lastPhotoDate) {
        const lastDateStr = new Date(progress.lastPhotoDate).toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (lastDateStr === yesterdayStr) {
          // Consecutive day
          progress.currentStreak += 1;
        } else if (lastDateStr !== today) {
          // Gap in photos
          progress.currentStreak = 1;
        }
        // If lastDateStr === today, don't increment (already taken today)
      } else {
        // First photo ever
        progress.currentStreak = 1;
      }
      
      progress.lastPhotoDate = photoDate;
      progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);
      
      this.setUserProgress(progress);
    }
  }

  // Add photo to storage
  private static addPhotoToStorage(photo: StoredPhoto) {
    const progress = this.getUserProgress();
    progress.photos.push(photo);
    progress.totalPhotos = progress.photos.length;
    this.setUserProgress(progress);
  }

  // Get photos by day or angle
  static getPhotos(filters?: { dayNumber?: number; angle?: string }): StoredPhoto[] {
    const progress = this.getUserProgress();
    let photos = progress.photos;
    
    if (filters?.dayNumber) {
      photos = photos.filter(p => p.dayNumber === filters.dayNumber);
    }
    
    if (filters?.angle) {
      photos = photos.filter(p => p.angle === filters.angle);
    }
    
    return photos.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export default StorageService;
```

#### **Step 3: Update PhotoPreviewScreen**
Update the `handleSave` function in PhotoPreviewScreen:

```typescript
const handleSave = async () => {
  try {
    setIsSaving(true);
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Save to device gallery
    const asset = await MediaLibrary.createAssetAsync(photoUri);
    
    // Save to app storage with metadata
    const storedPhoto = await StorageService.savePhoto(photoUri, angle);
    
    Alert.alert(
      'Photo Saved!',
      `Great job! Day ${storedPhoto.dayNumber} progress photo captured.`,
      [
        {
          text: 'View Progress',
          onPress: () => (navigation as any).navigate('Main'),
        },
        {
          text: 'Done',
          onPress: () => navigation.navigate('Main'),
          style: 'default',
        },
      ]
    );

  } catch (error) {
    console.error('Error saving photo:', error);
    Alert.alert('Error', 'Failed to save photo. Please try again.');
  } finally {
    setIsSaving(false);
  }
};
```

#### **Step 4: Update HomeScreen with Real Data**
Update HomeScreen to use real storage data:

```typescript
import StorageService from '../services/StorageService';

export default function HomeScreen({ navigation }: Props) {
  const [progress, setProgress] = useState(StorageService.getUserProgress());
  const [todayPhotoTaken, setTodayPhotoTaken] = useState(false);

  useEffect(() => {
    const checkTodayPhoto = () => {
      const today = new Date().toDateString();
      const todayPhotos = progress.photos.filter(
        p => new Date(p.timestamp).toDateString() === today
      );
      setTodayPhotoTaken(todayPhotos.length > 0);
    };

    checkTodayPhoto();
  }, [progress]);

  const dayNumber = StorageService.calculateDayNumber(progress.startDate);

  // Rest of component...
```

---

## 2. **Progress Screen Implementation** ⭐ **NEXT PRIORITY**

### **Implementation Steps:**

#### **Step 1: Create Progress Screen**
Replace `src/screens/ProgressScreen.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '../constants/theme';
import StorageService, { StoredPhoto } from '../services/StorageService';
import Card from '../components/Card';
import Button from '../components/Button';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - spacing.lg * 2 - spacing.md * 2) / 3;

export default function ProgressScreen() {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<'all' | 'front' | 'side' | 'back'>('all');
  const [progress, setProgress] = useState(StorageService.getUserProgress());

  useEffect(() => {
    loadPhotos();
  }, [selectedAngle]);

  const loadPhotos = () => {
    const filters = selectedAngle !== 'all' ? { angle: selectedAngle } : {};
    const loadedPhotos = StorageService.getPhotos(filters);
    setPhotos(loadedPhotos);
  };

  const renderPhotoItem = ({ item }: { item: StoredPhoto }) => (
    <TouchableOpacity style={styles.photoItem}>
      <Image source={{ uri: item.localPath }} style={styles.photoImage} />
      <View style={styles.photoOverlay}>
        <Text style={styles.dayText}>Day {item.dayNumber}</Text>
        <Text style={styles.angleText}>{item.angle.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );

  const angleFilters = [
    { key: 'all', label: 'All', icon: 'grid-outline' },
    { key: 'front', label: 'Front', icon: 'person-outline' },
    { key: 'side', label: 'Side', icon: 'person' },
    { key: 'back', label: 'Back', icon: 'person-circle-outline' },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>
          {progress.totalPhotos} photos • {progress.currentStreak} day streak
        </Text>
      </View>

      {/* Filter Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {angleFilters.map((filter) => (
          <Button
            key={filter.key}
            title={filter.label}
            onPress={() => setSelectedAngle(filter.key)}
            variant={selectedAngle === filter.key ? 'primary' : 'outline'}
            size="small"
            style={styles.filterButton}
          />
        ))}
      </ScrollView>

      {/* Photos Grid */}
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.photosGrid}
        ListEmptyComponent={
          <Card style={styles.emptyState}>
            <Ionicons name="camera-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>
              Start taking progress photos to see them here
            </Text>
          </Card>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  filterContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  filterButton: {
    marginRight: spacing.sm,
  },
  photosGrid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    marginRight: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.xs,
  },
  dayText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: 'white',
  },
  angleText: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    marginTop: spacing['2xl'],
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
```

---

## 3. **Push Notifications System** ⭐ **HIGH IMPACT**

### **Implementation Steps:**

#### **Step 1: Install Dependencies**
```bash
expo install expo-notifications expo-device expo-constants
```

#### **Step 2: Create Notifications Service**
Create `src/services/NotificationService.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  }

  // Schedule daily reminder
  static async scheduleDailyReminder(hour: number = 18, minute: number = 0) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📸 Time for your progress photo!",
        body: "Keep your streak going - take today's progress photo",
        data: { type: 'daily_reminder' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  }

  // Streak milestone notification
  static async scheduleStreakMilestone(streakCount: number) {
    let title = '';
    let body = '';
    
    if (streakCount === 7) {
      title = "🔥 7-Day Streak!";
      body = "Amazing! You've been consistent for a whole week!";
    } else if (streakCount === 30) {
      title = "🎉 30-Day Streak!";
      body = "Incredible! Your first timelapse is ready!";
    } else if (streakCount % 10 === 0) {
      title = `🔥 ${streakCount}-Day Streak!`;
      body = `You're on fire! ${streakCount} days of consistency!`;
    }
    
    if (title) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { type: 'streak_milestone' } },
        trigger: null, // Send immediately
      });
    }
  }

  // Grace period reminder
  static async scheduleGracePeriodReminder() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Don't break your streak!",
        body: "You still have time to take today's photo",
        data: { type: 'grace_period' },
      },
      trigger: {
        seconds: 2 * 60 * 60, // 2 hours later
      },
    });
  }
}

export default NotificationService;
```

#### **Step 3: Add Settings Screen**
Create basic settings for notification preferences:

```typescript
// In ProfileScreen or dedicated SettingsScreen
const [notificationTime, setNotificationTime] = useState(18); // 6 PM default

const updateNotificationTime = async (hour: number) => {
  setNotificationTime(hour);
  await NotificationService.scheduleDailyReminder(hour, 0);
  // Save to storage
  storage.set('notification_hour', hour);
};
```

---

## 4. **30-Day Timelapse Generation** ⭐ **CORE FEATURE**

### **Research & Implementation:**

#### **Step 1: Research Video Libraries**
```bash
# Option 1: FFmpeg (most powerful)
expo install expo-av
npm install react-native-ffmpeg

# Option 2: Simpler approach
npm install react-native-video-processing
```

#### **Step 2: Create Timelapse Service**
Create `src/services/TimelapseService.ts`:

```typescript
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

class TimelapseService {
  static async generateTimelapse(photos: StoredPhoto[], startDay: number = 1): Promise<string> {
    // Filter photos for the 30-day period
    const dayPhotos = photos.filter(
      p => p.dayNumber >= startDay && p.dayNumber < startDay + 30
    );
    
    if (dayPhotos.length < 10) {
      throw new Error('Need at least 10 photos to generate timelapse');
    }
    
    // Sort by day number
    dayPhotos.sort((a, b) => a.dayNumber - b.dayNumber);
    
    // Process each photo with day overlay
    const processedPhotos = await Promise.all(
      dayPhotos.map(photo => this.addDayOverlay(photo))
    );
    
    // TODO: Combine into video using FFmpeg or similar
    // This requires native video processing capabilities
    
    return 'path/to/generated/video.mp4';
  }
  
  private static async addDayOverlay(photo: StoredPhoto): Promise<string> {
    // Use expo-image-manipulator to add text overlay
    // This is a simplified version - full implementation would need
    // more sophisticated text rendering
    
    const result = await manipulateAsync(
      photo.localPath,
      [
        { resize: { width: 1080, height: 1920 } }, // Vertical format
      ],
      { compress: 0.8, format: SaveFormat.JPEG }
    );
    
    return result.uri;
  }
}

export default TimelapseService;
```

---

## 5. **Quick Wins & Polish** ⭐ **IMMEDIATE IMPROVEMENTS**

### **Fix Navigation Types**
```typescript
// Update src/types/index.ts
export type RootStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  Camera: { angle: 'front' | 'side' | 'back' };
  PhotoPreview: { photoUri: string; angle: PhotoAngle };
  Progress: undefined;
  Settings: undefined;
  Timelapse: { videoId?: string };
};
```

### **Add Loading States**
```typescript
// Add to components that need loading
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      // Load data
    } finally {
      setIsLoading(false);
    }
  };
  loadData();
}, []);
```

### **Error Boundaries**
```typescript
// Create src/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong. Please restart the app.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## 🎯 **TESTING STRATEGY**

### **Manual Testing Checklist**
- [ ] Complete onboarding flow
- [ ] Take photos with all angles (front/side/back)
- [ ] Verify photo storage and retrieval
- [ ] Test streak calculations
- [ ] Check notification permissions and scheduling
- [ ] Test app backgrounding/foregrounding
- [ ] Verify photo gallery filtering
- [ ] Test camera permissions on different devices

### **Performance Testing**
- [ ] Memory usage with large photo collections
- [ ] App startup time
- [ ] Camera loading time
- [ ] Photo processing speed
- [ ] Storage read/write performance

---

## 🚀 **DEPLOYMENT PREPARATION**

### **Pre-Deploy Checklist**
- [ ] Remove all console.log statements
- [ ] Add proper error handling
- [ ] Optimize image compression
- [ ] Test on multiple device sizes
- [ ] Verify all permissions work correctly
- [ ] Test offline functionality
- [ ] Add app icon and splash screen
- [ ] Create privacy policy

### **EAS Build Setup**
```bash
npm install -g @expo/cli
eas build:configure
eas build --platform ios
```

---

**This implementation guide provides a clear roadmap to complete the ProgressPal MVP. Start with the storage system as it's the foundation for all other features, then move through the priority list systematically.**




