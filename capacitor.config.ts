import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kharchbaant.app',
  appName: 'Kharch Baant',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Development: Use your network IP for physical device testing
    // Full URL approach works better for Android development
    url: 'http://10.69.36.36:3000',
    cleartext: true, // Required for http:// connections on Android
    // Alternative: Use hostname only (uncomment if URL doesn't work)
    // hostname: '10.69.36.36',
    // For Android emulator, use: hostname: 'localhost' or url: 'http://10.0.2.2:3000'
    // Uncomment for production builds
    // url: 'https://your-production-url.com',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB' // or 'APK'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1e293b',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1e293b'
    }
  }
};

export default config;
