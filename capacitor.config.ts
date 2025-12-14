import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kharchbaant.app',
  appName: 'Kharch Baant',
  webDir: 'dist',

  // Live Reload Development Server
  server: {
    url: 'http://192.168.1.10:3000',
    cleartext: true
  },

  android: {
    buildOptions: {
      releaseType: 'AAB'
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
