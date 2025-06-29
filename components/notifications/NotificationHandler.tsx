import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Alert } from 'react-native';

export function usePushNotificationListener() {
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
      alert(notification)
    });

    const tapSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔙 Notification tapped:', response);
      // Optionally navigate based on response.notification.request.content.data
    });

    return () => {
      receivedSubscription.remove();
      tapSubscription.remove();
    };
  }, []);
}

// Component to include in your app layout
export const NotificationHandler = () => {
  usePushNotificationListener();
  return null;
};

