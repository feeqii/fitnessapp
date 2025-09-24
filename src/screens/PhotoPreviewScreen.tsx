import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { RootStackParamList, PhotoAngle } from '../types';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import Button from '../components/Button';
import Card from '../components/Card';
import storageService from '../services/StorageService';
import notificationService from '../services/NotificationService';

type PhotoPreviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PhotoPreview'>;
type PhotoPreviewScreenRouteProp = RouteProp<RootStackParamList, 'PhotoPreview'>;

interface Props {
  navigation: PhotoPreviewScreenNavigationProp;
  route: PhotoPreviewScreenRouteProp;
}

const { width, height } = Dimensions.get('window');

export default function PhotoPreviewScreen({ navigation, route }: Props) {
  const { photoUri, angle } = route.params;
  const [isSaving, setIsSaving] = useState(false);
  const [dayNumber, setDayNumber] = useState(1);
  
  // Animation values
  const imageOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const feedbackOpacity = useSharedValue(0);

  useEffect(() => {
    // Get current day number from storage
    const currentDay = storageService.getCurrentDayNumber();
    setDayNumber(currentDay);
    
    // Animate elements on mount
    imageOpacity.value = withTiming(1, { duration: 300 });
    buttonOpacity.value = withTiming(1, { duration: 500 });
    
    // Show AI feedback after a delay
    setTimeout(() => {
      feedbackOpacity.value = withTiming(1, { duration: 500 });
    }, 1000);
  }, []);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const feedbackAnimatedStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
  }));

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Save photo with metadata using storage service
      const savedPhoto = await storageService.savePhoto(photoUri, angle, true);
      
      console.log('Photo saved successfully:', savedPhoto);
      
      // Get updated progress data
      const progress = storageService.getUserProgress();
      const streakMessage = progress.currentStreak > 1 
        ? `Amazing! You're on a ${progress.currentStreak}-day streak!`
        : 'Great start! Keep it up to build your streak!';
      
      // Trigger streak celebration if milestone reached
      if (progress.currentStreak > 0) {
        const settings = notificationService.getSettings();
        if (settings.streakCelebration.milestones.includes(progress.currentStreak)) {
          await notificationService.sendStreakCelebration(progress.currentStreak);
        }
      }
      
      Alert.alert(
        'Photo Saved!',
        `Day ${dayNumber} ${angle} view captured successfully!\n\n${streakMessage}`,
        [
          {
            text: 'View Progress',
            onPress: () => {
              // Navigate to progress screen
              const parentNavigation = navigation.getParent();
              if (parentNavigation) {
                parentNavigation.navigate('Main');
                // Then navigate to Progress tab
                setTimeout(() => {
                  (navigation as any).navigate('Progress');
                }, 100);
              } else {
                navigation.navigate('Main');
              }
            },
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
      Alert.alert(
        'Error', 
        'Failed to save photo. Please check your storage permissions and try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Photo?',
      'Are you sure you want to discard this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => navigation.navigate('Main'),
        },
      ]
    );
  };

  const getFeedbackMessage = (angle: PhotoAngle): string => {
    const messages = {
      front: "Perfect positioning! Your front view shows great symmetry. Keep up the consistency!",
      side: "Excellent side profile! This angle clearly shows your progress. Stay motivated!",
      back: "Great back view! This perspective captures important muscle development areas.",
    };
    return messages[angle];
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleDiscard}
          >
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {angle.charAt(0).toUpperCase() + angle.slice(1)} View
          </Text>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRetake}
          >
            <Ionicons name="camera-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Photo */}
        <Animated.View style={[styles.photoContainer, imageAnimatedStyle]}>
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            contentFit="cover"
            transition={300}
          />
          
          {/* Photo overlay info */}
          <View style={styles.photoOverlay}>
            <View style={styles.photoInfo}>
              <Text style={styles.photoLabel}>Day {dayNumber}</Text>
              <Text style={styles.photoAngle}>{angle.toUpperCase()}</Text>
            </View>
          </View>
        </Animated.View>

        {/* AI Feedback */}
        <Animated.View style={[styles.feedbackContainer, feedbackAnimatedStyle]}>
          <Card style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="sparkles" size={20} color={colors.primary[400]} />
              <Text style={styles.feedbackTitle}>AI Feedback</Text>
            </View>
            <Text style={styles.feedbackText}>
              {getFeedbackMessage(angle)}
            </Text>
          </Card>
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actionsContainer, buttonAnimatedStyle]}>
          <View style={styles.buttonRow}>
            <Button
              title="Retake"
              onPress={handleRetake}
              variant="outline"
              style={styles.retakeButton}
            />
            <Button
              title={isSaving ? "Saving..." : "Save Photo"}
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving}
              style={styles.saveButton}
            />
          </View>
          
          <TouchableOpacity
            style={styles.discardButton}
            onPress={handleDiscard}
          >
            <Text style={styles.discardText}>Discard Photo</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  photoContainer: {
    flex: 1,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  photoInfo: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  photoLabel: {
    fontSize: typography.fontSize.sm,
    color: 'white',
    fontWeight: typography.fontWeight.medium,
  },
  photoAngle: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  feedbackContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  feedbackCard: {
    backgroundColor: colors.surface,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  feedbackTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  feedbackText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  actionsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  retakeButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  discardButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  discardText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
