import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mdrrmo.balayan.sendresqpls',
  appName: 'SendResqPls',
  webDir: 'dist',
  // Live-update mode: loads your deployed Vercel URL
  // This means the APK always gets the latest version automatically
  server: {
    url: 'https://send-res-q-pls.vercel.app/mobile',
    cleartext: false,
    allowNavigation: [
      'send-res-q-pls.vercel.app',
    ],
  },
  android: {
    backgroundColor: '#0F172A',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F172A',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
