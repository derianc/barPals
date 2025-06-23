import BackgroundFetch from "react-native-background-fetch";
import * as Location from "expo-location";
import { getLoggedInUser } from "@/services/sbUserService";
import { saveUserLocation } from "@/services/sbLocationService";

const onEvent = async () => {
    try {
        console.log("📦 BackgroundFetch fired", new Date().toISOString());

        const user = await getLoggedInUser();
        if (!user?.id) {
            console.warn("⚠️ No user found during background fetch");
            return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            console.warn("🚫 Location permission denied");
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
            console.log("📍 Using fallback location:", location.coords);
            await saveUserLocation(user.id, location);
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

    console.log("✅ BackgroundFetch initialized");
}

// ✅ Register headless task once, not re-calling init
BackgroundFetch.registerHeadlessTask(onEvent);
