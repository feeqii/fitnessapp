// User Types
export interface UserProfile {
  id: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'weight_loss' | 'muscle_gain' | 'general_fitness' | 'body_recomposition';
  createdAt: Date;
  updatedAt: Date;
}

// Progress Photo Types
export interface ProgressPhoto {
  id: string;
  userId: string;
  dayNumber: number;
  photoUri: string;
  timestamp: Date;
  angle: 'front' | 'side' | 'back';
  metadata?: {
    fileSize: number;
    width: number;
    height: number;
  };
}

// Streak and Progress Types
export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastPhotoDate: Date | null;
  totalPhotos: number;
}

// Feedback Message Types
export interface FeedbackMessage {
  id: string;
  userId: string;
  dayNumber: number;
  message: string;
  type: 'motivational' | 'progress' | 'tip' | 'milestone';
  createdAt: Date;
}

// Timelapse Types
export interface TimelapseVideo {
  id: string;
  userId: string;
  startDay: number;
  endDay: number;
  videoUri: string;
  duration: number; // in seconds
  createdAt: Date;
  isProcessing: boolean;
}

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Main: undefined;
  Camera: {
    angle: 'front' | 'side' | 'back';
  };
  PhotoPreview: {
    photoUri: string;
    angle: 'front' | 'side' | 'back';
  };
  Progress: undefined;
  Settings: undefined;
  Timelapse: {
    videoId?: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Progress: undefined;
  Camera: undefined;
  Timelapse: undefined;
  Profile: undefined;
};

// Onboarding Types
export interface OnboardingData {
  age?: number;
  gender?: UserProfile['gender'];
  height?: number;
  weight?: number;
  activityLevel?: UserProfile['activityLevel'];
  goal?: UserProfile['goal'];
  currentStep: number;
  totalSteps: number;
}

// Storage Types
export interface AppState {
  user: UserProfile | null;
  photos: ProgressPhoto[];
  streak: UserStreak;
  feedbackMessages: FeedbackMessage[];
  timelapseVideos: TimelapseVideo[];
  isFirstLaunch: boolean;
  lastActiveDate: Date | null;
}

// Camera Types
export interface CameraOverlayGuide {
  head: { x: number; y: number; width: number; height: number };
  shoulders: { x: number; y: number; width: number; height: number };
  torso: { x: number; y: number; width: number; height: number };
  hips: { x: number; y: number; width: number; height: number };
}

// API Response Types (for future AI integration)
export interface AIFeedbackResponse {
  message: string;
  type: FeedbackMessage['type'];
  confidence: number;
  suggestions?: string[];
}

// Subscription Types (for future Pro features)
export interface SubscriptionStatus {
  isActive: boolean;
  plan: 'free' | 'pro';
  expiresAt?: Date;
  features: {
    cloudBackup: boolean;
    premiumTemplates: boolean;
    advancedAnalytics: boolean;
  };
}

// Settings Types
export interface AppSettings {
  notifications: {
    dailyReminder: boolean;
    reminderTime: string; // HH:MM format
    streakCelebration: boolean;
    weeklyProgress: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
  };
  display: {
    theme: 'dark' | 'light' | 'auto';
    reducedMotion: boolean;
  };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Loading States
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Component Props Helper Types
export interface BaseComponentProps {
  testID?: string;
  style?: any;
}

// Form Types
export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  isValid: boolean;
}

// Analytics Events (for future implementation)
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

export type GoalType = UserProfile['goal'];
export type ActivityLevel = UserProfile['activityLevel'];
export type Gender = UserProfile['gender'];
export type PhotoAngle = ProgressPhoto['angle'];
export type FeedbackType = FeedbackMessage['type'];




