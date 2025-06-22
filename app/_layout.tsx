// app/_layout.tsx
import React, { useContext, useRef } from "react";
import { Slot } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";

import "@/global.css";
import { ThemeProvider, ThemeContext, ThemeContextType } from "@/contexts/theme-context";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UserContext, UserProvider } from "@/contexts/userContext";
import { LocationTracker } from "@/components/locationTracker";

const LayoutInner = () => {
  const { colorMode } = useContext(ThemeContext) as ThemeContextType;
  const { rehydrated } = useContext(UserContext);
  
  const [fontsLoaded] = useFonts({
    "dm-sans-regular": DMSans_400Regular,
    "dm-sans-medium": DMSans_500Medium,
    "dm-sans-bold": DMSans_700Bold,
  });

  if (!fontsLoaded || !rehydrated) {
    return null;
  }

  return (
    <GluestackUIProvider mode={colorMode}>
      <StatusBar translucent />
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
