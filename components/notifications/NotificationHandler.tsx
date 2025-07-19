import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export function usePushNotificationListener() {
  const router = useRouter();
  
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true, // 👈 shows banner in foreground
            shouldShowList: true,   // 👈 adds to iOS notification center
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowAlert: true,
        }),
    });

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
      const title = notification.request.content.title;
      const body = notification.request.content.body;
      alert(`${title}\n\n${body}`); // display cleanly
    });

    const tapSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen;
      if (screen) {
        console.log("🔀 Navigating to screen:", screen);
        router.push(`/(tabs)/(userOffers)`);
      }
    });

    return () => {
      receivedSubscription.remove();
      tapSubscription.remove();
    };
  }, [router]); // ✅ include router in deps
}

// ✅ Drop this somewhere in app/_layout.tsx or App.tsx
export const NotificationHandler = () => {
  usePushNotificationListener();
  return null;
};

