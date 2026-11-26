import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UnifiedMediaItem, MediaType } from '../types/tmdb';

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
  continueWatching: ContinueWatchingItem[];
  myList: string[]; // media IDs
}

interface ContinueWatchingItem {
  mediaId: string;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  progress: number; // 0-100
  currentTime: number; // seconds
  duration: number; // seconds
  season?: number;
  episode?: number;
  episodeTitle?: string;
  lastWatched: number; // timestamp
}

interface AppContextType {
  // User profiles
  profiles: UserProfile[];
  currentProfile: UserProfile | null;
  setCurrentProfile: (profile: UserProfile) => void;
  addProfile: (name: string, isKids?: boolean) => void;
  deleteProfile: (profileId: string) => void;

  // Continue watching
  continueWatching: ContinueWatchingItem[];
  addToContinueWatching: (item: ContinueWatchingItem) => void;
  updateContinueWatchingProgress: (mediaId: string, progress: number, currentTime: number) => void;
  removeFromContinueWatching: (mediaId: string) => void;

  // My List
  myList: string[];
  addToMyList: (mediaId: string) => void;
  removeFromMyList: (mediaId: string) => void;
  isInMyList: (mediaId: string) => boolean;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'netflix_webos_data';

const getInitialData = (): { profiles: UserProfile[]; currentProfileId: string | null } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse stored data', e);
  }
  return { profiles: [], currentProfileId: null };
};

const saveData = (profiles: UserProfile[], currentProfileId: string | null) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles, currentProfileId }));
  } catch (e) {
    console.error('Failed to save data', e);
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const data = getInitialData();
    setProfiles(data.profiles);
    setCurrentProfileId(data.currentProfileId);
    setIsLoading(false);
  }, []);

  // Save data when profiles or current profile changes
  useEffect(() => {
    if (!isLoading) {
      saveData(profiles, currentProfileId);
    }
  }, [profiles, currentProfileId, isLoading]);

  const currentProfile = profiles.find(p => p.id === currentProfileId) || null;

  const setCurrentProfile = (profile: UserProfile) => {
    setCurrentProfileId(profile.id);
  };

  const addProfile = (name: string, isKids = false) => {
    const newProfile: UserProfile = {
      id: `profile_${Date.now()}`,
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      isKids,
      continueWatching: [],
      myList: [],
    };
    setProfiles(prev => [...prev, newProfile]);
    setCurrentProfileId(newProfile.id);
  };

  const deleteProfile = (profileId: string) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    if (currentProfileId === profileId) {
      const remaining = profiles.filter(p => p.id !== profileId);
      setCurrentProfileId(remaining[0]?.id || null);
    }
  };

  // Continue watching
  const continueWatching = currentProfile?.continueWatching || [];

  const addToContinueWatching = (item: ContinueWatchingItem) => {
    setProfiles(prev => prev.map(profile => {
      if (profile.id !== currentProfileId) return profile;
      const existingIndex = profile.continueWatching.findIndex(i => i.mediaId === item.mediaId);
      let newContinueWatching: ContinueWatchingItem[];
      if (existingIndex >= 0) {
        newContinueWatching = [...profile.continueWatching];
        newContinueWatching[existingIndex] = { ...item, lastWatched: Date.now() };
        // Move to front
        newContinueWatching = [newContinueWatching[existingIndex], ...newContinueWatching.slice(0, existingIndex), ...newContinueWatching.slice(existingIndex + 1)];
      } else {
        newContinueWatching = [{ ...item, lastWatched: Date.now() }, ...profile.continueWatching];
      }
      // Keep only last 20 items
      newContinueWatching = newContinueWatching.slice(0, 20);
      return { ...profile, continueWatching: newContinueWatching };
    }));
  };

  const updateContinueWatchingProgress = (mediaId: string, progress: number, currentTime: number) => {
    setProfiles(prev => prev.map(profile => {
      if (profile.id !== currentProfileId) return profile;
      const itemIndex = profile.continueWatching.findIndex(i => i.mediaId === mediaId);
      if (itemIndex === -1) return profile;
      const newContinueWatching = [...profile.continueWatching];
      newContinueWatching[itemIndex] = {
        ...newContinueWatching[itemIndex],
        progress,
        currentTime,
        lastWatched: Date.now(),
      };
      return { ...profile, continueWatching: newContinueWatching };
    }));
  };

  const removeFromContinueWatching = (mediaId: string) => {
    setProfiles(prev => prev.map(profile => {
      if (profile.id !== currentProfileId) return profile;
      return {
        ...profile,
        continueWatching: profile.continueWatching.filter(i => i.mediaId !== mediaId),
      };
    }));
  };

  // My List
  const myList = currentProfile?.myList || [];

  const addToMyList = (mediaId: string) => {
    setProfiles(prev => prev.map(profile => {
      if (profile.id !== currentProfileId) return profile;
      if (profile.myList.includes(mediaId)) return profile;
      return { ...profile, myList: [...profile.myList, mediaId] };
    }));
  };

  const removeFromMyList = (mediaId: string) => {
    setProfiles(prev => prev.map(profile => {
      if (profile.id !== currentProfileId) return profile;
      return { ...profile, myList: profile.myList.filter(id => id !== mediaId) };
    }));
  };

  const isInMyList = (mediaId: string) => {
    return myList.includes(mediaId);
  };

  return (
    <AppContext.Provider value={{
      profiles,
      currentProfile,
      setCurrentProfile,
      addProfile,
      deleteProfile,
      continueWatching,
      addToContinueWatching,
      updateContinueWatchingProgress,
      removeFromContinueWatching,
      myList,
      addToMyList,
      removeFromMyList,
      isInMyList,
      isLoading,
      setIsLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}