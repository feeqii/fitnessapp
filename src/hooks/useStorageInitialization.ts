import { useEffect, useState } from 'react';
import storageService from '../services/StorageService';
import { UserProfile } from '../types';

interface InitializationState {
  isLoading: boolean;
  isInitialized: boolean;
  needsOnboarding: boolean;
  error: string | null;
}

export const useStorageInitialization = () => {
  const [state, setState] = useState<InitializationState>({
    isLoading: true,
    isInitialized: false,
    needsOnboarding: false,
    error: null,
  });

  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const isUserInitialized = storageService.isUserInitialized();
      
      if (isUserInitialized) {
        // User is already set up
        setState({
          isLoading: false,
          isInitialized: true,
          needsOnboarding: false,
          error: null,
        });
      } else {
        // User needs onboarding
        setState({
          isLoading: false,
          isInitialized: false,
          needsOnboarding: true,
          error: null,
        });
      }
    } catch (error) {
      console.error('Storage initialization error:', error);
      setState({
        isLoading: false,
        isInitialized: false,
        needsOnboarding: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const initializeUser = async (profile: UserProfile) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await storageService.initializeUser(profile);
      
      setState({
        isLoading: false,
        isInitialized: true,
        needsOnboarding: false,
        error: null,
      });
      
      return true;
    } catch (error) {
      console.error('User initialization error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize user',
      }));
      return false;
    }
  };

  const resetUser = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await storageService.clearAllData();
      
      setState({
        isLoading: false,
        isInitialized: false,
        needsOnboarding: true,
        error: null,
      });
      
      return true;
    } catch (error) {
      console.error('User reset error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to reset user',
      }));
      return false;
    }
  };

  return {
    ...state,
    initializeUser,
    resetUser,
    checkInitialization,
  };
};

export default useStorageInitialization;


