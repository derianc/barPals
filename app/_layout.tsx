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
import { UserContext, UserProvider } from "@/contexts/userContext";
import { LocationTracker } from "@/components/locationTracker";
import { NotificationHandler } from "@/components/notifications/NotificationHandler";
import * as Notifications from 'expo-notifications';

const LayoutInner = () => {
  const publicRoutes = ["/login", "/signup", "/"];
  const { colorMode } = useContext(ThemeContext) as ThemeContextType;
  const { user, rehydrated } = useContext(UserContext);
  const router = useRouter();
  const pathname = usePathname();

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
    if (!rehydrated) return;

    const currentPath = pathname.split("?")[0];
    const isPublic = publicRoutes.includes(currentPath);

    if (!user && !isPublic) {
      console.log("🔐 No session found (UserContext) → redirecting to /login");
      router.replace("/login");
    }
  }, [user, rehydrated, pathname]);

  if (!fontsLoaded || !rehydrated) return null;

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
          <LayoutInner />
        </UserProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
