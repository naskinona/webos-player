// webOS TV Platform Integration
// This file provides utilities for webOS-specific features

interface WebOSPlatform {
  isWebOS: boolean;
  deviceInfo: {
    modelName: string;
    sdkVersion: string;
    firmwareVersion: string;
    deviceId: string;
  } | null;
  audio: {
    getVolume: () => Promise<number>;
    setVolume: (volume: number) => Promise<void>;
    getMuted: () => Promise<boolean>;
    setMuted: (muted: boolean) => Promise<void>;
  };
  display: {
    getResolution: () => Promise<{ width: number; height: number }>;
    setResolution: (width: number, height: number) => Promise<void>;
  };
  system: {
    getCountry: () => Promise<string>;
    getLanguage: () => Promise<string>;
    getTimeZone: () => Promise<string>;
  };
  app: {
    launch: (appId: string, params?: any) => Promise<void>;
    close: () => Promise<void>;
    getInfo: () => Promise<any>;
  };
  input: {
    onKeyDown: (callback: (keyCode: string) => void) => void;
    onKeyUp: (callback: (keyCode: string) => void) => void;
  };
  storage: {
    getAvailableSize: () => Promise<number>;
    getUsedSize: () => Promise<number>;
  };
  network: {
    getStatus: () => Promise<{ connected: boolean; type: string }>;
  };
  media: {
    canPlayType: (type: string) => Promise<string>;
    play: (url: string, options?: any) => Promise<void>;
  };
  drm: {
    getSupportedTypes: () => Promise<string[]>;
    requestLicense: (drmType: string, initData: ArrayBuffer) => Promise<ArrayBuffer>;
  };
}

declare global {
  interface Window {
    webOS?: WebOSPlatform;
    PalmSystem?: {
      stageReady: () => void;
      stagePreparing: () => void;
    };
    naver?: {
      tv?: {
        platform?: {
          getDeviceInfo: () => Promise<any>;
        };
      };
    };
  }
}

// Check if running on webOS
export function isWebOS(): boolean {
  return typeof window !== 'undefined' && !!(window.webOS || window.PalmSystem);
}

// Initialize webOS app
export function initWebOS(): void {
  if (typeof window !== 'undefined' && window.PalmSystem) {
    window.PalmSystem.stageReady();
  }
}

// Get device information
export async function getDeviceInfo(): Promise<any> {
  if (window.webOS?.deviceInfo) {
    return window.webOS.deviceInfo;
  }
  if (window.naver?.tv?.platform?.getDeviceInfo) {
    return window.naver.tv.platform.getDeviceInfo();
  }
  return null;
}

// Audio controls
export const audio = {
  async getVolume(): Promise<number> {
    if (window.webOS?.audio?.getVolume) {
      return window.webOS.audio.getVolume();
    }
    return 1;
  },

  async setVolume(volume: number): Promise<void> {
    if (window.webOS?.audio?.setVolume) {
      return window.webOS.audio.setVolume(Math.max(0, Math.min(1, volume)));
    }
  },

  async getMuted(): Promise<boolean> {
    if (window.webOS?.audio?.getMuted) {
      return window.webOS.audio.getMuted();
    }
    return false;
  },

  async setMuted(muted: boolean): Promise<void> {
    if (window.webOS?.audio?.setMuted) {
      return window.webOS.audio.setMuted(muted);
    }
  },
};

// Display controls
export const display = {
  async getResolution(): Promise<{ width: number; height: number }> {
    if (window.webOS?.display?.getResolution) {
      return window.webOS.display.getResolution();
    }
    return { width: window.innerWidth, height: window.innerHeight };
  },

  async setResolution(width: number, height: number): Promise<void> {
    if (window.webOS?.display?.setResolution) {
      return window.webOS.display.setResolution(width, height);
    }
  },
};

// System info
export const system = {
  async getCountry(): Promise<string> {
    if (window.webOS?.system?.getCountry) {
      return window.webOS.system.getCountry();
    }
    return 'US';
  },

  async getLanguage(): Promise<string> {
    if (window.webOS?.system?.getLanguage) {
      return window.webOS.system.getLanguage();
    }
    return navigator.language || 'en-US';
  },

  async getTimeZone(): Promise<string> {
    if (window.webOS?.system?.getTimeZone) {
      return window.webOS.system.getTimeZone();
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },
};

// App controls
export const app = {
  async launch(appId: string, params?: any): Promise<void> {
    if (window.webOS?.app?.launch) {
      return window.webOS.app.launch(appId, params);
    }
  },

  async close(): Promise<void> {
    if (window.webOS?.app?.close) {
      return window.webOS.app.close();
    }
  },

  async getInfo(): Promise<any> {
    if (window.webOS?.app?.getInfo) {
      return window.webOS.app.getInfo();
    }
    return null;
  },
};

// Input handling for remote control
export const input = {
  onKeyDown(callback: (keyCode: string) => void): void {
    if (window.webOS?.input?.onKeyDown) {
      window.webOS.input.onKeyDown(callback);
    } else {
      // Fallback to keyboard events
      window.addEventListener('keydown', (e) => callback(e.code));
    }
  },

  onKeyUp(callback: (keyCode: string) => void): void {
    if (window.webOS?.input?.onKeyUp) {
      window.webOS.input.onKeyUp(callback);
    } else {
      window.addEventListener('keyup', (e) => callback(e.code));
    }
  },
};

// Storage info
export const storage = {
  async getAvailableSize(): Promise<number> {
    if (window.webOS?.storage?.getAvailableSize) {
      return window.webOS.storage.getAvailableSize();
    }
    // Estimate using StorageManager API
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return (estimate.quota || 0) - (estimate.usage || 0);
    }
    return 0;
  },

  async getUsedSize(): Promise<number> {
    if (window.webOS?.storage?.getUsedSize) {
      return window.webOS.storage.getUsedSize();
    }
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  },
};

