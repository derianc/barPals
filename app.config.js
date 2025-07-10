import { runtimeVersion } from "expo-updates";

export default ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const suffix = profile === 'development' ? 'Dev' : profile === 'preview' ? 'Preview' : '';
  const lowerSuffix = suffix.toLowerCase();

  return {
    ...config,
    name: suffix ? `BarPals ${suffix}` : 'BarPals',
    slug: 'BarPals',
    version: '1.0.13',
    orientation: 'portrait',
    icon: `./assets/icons/appIcon${suffix ? `-${lowerSuffix}` : ''}.png`, // optionally different icons
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: `com.derianc.BarPals${suffix}`,
      buildNumber: '1.0.13',
      runtimeVersion: 'stable',
      infoPlist: {
        UIBackgroundModes: ['location'],
        NSLocationWhenInUseUsageDescription: 'We need your location to show your activity.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'We use your location to track background activity while you\'re out.',
        ITSAppUsesNonExemptEncryption: false,
      }
    },
    android: {
      package: `com.derianc.BarPals${suffix}`,
      adaptiveIcon: {
        foregroundImage: `./assets/icons/appIcon${suffix ? `-${lowerSuffix}` : ''}.png`,
        backgroundColor: '#ffffff'
      },
      "versionCode": 17,
      runtimeVersion: 'stable',
      softwareKeyboardLayoutMode: 'pan',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'INTERNET',
      ],
      useNextNotificationsApi: true,
      config: {
        // allow HTTP if you later test with local endpoints
        cleartextTrafficPermitted: true,
      },
      googleServicesFile: './android/app/google-services.json',
      useNextNotificationsApi: true,
      config: {
        googleMaps: {
          apiKey: "AIzaSyCePr7GP-ibJiYxa5vylbCldEFEn2yoRKw"
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
      openCageApiKey: "cb523e69e8784a14a5449c7af9b02715",
      eas: {
        projectId: '3eb1d1ef-354b-4f58-9fa2-4d48436aa58d'
      }
    },
    updates: {
      url: "https://u.expo.dev/3eb1d1ef-354b-4f58-9fa2-4d48436aa58d",
      fallbackToCacheTimeout: 0,
      checkAutomatically: "ON_LOAD"
    },
  };
};
