import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { colors, spacing, typography, borderRadius } from '../constants/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import storageService from '../services/StorageService';
import useNotifications from '../hooks/useNotifications';

export default function ProfileScreen() {
  const {
    settings: notificationSettings,
    hasPermissions,
    updateSettings,
    requestPermissions,
    sendTestNotification,
    getScheduledCount,
  } = useNotifications();

  const [userProfile, setUserProfile] = useState(() => storageService.getUserProfile());
  const [statistics, setStatistics] = useState(() => storageService.getStatistics());
  const [reminderTime, setReminderTime] = useState(notificationSettings.dailyReminder.time);
  const [isEditingTime, setIsEditingTime] = useState(false);

  const refreshData = () => {
    setUserProfile(storageService.getUserProfile());
    setStatistics(storageService.getStatistics());
  };

  const handlePermissionRequest = async () => {
    const granted = await requestPermissions();
    if (granted) {
      Alert.alert('Success', 'Notification permissions granted!');
    } else {
      Alert.alert(
        'Permissions Required',
        'Please enable notifications in your device settings to receive reminders.'
      );
    }
  };

  const handleToggleNotification = async (key: string, value: boolean) => {
    const updates = {
      ...notificationSettings,
      [key]: {
        ...notificationSettings[key as keyof typeof notificationSettings],
        enabled: value,
      },
    };
    
    const success = await updateSettings(updates as any);
    if (!success) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleTimeUpdate = async () => {
    if (!isValidTime(reminderTime)) {
      Alert.alert('Invalid Time', 'Please enter a valid time in HH:MM format');
      return;
    }

    const updates = {
      dailyReminder: {
        ...notificationSettings.dailyReminder,
        time: reminderTime,
      },
    };

    const success = await updateSettings(updates);
    if (success) {
      setIsEditingTime(false);
      Alert.alert('Success', 'Reminder time updated successfully!');
    } else {
      Alert.alert('Error', 'Failed to update reminder time');
    }
  };

  const isValidTime = (time: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      Alert.alert('Test Sent', 'Check your notifications!');
    } else {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete all your progress photos and data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.clearAllData();
              refreshData();
              Alert.alert('Success', 'All data has been reset');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
    );
  };

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </Card>
  );

  const SettingsRow = ({ 
    title, 
    subtitle, 
    value, 
    onToggle, 
    disabled = false 
  }: { 
    title: string; 
    subtitle?: string; 
    value: boolean; 
    onToggle: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View style={[styles.settingsRow, disabled && styles.settingsRowDisabled]}>
      <View style={styles.settingsText}>
        <Text style={[styles.settingsTitle, disabled && styles.disabledText]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingsSubtitle, disabled && styles.disabledText]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.surface, true: colors.primary[500] }}
        thumbColor={value ? colors.primary[400] : colors.text.tertiary}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile & Settings</Text>
          <TouchableOpacity onPress={refreshData} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* User Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.dayNumber}</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.totalPhotos}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.completionRate}%</Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {userProfile ? format(storageService.getStartDate() || new Date(), 'MMM d') : '-'}
              </Text>
              <Text style={styles.statLabel}>Started</Text>
            </View>
          </View>
        </Card>

        {/* Notifications */}
        <SettingsSection title="📱 Notifications">
          {!hasPermissions && (
            <View style={styles.permissionWarning}>
              <Ionicons name="warning-outline" size={20} color={colors.warning} />
              <Text style={styles.permissionText}>
                Notification permissions are required for reminders
              </Text>
              <Button
                title="Enable"
                onPress={handlePermissionRequest}
                size="small"
                style={styles.permissionButton}
              />
            </View>
          )}

          <SettingsRow
            title="Daily Reminder"
            subtitle="Get reminded to take your daily photo"
            value={notificationSettings.dailyReminder.enabled}
            onToggle={(value) => handleToggleNotification('dailyReminder', value)}
            disabled={!hasPermissions}
          />

          {/* Time Picker */}
          <View style={styles.timePickerRow}>
            <Text style={styles.timeLabel}>Reminder Time:</Text>
            {isEditingTime ? (
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={styles.timeInput}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numbers-and-punctuation"
                />
                <TouchableOpacity onPress={handleTimeUpdate} style={styles.timeButton}>
                  <Ionicons name="checkmark" size={20} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setReminderTime(notificationSettings.dailyReminder.time);
                    setIsEditingTime(false);
                  }} 
                  style={styles.timeButton}
                >
                  <Ionicons name="close" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setIsEditingTime(true)}
                style={styles.timeDisplay}
                disabled={!hasPermissions}
              >
                <Text style={[styles.timeText, !hasPermissions && styles.disabledText]}>
                  {reminderTime}
                </Text>
                <Ionicons 
                  name="create-outline" 
                  size={16} 
                  color={hasPermissions ? colors.text.secondary : colors.text.tertiary} 
                />
              </TouchableOpacity>
            )}
          </View>

          <SettingsRow
            title="Streak Celebrations"
            subtitle="Celebrate milestone achievements"
            value={notificationSettings.streakCelebration.enabled}
            onToggle={(value) => handleToggleNotification('streakCelebration', value)}
            disabled={!hasPermissions}
          />

          <SettingsRow
            title="Weekly Progress"
            subtitle="Weekly summary of your progress"
            value={notificationSettings.weeklyProgress.enabled}
            onToggle={(value) => handleToggleNotification('weeklyProgress', value)}
            disabled={!hasPermissions}
          />

          {hasPermissions && (
            <TouchableOpacity onPress={handleTestNotification} style={styles.testButton}>
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          )}
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection title="📊 Data Management">
          <View style={styles.dataInfo}>
            <Text style={styles.dataText}>
              Your photos are stored locally on your device. Use the export feature to backup your progress.
            </Text>
          </View>
          
          <Button
            title="Reset All Data"
            onPress={handleResetData}
            variant="outline"
            style={styles.resetButton}
          />
        </SettingsSection>

        {/* App Info */}
        <SettingsSection title="ℹ️ App Information">
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build:</Text>
            <Text style={styles.infoValue}>MVP Release</Text>
          </View>
        </SettingsSection>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built with ❤️ for your fitness journey
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  refreshButton: {
    padding: spacing.sm,
  },
  statsCard: {
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsRowDisabled: {
    opacity: 0.5,
  },
  settingsText: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  settingsSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  disabledText: {
    color: colors.text.tertiary,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  permissionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  permissionButton: {
    marginLeft: spacing.sm,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  timeLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  timeText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minWidth: 80,
    textAlign: 'center',
  },
  timeButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  testButton: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  testButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.medium,
  },
  dataInfo: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  dataText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  resetButton: {
    borderColor: colors.error,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
