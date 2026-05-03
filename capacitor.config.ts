import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caiberclick.hospital',
  appName: '赛博华佗',
  webDir: 'dist',
  server: {
    url: 'https://game-one-d1gx1gwhbee34fff7-1428019926.tcloudbaseapp.com/mental-hospital',
    cleartext: true
  }
};

export default config;