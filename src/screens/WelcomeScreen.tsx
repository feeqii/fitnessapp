import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

import { RootStackParamList } from '../types';
import { colors, spacing, typography } from '../constants/theme';
import Button from '../components/Button';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: Props) {
  const logoScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const featuresOpacity = useSharedValue(0);

  React.useEffect(() => {
    // Animate elements on mount
    logoScale.value = withSpring(1, { damping: 8 });
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    featuresOpacity.value = withDelay(900, withTiming(1, { duration: 800 }));
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const featuresAnimatedStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleGetStarted = () => {
    navigation.navigate('Onboarding');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.surface]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Logo/Icon */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <View style={styles.logoBackground}>
              <Ionicons name="fitness" size={60} color={colors.primary[400]} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.Text style={[styles.title, titleAnimatedStyle]}>
            ProgressPal
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle]}>
            Transform your progress, one photo at a time
          </Animated.Text>

          {/* Features */}
          <Animated.View style={[styles.featuresContainer, featuresAnimatedStyle]}>
            <FeatureItem 
              icon="camera-outline"
              text="Daily progress photos"
            />
            <FeatureItem 
              icon="trending-up-outline"
              text="Track your streaks"
            />
            <FeatureItem 
              icon="videocam-outline"
              text="30-day timelapse videos"
            />
            <FeatureItem 
              icon="heart-outline"
              text="Personalized motivation"
            />
          </Animated.View>

          {/* CTA Button */}
          <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              size="large"
              fullWidth
            />
            
            <Text style={styles.disclaimer}>
              Start your transformation journey today
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

function FeatureItem({ icon, text }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={24} color={colors.primary[400]} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing['2xl'],
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary[400] + '20',
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.lg,
    marginBottom: spacing['3xl'],
    paddingHorizontal: spacing.md,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: spacing['3xl'],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});




