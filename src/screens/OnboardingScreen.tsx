import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
} from 'react-native-reanimated';

import { RootStackParamList, OnboardingData, Gender, ActivityLevel, GoalType, UserProfile } from '../types';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import Button from '../components/Button';
import Card from '../components/Card';
import ProgressRing from '../components/ProgressRing';
import storageService from '../services/StorageService';
import notificationService from '../services/NotificationService';

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

interface Props {
  navigation: OnboardingScreenNavigationProp;
}

const TOTAL_STEPS = 6;

export default function OnboardingScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    currentStep: 1,
    totalSteps: TOTAL_STEPS,
  });

  const slideOffset = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideOffset.value }],
  }));

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      slideOffset.value = withTiming(-300, { duration: 300 }, () => {
        slideOffset.value = 300;
        slideOffset.value = withTiming(0, { duration: 300 });
      });
      setCurrentStep(prev => prev + 1);
      updateData({ currentStep: currentStep + 1 });
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      slideOffset.value = withTiming(300, { duration: 300 }, () => {
        slideOffset.value = -300;
        slideOffset.value = withTiming(0, { duration: 300 });
      });
      setCurrentStep(prev => prev - 1);
      updateData({ currentStep: currentStep - 1 });
    }
  };

  const handleComplete = async () => {
    // Validate data
    if (!data.age || !data.gender || !data.height || !data.weight || !data.activityLevel || !data.goal) {
      Alert.alert('Please complete all fields');
      return;
    }

    try {
      // Create user profile from onboarding data
      const userProfile: UserProfile = {
        id: 'current_user', // In a real app, this would be a UUID
        age: data.age,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        activityLevel: data.activityLevel,
        goal: data.goal,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Initialize user with storage service
      await storageService.initializeUser(userProfile);
      console.log('User initialized successfully:', userProfile);

      // Request notification permissions and set up notifications
      try {
        const permissionsGranted = await notificationService.requestPermissions();
        if (permissionsGranted) {
          await notificationService.scheduleAllNotifications();
          console.log('Notifications set up successfully');
        } else {
          console.log('Notification permissions not granted - can be enabled later');
        }
      } catch (notificationError) {
        console.warn('Error setting up notifications:', notificationError);
        // Don't block onboarding if notifications fail
      }

      navigation.navigate('Main');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(
        'Setup Error',
        'There was a problem setting up your account. Please try again.',
        [
          { text: 'Retry', onPress: () => handleComplete() },
          { text: 'Skip for now', onPress: () => navigation.navigate('Main') },
        ]
      );
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return !!data.age && data.age >= 13 && data.age <= 100;
      case 2: return !!data.gender;
      case 3: return !!data.height && data.height >= 100 && data.height <= 250;
      case 4: return !!data.weight && data.weight >= 30 && data.weight <= 300;
      case 5: return !!data.activityLevel;
      case 6: return !!data.goal;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <AgeStep data={data} updateData={updateData} />;
      case 2:
        return <GenderStep data={data} updateData={updateData} />;
      case 3:
        return <HeightStep data={data} updateData={updateData} />;
      case 4:
        return <WeightStep data={data} updateData={updateData} />;
      case 5:
        return <ActivityStep data={data} updateData={updateData} />;
      case 6:
        return <GoalStep data={data} updateData={updateData} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ProgressRing
          progress={currentStep / TOTAL_STEPS}
          size={60}
          strokeWidth={6}
          color={colors.primary[400]}
          showPercentage
        />
        <Text style={styles.stepText}>
          Step {currentStep} of {TOTAL_STEPS}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={animatedStyle}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <Button
              title="Back"
              onPress={prevStep}
              variant="outline"
              style={styles.backButton}
            />
          )}
          <Button
            title={currentStep === TOTAL_STEPS ? "Get Started!" : "Continue"}
            onPress={nextStep}
            disabled={!isStepValid()}
            style={styles.continueButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// Individual step components
function AgeStep({ data, updateData }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How old are you?</Text>
      <Text style={styles.stepSubtitle}>We use this to personalize your experience</Text>
      
      <Card style={styles.inputCard}>
        <TextInput
          style={styles.numberInput}
          value={data.age?.toString() || ''}
          onChangeText={(text) => updateData({ age: parseInt(text) || undefined })}
          placeholder="Enter your age"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="numeric"
          maxLength={3}
        />
        <Text style={styles.inputUnit}>years old</Text>
      </Card>
    </View>
  );
}

function GenderStep({ data, updateData }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void }) {
  const options: { label: string; value: Gender }[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your gender?</Text>
      <Text style={styles.stepSubtitle}>This helps us provide better recommendations</Text>
      
      {options.map((option) => (
        <OptionButton
          key={option.value}
          label={option.label}
          selected={data.gender === option.value}
          onPress={() => updateData({ gender: option.value })}
        />
      ))}
    </View>
  );
}

