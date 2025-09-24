export const colors = {
  // Cal.AI inspired dark theme
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Main background - very dark charcoal
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceSecondary: '#2a2a2a',
  
  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#a3a3a3',
    tertiary: '#737373',
    inverse: '#0a0a0a',
  },
  
  // Accent colors for progress rings (Cal.AI style)
  accent: {
    protein: '#ef4444', // Soft red
    carbs: '#f97316',   // Soft orange
    fats: '#3b82f6',    // Soft blue
    calories: '#ffffff',
  },
  
  // Status colors
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Overlay and borders
  overlay: 'rgba(0, 0, 0, 0.8)',
  border: '#2a2a2a',
  borderLight: '#404040',
  
  // Camera overlay
  cameraOverlay: 'rgba(255, 255, 255, 0.3)',
  cameraFrame: '#ffffff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 999,
};

export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Font weights
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const layout = {
  // Common layout values
  headerHeight: 56,
  tabBarHeight: 80,
  buttonHeight: 48,
  inputHeight: 56,
  
  // Screen padding
  screenPadding: spacing.md,
  
  // Container max width
  containerMaxWidth: 400,
};

export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  easing: {
    easeInOut: 'easeInOut' as const,
    easeIn: 'easeIn' as const,
    easeOut: 'easeOut' as const,
  },
};

// Export default theme object
export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  layout,
  animations,
};

export type Theme = typeof theme;




