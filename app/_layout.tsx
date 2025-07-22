// app/_layout.tsx
import "@/global.css";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Slot, useRouter, usePathname } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, } from "@expo-google-fonts/dm-sans";
import { ThemeProvider, ThemeContext, ThemeContextType } from "@/contexts/theme-context";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UserContext, UserProvider, useUser } from "@/contexts/userContext";
import { LocationTracker } from "@/components/locationTracker";
import { NotificationHandler } from "@/components/notifications/NotificationHandler";
import * as Notifications from 'expo-notifications';
import { VenueProvider } from "@/contexts/venueContex";
import { ActivityIndicator, View } from "react-native";
import * as Updates from "expo-updates";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LayoutInner = () => {
  const publicRoutes = ["/login", "/signup", "/", "/onboardingScreen"];
  const { colorMode } = useContext(ThemeContext) as ThemeContextType;
  const { user, rehydrated } = useContext(UserContext);
  const router = useRouter();
  const pathname = usePathname();
  const [reloadTimeoutReached, setReloadTimeoutReached] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const [fontsLoaded] = useFonts({
    "dm-sans-regular": DMSans_400Regular,
    "dm-sans-medium": DMSans_500Medium,
    "dm-sans-bold": DMSans_700Bold,
  });

  useEffect(() => {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }, []);

  useEffect(() => {
    const checkOnboarding = async () => {
      // await AsyncStorage.removeItem("onboarding_complete")
      const flag = await AsyncStorage.getItem("onboarding_complete");

      // ✅ If we're already on the onboarding screen, skip redirect
      if (!flag) {
        const isAlreadyOnOnboarding = pathname.includes("onboarding");
        if (isAlreadyOnOnboarding) {
          setOnboardingChecked(true);
          return;
        }

        console.log("🚀 First install detected → showing onboarding");
        setTimeout(() => {
          router.replace("/(tabs)/onboardingScreen");
        }, 10);
        return;
      }

      setOnboardingChecked(true);
    };

    if (!onboardingChecked && rehydrated && fontsLoaded) {
      checkOnboarding();
    }
  }, [rehydrated, fontsLoaded, onboardingChecked, pathname]);



  useEffect(() => {
    if (!rehydrated) return;

    const currentPath = pathname.split("?")[0];
    const isPublic = publicRoutes.includes(currentPath);

    if (!user && !isPublic) {
      console.log("🔐 No session found (UserContext) → redirecting to /login");
      router.replace("/login");
    }
  }, [user, rehydrated, pathname]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!fontsLoaded || !rehydrated) {
        console.warn("⚠️ App stuck in loading state — forcing reload.");
        setReloadTimeoutReached(true);
      }
    }, 3000); // 3 seconds timeout

    return () => clearTimeout(timeout);
  }, [fontsLoaded, rehydrated]);

  useEffect(() => {
    if (reloadTimeoutReached) {
      Updates.reloadAsync(); // force reload entire app
    }
  }, [reloadTimeoutReached]);

  console.group("🧬 Layout Load Check");
  console.log("fontsLoaded:", fontsLoaded);
  console.log("rehydrated:", rehydrated);
  console.log("user:", JSON.stringify(user).slice(0, 51), "...}");
  console.groupEnd();

  if (!fontsLoaded || !rehydrated || !onboardingChecked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GluestackUIProvider mode={colorMode}>
      <StatusBar translucent />
      <NotificationHandler />
      <Slot />
      <LocationTracker />
    </GluestackUIProvider>
  );
};


export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <UserProvider>
          <VenueProvider>
            <LayoutInner />
          </VenueProvider>
        </UserProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
