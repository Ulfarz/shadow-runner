import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shadowrunner.game',
  appName: 'Shadow Runner',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '952699089437-fvior1m37i8csuh4bmurjdvldmag553d.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;