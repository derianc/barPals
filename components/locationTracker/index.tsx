import { useEffect, useContext } from "react";
import * as Location from "expo-location";
import { initBackgroundFetch } from "./backgroundPolling";
import { saveUserLocation } from "@/services/sbLocationService";
import { UserContext } from "@/contexts/userContext";
import BackgroundFetch from "react-native-background-fetch"; // ✅ add at the top

export function LocationTracker() {
  const { user, rehydrated } = useContext(UserContext);

  useEffect(() => {
    if (!rehydrated || !user?.id) {
      console.log("⏳ Waiting for user to be rehydrated before starting tracking...");
      return;
    }

    let foregroundSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        // console.log("🚀 Starting background location tracking...");
        await initBackgroundFetch();

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("🚫 Foreground location permission not granted");
          return;
        }

        foregroundSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1 * 60 * 1000,
            distanceInterval: 50,
          },
          async (location) => {
            // console.log("📡 Foreground location:", location.coords);
            await saveUserLocation(user.id, location);
          }
        );

        // console.log("✅ Foreground tracking initialized");

      } catch (err) {
        console.error("❌ Error in startTracking:", err);
      }
    };

    startTracking();

    return () => {
      if (foregroundSubscription) {
        foregroundSubscription.remove();
        console.log("🛑 Foreground location tracking stopped");
      }
    };
  }, [rehydrated, user?.id]);

  return null;
}

