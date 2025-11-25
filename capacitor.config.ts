import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.98fc86e28fcc4ef8be9ef1890194852f',
  appName: 'design-blueprint-guy',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  }
};

export default config;
