import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shadowrunner.game',
  appName: 'Shadow Runner',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '78645863640-ffv1s5ejhc3fhr5tc3idqphbeandpthp.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;