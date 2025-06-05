# Welcome to the Weather App Template for `theappmarket.io` 👋

This is a template for a weather app that will be made for the `theappmarket.io` platform, created with Expo. It includes basic features for a weather app, such as weather updates, and location-based forecasts.

## Get started

0. Make sure you have Node.js v22.6.0 or higher installed.
   used node version : v22.12.0

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Example Folder structure

Please refer and follow the folder structure below:

```
app/
	├── (auth)/
	│   ├── _layout.tsx
	│   └── onboarding.tsx
	├── (protected)/
	├── (root)/
	│   ├── _layout.tsx
	│   └── home.tsx
	├── _layout.tsx
	├── +not-found.tsx
	├── index.tsx
	components/
	├── ui/
	│   ├── button/
	│   │   └── index.tsx
	│   └── ...
	├── layouts/
	│   ├── base/
	│   │   └── index.tsx
	│   ├── auth/
	│   │   └── index.tsx
	│   └── ...
	├── shared/
	│   ├── header/
	│   │   └── index.tsx
	│   ├── footer/
	│   │   └── index.tsx
	│   └── ...
	├── screens/
  │   ├── home/
  │   │   ├── hero-section/
  │   │   │   └── index.tsx
  │   │   ├── feature-grid/
  │   │   │   └── index.tsx
  │   │   └── testimonials/
  │   │       └── index.tsx
  │   ├── profile/
  │   │   ├── user-info/
  │   │   │   └── index.tsx
  │   │   ├── activity-feed/
  │   │   │   └── index.tsx
  │   │   └── settings-form/
  │   │       └── index.tsx
  └── ...
assets/
  ├── images/                    # Image assets
  │   ├── common/                # Shared images across the app
  │   │   ├── logo.png           # Shared logo image
  │   │   └── icons/             # Shared icons
  │   │       └── default-avatar.png  # Default avatar icon
  │   ├── screens/               # Screen-specific images
  │   │   ├── home/              # Images specific to Home screen
  │   │   │   └── cover.png      # Home screen cover image
  │   │   └── profile/           # Images specific to Profile screen
  │   │       └── background.png # Profile background image
  │   └── ...                    # Other image assets
  ├── audio/                     # Audio assets
  │   ├── asset1.mp3             # Example audio file
  │   ├── asset2.mp3             # Another audio file
  │   └── ...                    # Other audio assets
  ├── video/                     # Video assets
  │   ├── asset1.mp4             # Example video file
  │   └── ...                    # Other video assets
  └── fonts/                     # Font files
      ├── Roboto/                # Roboto font files
      │   ├── regular.ttf        # Regular font file
      │   └── bold.ttf           # Bold font file
      └── ...                    # Other font files
```

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps for `theappmarket.io`.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
