import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
  style?: ViewStyle;
  testID?: string;
}

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  style,
  testID,
}: CardProps) {
  const getCardStyle = () => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      padding: spacing[padding],
    };

    switch (variant) {
      case 'elevated':
        return { ...baseStyle, ...styles.elevated, ...shadows.md };
      case 'outlined':
        return { ...baseStyle, ...styles.outlined };
      default:
        return baseStyle;
    }
  };

  return (
    <View style={[getCardStyle(), style]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  elevated: {
    backgroundColor: colors.surface,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});




