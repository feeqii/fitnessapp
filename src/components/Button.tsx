import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  
  const getButtonStyle = () => {
    let sizeStyle: ViewStyle = {};
    switch (size) {
      case 'small':
        sizeStyle = styles.small;
        break;
      case 'medium':
        sizeStyle = styles.medium;
        break;
      case 'large':
        sizeStyle = styles.large;
        break;
    }
    
    const baseStyle: ViewStyle = {
      ...styles.base,
      ...sizeStyle,
      ...(fullWidth && styles.fullWidth),
    };

    switch (variant) {
      case 'secondary':
        return { ...baseStyle, ...styles.secondary };
      case 'outline':
        return { ...baseStyle, ...styles.outline };
      case 'ghost':
        return { ...baseStyle, ...styles.ghost };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    let sizeStyle: TextStyle = {};
    switch (size) {
      case 'small':
        sizeStyle = styles.smallText;
        break;
      case 'medium':
        sizeStyle = styles.mediumText;
        break;
      case 'large':
        sizeStyle = styles.largeText;
        break;
    }
    
    const baseTextStyle: TextStyle = {
      ...styles.text,
      ...sizeStyle,
    };

    switch (variant) {
      case 'secondary':
        return { ...baseTextStyle, color: colors.text.primary };
      case 'outline':
        return { ...baseTextStyle, color: colors.primary[400] };
      case 'ghost':
        return { ...baseTextStyle, color: colors.primary[400] };
      default:
        return { ...baseTextStyle, color: colors.text.inverse };
    }
  };

  const renderContent = () => (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? 'white' : colors.primary[400]}
          style={styles.loader}
        />
      )}
      <Text style={[getTextStyle(), textStyle, loading && styles.loadingText]}>
        {title}
      </Text>
    </>
  );

  if (variant === 'primary' && !isDisabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[getButtonStyle(), { opacity: isDisabled ? 0.6 : 1 }, style]}
        testID={testID}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.primary[500], colors.primary[600]]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[getButtonStyle(), { opacity: isDisabled ? 0.6 : 1 }, style]}
      testID={testID}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Sizes
  small: {
    height: 36,
    paddingHorizontal: spacing.md,
  },
  medium: {
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  large: {
    height: 56,
    paddingHorizontal: spacing.xl,
  },
  
  // Variants
  secondary: {
    backgroundColor: colors.surfaceSecondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[400],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // Text styles
  text: {
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  smallText: {
    fontSize: typography.fontSize.sm,
  },
  mediumText: {
    fontSize: typography.fontSize.base,
  },
  largeText: {
    fontSize: typography.fontSize.lg,
  },
  
  // States
  fullWidth: {
    width: '100%',
  },
  loader: {
    marginRight: spacing.sm,
  },
  loadingText: {
    opacity: 0.8,
  },
  
  // Gradient
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
