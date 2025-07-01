import { runtimeVersion } from "expo-updates";

export default ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const suffix = profile === 'development' ? 'Dev' : profile === 'preview' ? 'Preview' : '';
  const lowerSuffix = suffix.toLowerCase();

  return {
    ...config,
    name: suffix ? `BarPals ${suffix}` : 'BarPals',
    slug: 'BarPals',
    version: '1.0.0',
    orientation: 'portrait',
    icon: `./assets/icons/appIcon${suffix ? `-${lowerSuffix}` : ''}.png`, // optionally different icons
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: `com.derianc.BarPals${suffix}`,
      infoPlist: {
        UIBackgroundModes: ['location'],
        NSLocationWhenInUseUsageDescription: 'We need your location to show your activity.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'We use your location to track background activity while you\'re out.',
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: `com.derianc.BarPals${suffix}`,
      adaptiveIcon: {
        foregroundImage: `./assets/icons/appIcon${suffix ? `-${lowerSuffix}` : ''}.png`,
        backgroundColor: '#ffffff'
      },
      softwareKeyboardLayoutMode: 'pan',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE'
      ],
      googleServicesFile: './android/app/google-services.json',
      useNextNotificationsApi: true,
      config: {
        googleMaps: {
          apiKey: "AIzaSyCi-LcFua4tTjLm9RUMKDiZLwFkuoRovqQ"
        }
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: `./assets/icons/appIcon${suffix ? `-${lowerSuffix}` : ''}.png`,
          resizeMode: 'contain',
          backgroundColor: '#ffffff'
        }
      ],
      'expo-font',
      'expo-web-browser',
      'react-native-background-fetch',
      [
        'expo-build-properties',
        {
          ios: {
            useModularHeaders: true
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: '3eb1d1ef-354b-4f58-9fa2-4d48436aa58d'
      }
    },
    updates: {
      url: "https://u.expo.dev/3eb1d1ef-354b-4f58-9fa2-4d48436aa58d",
      fallbackToCacheTimeout: 0,
      checkAutomatically: "ON_LOAD"
    },
    runtimeVersion: "1.0.0"
  };
};
