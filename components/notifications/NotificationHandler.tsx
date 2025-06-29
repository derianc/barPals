import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Alert } from 'react-native';

// export function usePushNotificationListener() {
//   // Foreground notification listener
//   useEffect(() => {
//     const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
//       console.log('📬 Foreground Notification:', remoteMessage);
//       Alert.alert(
//         remoteMessage.notification?.title || 'New Message',
//         remoteMessage.notification?.body || ''
//       );
//     });

//     return unsubscribeForeground;
//   }, []);

//   // Background and quit state notification handling
//   useEffect(() => {
//     const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
//       console.log('🔙 App opened from background via notification:', remoteMessage);
//       // Add navigation or custom handling here
//     });

//     messaging()
//       .getInitialNotification()
//       .then(remoteMessage => {
//         if (remoteMessage) {
//           console.log('🚀 App launched from quit via notification:', remoteMessage);
//           // Add navigation or custom handling here
//         }
//       });

//     return unsubscribeBackground;
//   }, []);
// }



//---
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true, // 👈 shows banner in foreground
        shouldShowList: true,   // 👈 adds to iOS notification center
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export function usePushNotificationListener() {
    useEffect(() => {
        // Fires when notification is received while app is foregrounded
        const receivedSub = Notifications.addNotificationReceivedListener(notification => {
            console.log('📬 Foreground notification received:', notification);
        });

        // Fires when user taps the notification (from any state)
        const tapSub = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('🔙 Notification tapped:', response);
            // You can access screen or params via:
            // const screen = response.notification.request.content.data?.screen
            // router.push(`/${screen}`);
        });

        return () => {
            receivedSub.remove();
            tapSub.remove();
        };
    }, []);
}

// Component to include in your app layout
export const NotificationHandler = () => {
  usePushNotificationListener();
  return null;
};

