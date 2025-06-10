import React from "react";
import { StyleSheet, Switch, View } from "react-native";
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
import { Bell } from "lucide-react-native";
import { updateUserProfile } from "@/services/sbUserService";

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

  return (
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
});

export default ProfileCard;
