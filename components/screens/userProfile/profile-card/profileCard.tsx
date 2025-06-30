import React from "react";
import { StyleSheet, Switch, TouchableOpacity, View } from "react-native";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text as AppText } from "@/components/ui/text";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import { Bell, LogOut } from "lucide-react-native";
import { logout, updateUserProfile } from "@/services/sbUserService";
import { useRouter } from "expo-router";
import { sendNotification } from "@/services/fcmNotificationService";
import * as Notifications from 'expo-notifications';
import { useUser } from "@/contexts/userContext";


interface ProfileCardProps {
  userId: string;
  full_name: string;
  username?: string;
  created_at: string;
  allow_notifications: boolean;
  onToggleNotifications?: (val: boolean) => void;
  onEditName?: (val: string) => void;
}

const ProfileCard = ({
  userId,
  allow_notifications,
  onToggleNotifications,
}: ProfileCardProps) => {
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const scale = useSharedValue(1);
  const router = useRouter();
  const { user, rehydrated } = useUser();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.95), withSpring(1));
  };

  const handleToggle = async () => {
    const newValue = !allow_notifications;

    const { error } = await updateUserProfile(userId, {
      allow_notifications: newValue,
    });

    if (error) {
      console.error("Failed to update notifications:", error.message);
      return;
    }

    onToggleNotifications?.(newValue);
  };

  const handleLogout = async () => {
    logout();

    router.replace("/login"); // adjust if your login route is different
  };

  const sendTestNotification = async () => {
    if (!user) {
      console.warn("User not found. Cannot send notification.");
      return;
    }

    console.log("Sending test notification to user:", user.id);
    await sendNotification(user.id);
  };

  const testLocalNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Local',
        body: 'If you see this, foreground display works!',
      },
      trigger: null,
    });
  }

  return (
    <>
      <AnimatedPressable
        style={[animatedStyle, styles.card]}
        onPress={handlePress}
      >
        <HStack style={styles.notificationRow}>
          <HStack className="items-center">
            <View style={styles.notificationIcon}>
              <Icon as={Bell} size="sm" color="#fff" />
            </View>
            <VStack style={{ marginLeft: 12 }}>
              <AppText style={styles.notificationTitle}>Notifications</AppText>
              <AppText style={styles.notificationSub}>
                {allow_notifications ? "ENABLED" : "DISABLED"}
              </AppText>
            </VStack>
          </HStack>

          <Switch
            value={allow_notifications}
            onValueChange={handleToggle}
            trackColor={{ false: "#374151", true: "#6A11CB" }}
            thumbColor={allow_notifications ? "#fff" : "#f4f4f5"}
          />
        </HStack>
      </AnimatedPressable>

      <View style={styles.logoutCard}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <HStack style={{ alignItems: "center" }}>
            <View style={styles.logoutIcon}>
              <Icon as={LogOut} size="sm" color="#fff" />
            </View>
            <AppText style={styles.logoutText}>Log Out</AppText>
          </HStack>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
  },
  notificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6A11CB",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  notificationSub: {
    fontSize: 12,
    color: "#D1D5DB",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 20,
    gap: 16,
    marginHorizontal: 16, // adds spacing from screen edge
  },
  logoutCard: {
    backgroundColor: "#1F2937",
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutIcon: {
    backgroundColor: "#EF4444",
    padding: 8,
    borderRadius: 18,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },

});

export default ProfileCard;