function HeightStep({ data, updateData }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your height?</Text>
      <Text style={styles.stepSubtitle}>Enter your height in centimeters</Text>
      
      <Card style={styles.inputCard}>
        <TextInput
          style={styles.numberInput}
          value={data.height?.toString() || ''}
          onChangeText={(text) => updateData({ height: parseInt(text) || undefined })}
          placeholder="Enter your height"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="numeric"
          maxLength={3}
        />
        <Text style={styles.inputUnit}>cm</Text>
      </Card>
    </View>
  );
}

function WeightStep({ data, updateData }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your current weight?</Text>
      <Text style={styles.stepSubtitle}>Enter your weight in kilograms</Text>
      
      <Card style={styles.inputCard}>
        <TextInput
          style={styles.numberInput}
          value={data.weight?.toString() || ''}
          onChangeText={(text) => updateData({ weight: parseInt(text) || undefined })}
          placeholder="Enter your weight"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="numeric"
          maxLength={3}
        />
        <Text style={styles.inputUnit}>kg</Text>
      </Card>
    </View>
  );
}

function ActivityStep({ data, updateData }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void }) {
  const options: { label: string; value: ActivityLevel; description: string }[] = [
    { label: 'Sedentary', value: 'sedentary', description: 'Little or no exercise' },
    { label: 'Light', value: 'light', description: 'Light exercise 1-3 days/week' },
    { label: 'Moderate', value: 'moderate', description: 'Moderate exercise 3-5 days/week' },
    { label: 'Active', value: 'active', description: 'Hard exercise 6-7 days/week' },
    { label: 'Very Active', value: 'very_active', description: 'Physical job + exercise' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How active are you?</Text>
      <Text style={styles.stepSubtitle}>Select your current activity level</Text>
      
      {options.map((option) => (
        <OptionButton
          key={option.value}
          label={option.label}
          description={option.description}
          selected={data.activityLevel === option.value}
          onPress={() => updateData({ activityLevel: option.value })}
        />
      ))}
    </View>
  );
}

function GoalStep({ data, updateData }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void }) {
  const options: { label: string; value: GoalType; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Weight Loss', value: 'weight_loss', description: 'Lose weight and body fat', icon: 'trending-down' },
    { label: 'Muscle Gain', value: 'muscle_gain', description: 'Build muscle and strength', icon: 'fitness' },
    { label: 'General Fitness', value: 'general_fitness', description: 'Stay healthy and active', icon: 'heart' },
    { label: 'Body Recomposition', value: 'body_recomposition', description: 'Lose fat and gain muscle', icon: 'swap-horizontal' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your main goal?</Text>
      <Text style={styles.stepSubtitle}>We'll personalize your experience based on this</Text>
      
      {options.map((option) => (
        <OptionButton
          key={option.value}
          label={option.label}
          description={option.description}
          icon={option.icon}
          selected={data.goal === option.value}
          onPress={() => updateData({ goal: option.value })}
        />
      ))}
    </View>
  );
}

interface OptionButtonProps {
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}

function OptionButton({ label, description, icon, selected, onPress }: OptionButtonProps) {
  const cardStyle = selected 
    ? { ...styles.optionButton, borderColor: colors.primary[400], borderWidth: 2 }
    : styles.optionButton;
    
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card
        variant={selected ? 'outlined' : 'default'}
        style={cardStyle}
      >
        <View style={styles.optionContent}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={24} 
              color={selected ? colors.primary[400] : colors.text.secondary} 
              style={styles.optionIcon}
            />
          )}
          <View style={styles.optionText}>
            <Text style={[styles.optionLabel, selected && { color: colors.primary[400] }]}>
              {label}
            </Text>
            {description && (
              <Text style={styles.optionDescription}>{description}</Text>
            )}
          </View>
          {selected && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary[400]} />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  stepText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  stepContainer: {
    paddingVertical: spacing.lg,
  },
  stepTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  numberInput: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    minWidth: 100,
  },
  inputUnit: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  optionButton: {
    marginBottom: spacing.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  optionIcon: {
    marginRight: spacing.md,
  },
  optionText: {
    flex: 1,
    alignItems: 'flex-start',
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
});