// Network status
export const network = {
  async getStatus(): Promise<{ connected: boolean; type: string }> {
    if (window.webOS?.network?.getStatus) {
      return window.webOS.network.getStatus();
    }
    return {
      connected: navigator.onLine,
      type: 'unknown',
    };
  },

  onConnectionChange(callback: (online: boolean) => void): () => void {
    const handler = () => callback(navigator.onLine);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  },
};

// Media capabilities
export const media = {
  async canPlayType(type: string): Promise<string> {
    if (window.webOS?.media?.canPlayType) {
      return window.webOS.media.canPlayType(type);
    }
    const video = document.createElement('video');
    return video.canPlayType(type);
  },

  async play(url: string, options?: any): Promise<void> {
    if (window.webOS?.media?.play) {
      return window.webOS.media.play(url, options);
    }
    // Fallback: create video element and play
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = url;
      video.onloadeddata = () => {
        video.play().then(resolve).catch(reject);
      };
      video.onerror = () => reject(new Error('Failed to load video'));
    });
  },
};

// DRM support
export const drm = {
  async getSupportedTypes(): Promise<string[]> {
    if (window.webOS?.drm?.getSupportedTypes) {
      return window.webOS.drm.getSupportedTypes();
    }
    // Standard EME API check
    const types: string[] = [];
    try {
      const keySystemAccess = await navigator.requestMediaKeySystemAccess('com.widevine.alpha', [{
        initDataTypes: ['cenc'],
        videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
      }]);
      types.push('widevine');
    } catch (e) {}

    try {
      await navigator.requestMediaKeySystemAccess('com.microsoft.playready', [{
        initDataTypes: ['cenc'],
        videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
      }]);
      types.push('playready');
    } catch (e) {}

    return types;
  },

  async requestLicense(drmType: string, initData: ArrayBuffer): Promise<ArrayBuffer> {
    if (window.webOS?.drm?.requestLicense) {
      return window.webOS.drm.requestLicense(drmType, initData);
    }
    throw new Error('DRM license request not supported');
  },
};

// WebOS key codes mapping
export const WEBOS_KEY_CODES = {
  BACK: 'Backspace',
  EXIT: 'Escape',
  ENTER: 'Enter',
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  RED: 'F1',
  GREEN: 'F2',
  YELLOW: 'F3',
  BLUE: 'F4',
  PLAY: 'MediaPlayPause',
  PAUSE: 'MediaPlayPause',
  STOP: 'MediaStop',
  REWIND: 'MediaTrackPrevious',
  FAST_FORWARD: 'MediaTrackNext',
  VOLUME_UP: 'AudioVolumeUp',
  VOLUME_DOWN: 'AudioVolumeDown',
  MUTE: 'AudioVolumeMute',
  CHANNEL_UP: 'PageUp',
  CHANNEL_DOWN: 'PageDown',
  NUM_0: 'Digit0',
  NUM_1: 'Digit1',
  NUM_2: 'Digit2',
  NUM_3: 'Digit3',
  NUM_4: 'Digit4',
  NUM_5: 'Digit5',
  NUM_6: 'Digit6',
  NUM_7: 'Digit7',
  NUM_8: 'Digit8',
  NUM_9: 'Digit9',
  DASH: 'Minus',
  PREVIOUS: 'MediaTrackPrevious',
  NEXT: 'MediaTrackNext',
  INFO: 'Info',
  SUBTITLE: 'KeyS',
  AD: 'KeyA',
  RECORD: 'KeyR',
  LIVE_TV: 'KeyL',
  GUIDE: 'KeyG',
  SETTINGS: 'KeyS',
  HOME: 'KeyH',
  SEARCH: 'KeyF',
  VOICE: 'KeyV',
};

// Hook for webOS lifecycle
export function useWebOS() {
  const [isReady, setIsReady] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      initWebOS();
      const info = await getDeviceInfo();
      setDeviceInfo(info);
      setIsReady(true);
    };

    init();

    // Handle visibility change (app background/foreground)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App going to background
        console.log('App hidden');
      } else {
        // App coming to foreground
        console.log('App visible');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isReady, deviceInfo, isWebOS: isWebOS() };
}

// Import React for hook
import { useState, useEffect } from 'react';

// Export all as default
export default {
  isWebOS,
  initWebOS,
  getDeviceInfo,
  audio,
  display,
  system,
  app,
  input,
  storage,
  network,
  media,
  drm,
  WEBOS_KEY_CODES,
  useWebOS,
};