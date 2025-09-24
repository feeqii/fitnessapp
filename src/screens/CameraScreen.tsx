import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
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
  withSequence,
} from 'react-native-reanimated';

import { RootStackParamList, PhotoAngle } from '../types';
import { colors, spacing, typography } from '../constants/theme';
import Button from '../components/Button';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;
type CameraScreenRouteProp = RouteProp<RootStackParamList, 'Camera'>;

interface Props {
  navigation: CameraScreenNavigationProp;
  route: CameraScreenRouteProp;
}

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ navigation, route }: Props) {
  console.log('CameraScreen mounted!');
  console.log('Route params:', route.params);
  
  const { angle = 'front' } = route.params || {};
  
  const [permission, requestPermission] = useCameraPermissions();
  console.log('Camera permission:', permission);
  const [facing, setFacing] = useState<CameraType>('front');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentAngle, setCurrentAngle] = useState<PhotoAngle>(angle);
  
  const cameraRef = useRef<CameraView>(null);
  const isFocused = useIsFocused();
  
  // Animation values
  const captureScale = useSharedValue(1);
  const overlayOpacity = useSharedValue(0.7);
  const instructionOpacity = useSharedValue(1);

  useEffect(() => {
    (async () => {
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      if (mediaStatus.status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photo library to save progress photos.');
      }
    })();
  }, []);

  useEffect(() => {
    // Animate overlay on mount
    overlayOpacity.value = withTiming(0.7, { duration: 500 });
    instructionOpacity.value = withSequence(
      withTiming(1, { duration: 500 }),
      withTiming(0.8, { duration: 1000 }),
      withTiming(1, { duration: 500 })
    );
  }, []);

  const captureAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureScale.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const instructionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: instructionOpacity.value,
  }));

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate capture button
      captureScale.value = withSpring(0.9, { damping: 8 }, () => {
        captureScale.value = withSpring(1, { damping: 8 });
      });

      // Hide overlay during capture
      overlayOpacity.value = withTiming(0, { duration: 200 });

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      // Show overlay again
      overlayOpacity.value = withTiming(0.7, { duration: 200 });

      // TODO: Save photo with metadata
      console.log('Photo taken:', photo.uri);
      
      // Navigate to preview
      navigation.navigate('PhotoPreview', {
        photoUri: photo.uri,
        angle: currentAngle,
      });

    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraType = () => {
    setFacing(current => 
      current === 'back' ? 'front' : 'back'
    );
    Haptics.selectionAsync();
  };

  const toggleFlash = () => {
    setFlash(current => 
      current === 'off' ? 'on' : 'off'
    );
    Haptics.selectionAsync();
  };

  const changeAngle = (newAngle: PhotoAngle) => {
    setCurrentAngle(newAngle);
    Haptics.selectionAsync();
    
    // Re-animate instructions for new angle
    instructionOpacity.value = withSequence(
      withTiming(0.5, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
  };

  const handleClose = () => {
    navigation.goBack();
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to take progress photos
        </Text>
        <Button
          title="Request Permission"
          onPress={requestPermission}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        >
          {/* Header Controls */}
          <SafeAreaView style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.angleText}>
                {currentAngle.charAt(0).toUpperCase() + currentAngle.slice(1)} View
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleFlash}
            >
              <Ionicons 
                name={flash === 'on' ? "flash" : "flash-off"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Body Framing Overlay */}
          <BodyFrameOverlay angle={currentAngle} style={overlayAnimatedStyle} />

          {/* Instructions */}
          <Animated.View style={[styles.instructionsContainer, instructionAnimatedStyle]}>
            <Text style={styles.instructionText}>
              {getInstructionText(currentAngle)}
            </Text>
          </Animated.View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Angle Selection */}
            <View style={styles.angleControls}>
              {(['front', 'side', 'back'] as PhotoAngle[]).map((angleOption) => (
                <TouchableOpacity
                  key={angleOption}
                  style={[
                    styles.angleButton,
                    currentAngle === angleOption && styles.angleButtonActive
                  ]}
                  onPress={() => changeAngle(angleOption)}
                >
                  <Text style={[
                    styles.angleButtonText,
                    currentAngle === angleOption && styles.angleButtonTextActive
                  ]}>
                    {angleOption.charAt(0).toUpperCase() + angleOption.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Capture Controls */}
            <View style={styles.captureContainer}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={() => {/* TODO: Open gallery */}}
              >
                <Ionicons name="images-outline" size={24} color="white" />
              </TouchableOpacity>

              <Animated.View style={captureAnimatedStyle}>
                <TouchableOpacity
                  style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                  onPress={takePicture}
                  disabled={isCapturing}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraType}
              >
                <Ionicons name="camera-reverse-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      )}
    </View>
  );
}

