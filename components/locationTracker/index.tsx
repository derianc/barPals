import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { getLoggedInUser } from "@/services/sbUserService";
import { saveUserLocation } from "@/services/sbLocationService";


function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function LocationTracker() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const debouncedSaveLocation = useRef(
    debounce(async (userId: string) => {
      await saveUserLocation(userId);
    }, 30)
  ).current;

  useEffect(() => {
    const startLocationUpdates = async () => {
      const user = await getLoggedInUser();
      if (user?.id) {
        debouncedSaveLocation(user.id);
      }
    };

    const startTimer = () => {
      if (intervalRef.current !== null) return;
      startLocationUpdates();
      intervalRef.current = setInterval(startLocationUpdates, 15 * 60 * 1000);
    };

    const stopTimer = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startTimer();

    return () => stopTimer();
  }, []);

  // ✅ Return null to indicate this is a non-visual component
  return null;
}

