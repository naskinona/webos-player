module.exports = {
  appId: 'com.netflix.webos',
  appVersion: '1.0.0',
  appName: 'Netflix',
  vendor: 'Netflix WebOS Team',
  type: 'web',
  main: 'index.html',
  icon: 'icon.png',
  largeIcon: 'largeIcon.png',
  bgImage: 'bgImage.png',
  splashBackground: 'splash.png',
  resolution: '1920x1080',
  handlesRelaunch: true,
  inspectable: true,
  webOSTV: true,
  requiredMemory: 256,
  maxMemory: 512,
  cpu: 'arm64',
  transparent: false,
  disableBackHistoryAPI: false,
  permissions: [
    'internet',
    'mediaPlayback',
    'mediaRecording',
    'storage',
  ],
  // webOS specific settings
  webOS: {
    // Enable hardware acceleration
    hardwareAcceleration: true,
    // Use webOS specific APIs
    useWebOSAPIs: true,
    // Handle remote control keys
    handleRemoteKeys: true,
    // Enable spatial navigation
    spatialNavigation: true,
  },
  // Build settings
  build: {
    outDir: 'dist',
    minify: true,
    sourceMap: true,
  },
  // Development settings
  dev: {
    port: 3000,
    host: '0.0.0.0',
    https: false,
  },
};