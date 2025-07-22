import BackgroundFetch from "react-native-background-fetch";
import * as Location from "expo-location";
import { saveUserLocation } from "@/services/sbLocationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkNearbyOffers } from "@/services/sbEdgeFunctions";

const onEvent = async () => {
    try {
        console.log("📦 BackgroundFetch fired", new Date().toISOString());

        const userId = await AsyncStorage.getItem("currentUserId");

        if (!userId) {
            console.warn("⚠️ No cached user ID found – skipping location save");
            return;
        }

        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== "granted") {
            console.warn("🚫 Foreground location permission denied");
            return;
        }

        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus !== "granted") {
            console.warn("🚫 Background location permission denied");
            return;
        }

        let location;
        try {
            location = await Location.getCurrentPositionAsync({});
        } catch {
            console.warn("⚠️ Live location unavailable — using last known position");
            location = await Location.getLastKnownPositionAsync({});
        }
        if (location) {
            await saveUserLocation(userId, location);

            // check for qualifying nearby offers
            await checkNearbyOffers(userId);
        } else {
            console.warn("🚫 No fallback location available");
        }
    } catch (err) {
        console.error("❌ Background fetch failed:", err);
    }
};

const onTimeout = async () => {
    console.warn("⌛ BackgroundFetch timed out");
};

export async function initBackgroundFetch() {
    await BackgroundFetch.configure(
        {
            minimumFetchInterval: 15, // minutes
            stopOnTerminate: false,
            startOnBoot: true,
            enableHeadless: true,
            requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
        },
        onEvent,
        onTimeout
    );

    // console.log("✅ BackgroundFetch initialized");
}

// ✅ Register headless task once, not re-calling init
BackgroundFetch.registerHeadlessTask(onEvent);