interface BodyFrameOverlayProps {
  angle: PhotoAngle;
  style?: any;
}

function BodyFrameOverlay({ angle, style }: BodyFrameOverlayProps) {
  const overlayGuides = getOverlayGuides(angle);
  
  return (
    <Animated.View style={[styles.overlay, style]} pointerEvents="none">
      {/* Frame outline */}
      <View style={styles.frameContainer}>
        {overlayGuides.map((guide, index) => (
          <View
            key={index}
            style={[
              styles.guideElement,
              {
                left: guide.x,
                top: guide.y,
                width: guide.width,
                height: guide.height,
              }
            ]}
          />
        ))}
        
        {/* Center guidelines */}
        <View style={styles.centerLineVertical} />
        <View style={styles.centerLineHorizontal} />
        
        {/* Corner guides */}
        <View style={[styles.cornerGuide, styles.topLeft]} />
        <View style={[styles.cornerGuide, styles.topRight]} />
        <View style={[styles.cornerGuide, styles.bottomLeft]} />
        <View style={[styles.cornerGuide, styles.bottomRight]} />
      </View>
    </Animated.View>
  );
}

function getOverlayGuides(angle: PhotoAngle) {
  const centerX = width / 2;
  const centerY = height / 2;
  const bodyWidth = width * 0.5;
  const bodyHeight = height * 0.6;

  switch (angle) {
    case 'front':
      return [
        // Head
        { x: centerX - 40, y: centerY - bodyHeight/2 - 60, width: 80, height: 80 },
        // Shoulders
        { x: centerX - bodyWidth/2, y: centerY - bodyHeight/2 + 20, width: bodyWidth, height: 60 },
        // Torso
        { x: centerX - bodyWidth/2 + 20, y: centerY - 80, width: bodyWidth - 40, height: 160 },
        // Hips
        { x: centerX - bodyWidth/2 + 10, y: centerY + 80, width: bodyWidth - 20, height: 100 },
      ];
    case 'side':
      return [
        // Head profile
        { x: centerX - 30, y: centerY - bodyHeight/2 - 60, width: 60, height: 80 },
        // Body profile
        { x: centerX - 40, y: centerY - bodyHeight/2 + 20, width: 80, height: bodyHeight - 40 },
      ];
    case 'back':
      return [
        // Head
        { x: centerX - 40, y: centerY - bodyHeight/2 - 60, width: 80, height: 80 },
        // Back/shoulders
        { x: centerX - bodyWidth/2, y: centerY - bodyHeight/2 + 20, width: bodyWidth, height: bodyHeight - 40 },
      ];
    default:
      return [];
  }
}

function getInstructionText(angle: PhotoAngle): string {
  switch (angle) {
    case 'front':
      return 'Face the camera straight on. Align your body with the guides.';
    case 'side':
      return 'Turn to the side. Keep your body straight and aligned.';
    case 'back':
      return 'Turn around and face away. Keep your body centered.';
    default:
      return 'Position yourself within the frame guides.';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  angleText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameContainer: {
    width: width,
    height: height,
    position: 'relative',
  },
  guideElement: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.cameraFrame,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  centerLineVertical: {
    position: 'absolute',
    left: width / 2 - 1,
    top: height * 0.2,
    width: 2,
    height: height * 0.6,
    backgroundColor: colors.cameraOverlay,
  },
  centerLineHorizontal: {
    position: 'absolute',
    left: width * 0.2,
    top: height / 2 - 1,
    width: width * 0.6,
    height: 2,
    backgroundColor: colors.cameraOverlay,
  },
  cornerGuide: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.cameraFrame,
    borderWidth: 3,
  },
  topLeft: {
    top: height * 0.2,
    left: width * 0.2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: height * 0.2,
    right: width * 0.2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: height * 0.2,
    left: width * 0.2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: height * 0.2,
    right: width * 0.2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionsContainer: {
    position: 'absolute',
    top: height * 0.15,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: typography.fontSize.base,
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    overflow: 'hidden',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  angleControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  angleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  angleButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[400],
  },
  angleButtonText: {
    fontSize: typography.fontSize.sm,
    color: 'white',
    fontWeight: typography.fontWeight.medium,
  },
  angleButtonTextActive: {
    fontWeight: typography.fontWeight.semibold,
  },
  captureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  permissionButton: {
    marginHorizontal: spacing.lg,
  },
});
