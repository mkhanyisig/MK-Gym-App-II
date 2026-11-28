import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * app.json holds the app's configuration. This file only gives the development build
 * its own identity when APP_VARIANT=development, so it installs next to the everyday
 * app instead of replacing it, and keeps its own (separate) data:
 *
 *   My Form       com.mkhanyisig.gymbuddyv2       gymbuddy://      (never change this ID)
 *   My Form Dev   com.mkhanyisig.gymbuddyv2.dev   gymbuddy-dev://
 *
 * See docs/DEVELOPMENT.md.
 */
const IS_DEV = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => {
  if (!IS_DEV) return config as ExpoConfig;
  return {
    ...config,
    name: 'My Form Dev',
    slug: config.slug ?? 'gym-buddy-v2',
    scheme: 'gymbuddy-dev',
    ios: { ...config.ios, bundleIdentifier: 'com.mkhanyisig.gymbuddyv2.dev' },
  };
};
