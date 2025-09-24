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
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';

import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { PhotoAngle } from '../types';
import storageService, { StoredPhoto } from '../services/StorageService';
import Card from '../components/Card';
import Button from '../components/Button';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - spacing.md * 2 - spacing.sm * 2) / 3;

type FilterType = 'all' | PhotoAngle;

export default function ProgressScreen() {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<StoredPhoto[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState({
    totalPhotos: 0,
    dayNumber: 1,
    completionRate: 0,
    photosByAngle: { front: 0, side: 0, back: 0 },
  });

  useFocusEffect(
    React.useCallback(() => {
      loadPhotos();
    }, [])
  );

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const allPhotos = storageService.getAllPhotos();
      const stats = storageService.getStatistics();
      
      // Sort photos by timestamp (newest first)
      const sortedPhotos = allPhotos.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
      
      setPhotos(sortedPhotos);
      setStatistics(stats);
      
      // Apply current filter
      filterPhotos(sortedPhotos, activeFilter);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const filterPhotos = (photosToFilter: StoredPhoto[], filter: FilterType) => {
    if (filter === 'all') {
      setFilteredPhotos(photosToFilter);
    } else {
      const filtered = photosToFilter.filter(photo => photo.angle === filter);
      setFilteredPhotos(filtered);
    }
  };

  const handleFilterPress = (filter: FilterType) => {
    setActiveFilter(filter);
    filterPhotos(photos, filter);
  };

  const renderPhotoItem = ({ item }: { item: StoredPhoto }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => handlePhotoPress(item)}
    >
      <Image
        source={{ uri: item.localPath }}
        style={styles.photoImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.photoOverlay}>
        <Text style={styles.photoDayLabel}>Day {item.dayNumber}</Text>
        <Text style={styles.photoAngleLabel}>{item.angle.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );

  const handlePhotoPress = (photo: StoredPhoto) => {
    // TODO: Open photo viewer/details
    console.log('Photo pressed:', photo);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="camera-outline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No Photos Yet</Text>
      <Text style={styles.emptyMessage}>
        Start your fitness journey by taking your first progress photo!
      </Text>
      <Button
        title="Take First Photo"
        onPress={() => {
          // TODO: Navigate to camera
          console.log('Navigate to camera');
        }}
        style={styles.emptyButton}
      />
    </View>
  );

  const renderFilterButtons = () => {
    const filters: { key: FilterType; label: string; icon: string }[] = [
      { key: 'all', label: 'All', icon: 'apps' },
      { key: 'front', label: 'Front', icon: 'person' },
      { key: 'side', label: 'Side', icon: 'person-outline' },
      { key: 'back', label: 'Back', icon: 'person-remove' },
    ];

    return (
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              activeFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterPress(filter.key)}
          >
            <Ionicons
              name={filter.icon as any}
              size={20}
              color={
                activeFilter === filter.key 
                  ? colors.text.inverse 
                  : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === filter.key && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
            {activeFilter === filter.key && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {filter.key === 'all' 
                    ? statistics.totalPhotos 
                    : statistics.photosByAngle[filter.key] || 0
                  }
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Progress Gallery</Text>
        <Text style={styles.subtitle}>
          {statistics.totalPhotos} photos • Day {statistics.dayNumber}
        </Text>
      </View>

      {/* Statistics Card */}
      {statistics.totalPhotos > 0 && (
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.completionRate}%</Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.photosByAngle.front}</Text>
              <Text style={styles.statLabel}>Front</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.photosByAngle.side}</Text>
              <Text style={styles.statLabel}>Side</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.photosByAngle.back}</Text>
              <Text style={styles.statLabel}>Back</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Filter Buttons */}
      {statistics.totalPhotos > 0 && renderFilterButtons()}

      {/* Photos Grid */}
      {statistics.totalPhotos === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredPhotos}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.photoGrid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            activeFilter !== 'all' ? (
              <View style={styles.noFilterResults}>
                <Text style={styles.noFilterText}>
                  No {activeFilter} photos yet
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
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
  statsCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  statsRow: {
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: colors.primary[500],
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  filterButtonTextActive: {
    color: colors.text.inverse,
  },
  filterBadge: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    backgroundColor: colors.accent.protein,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  filterBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  photoGrid: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
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
  photoDayLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: 'white',
  },
  photoAngleLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  noFilterResults: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noFilterText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
