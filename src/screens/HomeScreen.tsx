import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { MainTabParamList, RootStackParamList } from '../types';
import { colors, spacing, typography } from '../constants/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressRing from '../components/ProgressRing';
import storageService from '../services/StorageService';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayPhotoTaken, setTodayPhotoTaken] = useState(false);
  const [dayNumber, setDayNumber] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  
  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
      // Update last active date
      storageService.updateLastActiveDate();
    }, [])
  );
  
  const loadData = () => {
    try {
      const progress = storageService.getUserProgress();
      const statistics = storageService.getStatistics();
      
      setCurrentStreak(progress.currentStreak);
      setTotalPhotos(progress.totalPhotos);
      setLongestStreak(progress.longestStreak);
      setDayNumber(statistics.dayNumber);
      setTodayPhotoTaken(storageService.hasPhotoToday());
    } catch (error) {
      console.error('Error loading home screen data:', error);
    }
  };

  const handleTakePhoto = () => {
    console.log('Take photo button pressed'); // Debug log
    console.log('Navigation object:', navigation);
    console.log('Attempting to navigate to Camera...');
    try {
      // Try to get the parent navigator (root stack)
      const parentNavigation = navigation.getParent();
      console.log('Parent navigation:', parentNavigation);
      
      if (parentNavigation) {
        parentNavigation.navigate('Camera', { angle: 'front' });
        console.log('Parent navigate call completed');
      } else {
        // Fallback to original method
        (navigation as any).navigate('Camera', { angle: 'front' });
        console.log('Fallback navigate call completed');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleViewProgress = () => {
    (navigation as any).navigate('Progress');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ProgressPal</Text>
          <Text style={styles.greeting}>Ready for Day {dayNumber}?</Text>
        </View>

        {/* Streak Card */}
        <Card style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Ionicons name="flame" size={32} color={colors.accent.carbs} />
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
            <ProgressRing
              progress={currentStreak / 30}
              size={60}
              strokeWidth={6}
              color={colors.accent.carbs}
            />
          </View>
          <Text style={styles.streakMessage}>
            {currentStreak > 0 
              ? `Amazing! You're on a ${currentStreak}-day streak!`
              : "Start your journey today!"
            }
          </Text>
        </Card>

        {/* Today's Photo */}
        <Card style={styles.photoCard}>
          <View style={styles.photoHeader}>
            <Ionicons 
              name={todayPhotoTaken ? "checkmark-circle" : "camera"} 
              size={28} 
              color={todayPhotoTaken ? colors.success : colors.primary[400]} 
            />
            <Text style={styles.photoTitle}>
              {todayPhotoTaken ? "Today's Photo Taken!" : "Take Today's Photo"}
            </Text>
          </View>
          
          {!todayPhotoTaken ? (
            <>
              <Text style={styles.photoDescription}>
                Capture your progress for Day {dayNumber}. Remember to use the framing guide for consistency!
              </Text>
              <Button
                title="Take Photo"
                onPress={handleTakePhoto}
                fullWidth
                style={styles.photoButton}
              />
            </>
          ) : (
            <View style={styles.completedPhoto}>
              <Text style={styles.completedText}>
                Great job! You've captured your Day {dayNumber} photo.
              </Text>
              <Button
                title="View Progress"
                onPress={handleViewProgress}
                variant="outline"
                fullWidth
                style={styles.viewProgressButton}
              />
            </View>
          )}
        </Card>

        {/* Quick Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            <StatItem
              icon="calendar"
              label="Days"
              value={dayNumber.toString()}
              color={colors.primary[400]}
            />
            <StatItem
              icon="camera"
              label="Photos"
              value={totalPhotos.toString()}
              color={colors.accent.protein}
            />
            <StatItem
              icon="videocam"
              label="Timelapses"
              value={Math.floor(totalPhotos / 90).toString()}
              color={colors.accent.fats}
            />
            <StatItem
              icon="trophy"
              label="Best Streak"
              value={longestStreak.toString()}
              color={colors.accent.carbs}
            />
          </View>
        </Card>

        {/* Motivation Message */}
        <Card style={styles.motivationCard}>
          <View style={styles.motivationHeader}>
            <Ionicons name="heart" size={24} color={colors.accent.protein} />
            <Text style={styles.motivationTitle}>Daily Motivation</Text>
          </View>
          <Text style={styles.motivationText}>
            "Every photo is a step forward. Your consistency today builds the transformation of tomorrow."
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  streakCard: {
    marginBottom: spacing.md,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  streakInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  streakNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  streakLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  streakMessage: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  photoCard: {
    marginBottom: spacing.md,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  photoTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  photoDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
  photoButton: {
    marginTop: spacing.md,
  },
  completedPhoto: {
    alignItems: 'center',
  },
  completedText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  viewProgressButton: {
    marginTop: spacing.md,
  },
  statsCard: {
    marginBottom: spacing.md,
  },
  statsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  motivationCard: {
    marginBottom: spacing.xl,
  },
  motivationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  motivationTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  motivationText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
});
