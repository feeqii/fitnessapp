import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../constants/theme';

export default function TimelapseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Timelapse Screen - Coming Soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
  },
});




