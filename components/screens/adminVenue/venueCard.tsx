import React from "react";
import {
  Image,
  StyleSheet,
  View,
  Text as RNText,
} from "react-native";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Icon } from "@/components/ui/icon";
import {
  MapPin,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react-native";

interface IVenueCard {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  owner_email?: string | null;
  logo_url?: string | null;
  scan_count?: number;
  onPress?: (venue_id: string) => void;
}

const VenueCard = ({
  id,
  name,
  address,
  city,
  state,
  is_active,
  owner_email,
  logo_url,
  scan_count,
  onPress,
}: IVenueCard) => {
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.96), withSpring(1));
    onPress?.(id);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        animatedStyle,
        styles.cardContainer,
        is_active ? styles.activeCard : styles.inactiveCard,
      ]}
    >
      <HStack style={styles.topRow}>
        {logo_url ? (
          <Image
            source={{ uri: logo_url }}
            style={styles.logo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.logoFallback}>
            <RNText style={styles.logoInitial}>{name?.[0] ?? "?"}</RNText>
          </View>
        )}

        <VStack style={styles.details}>
          <Text style={styles.venueName}>{name}</Text>

          <HStack style={styles.row}>
            <Icon as={MapPin} size="xs" style={styles.icon} />
            <Text style={styles.metaText}>
              {[address, city, state].filter(Boolean).join(", ")}
            </Text>
          </HStack>

          <HStack style={styles.row}>
            <Icon as={User} size="xs" style={styles.icon} />
            {owner_email ? (
              <Text style={styles.metaText}>{owner_email}</Text>
            ) : (
              <View style={styles.badgeUnassigned}>
                <Text style={styles.badgeUnassignedText}>Unassigned</Text>
              </View>
            )}
          </HStack>
        </VStack>
      </HStack>

      <HStack style={styles.metricsRow}>
  <HStack style={styles.row}>
    <Icon
      as={is_active ? CheckCircle : XCircle}
      size="sm"
      style={is_active ? styles.activeIcon : styles.inactiveIcon}
    />
    <Text style={styles.metaText}>
      {is_active ? "Active" : "Inactive"}
    </Text>
  </HStack>

  <View style={styles.verticalDivider} />

  <VStack>
    <Text style={styles.scanCountText}>{scan_count ?? 0}</Text>
    <Text style={styles.scanLabel}>Scans</Text>
  </VStack>
</HStack>

    </AnimatedPressable>
  );
};

export default VenueCard;

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
    borderRadius: 18,
    gap: 12,
    flexDirection: "column",
    marginBottom: 12,
  },
  activeCard: {
    backgroundColor: "#1C1C1E", // dark gray
  },
  inactiveCard: {
    backgroundColor: "#2C2C2E", // slightly lighter dark
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#374151",
  },
  logoFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  logoInitial: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  details: {
    flex: 1,
    justifyContent: "center",
  },
  venueName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "dm-sans-bold",
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  icon: {
    color: "#D1D5DB", // light gray
  },
  metaText: {
    fontSize: 13,
    color: "#D1D5DB", // light gray
    fontFamily: "dm-sans-light",
  },
  badgeUnassigned: {
    backgroundColor: "#4B5563", // muted badge
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeUnassignedText: {
    fontSize: 12,
    color: "#F9FAFB",
    fontWeight: "500",
  },
  activeIcon: {
    color: "#10B981", // green
  },
  inactiveIcon: {
    color: "#EF4444", // red
  },
  metricsRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 12,
  gap: 12,
},
verticalDivider: {
  width: 1,
  height: 40,
  backgroundColor: "#4B5563", // muted gray
  marginHorizontal: 8,
  borderRadius: 1,
},

scanCountText: {
  fontSize: 20,
  fontWeight: "600",
  color: "#FFFFFF",
  textAlign: "right",
  fontFamily: "dm-sans-bold",
},

scanLabel: {
  fontSize: 12,
  color: "#9CA3AF",
  textAlign: "right",
  fontFamily: "dm-sans-light",
},

});
