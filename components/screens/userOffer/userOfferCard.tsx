import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { format, parseISO } from "date-fns";
import { CalendarCheck, Store } from "lucide-react-native";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";

interface UserOfferCardProps {
  title: string;
  description: string;
  image_url?: string;
  valid_until: string;
  venue_name: string;
  onPress?: () => void;
}

const UserOfferCard: React.FC<UserOfferCardProps> = ({
  title,
  description,
  image_url,
  valid_until,
  venue_name,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {image_url && (
        <Image source={{ uri: image_url }} style={styles.image} resizeMode="cover" />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.venue}>From {venue_name}</Text>
        <Text style={styles.description}>{description}</Text>

        <HStack style={styles.expiryRow}>
          <Icon as={CalendarCheck} size={"sm"} style={styles.icon} />
          <Text style={styles.expiryText}>
            Expires {format(parseISO(valid_until), "MMM d, yyyy")}
          </Text>
        </HStack>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    overflow: "hidden",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 180,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F9FAFB",
    fontFamily: "dm-sans-bold",
    marginBottom: 4,
  },
  venue: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 6,
    fontFamily: "dm-sans-medium",
  },
  description: {
    fontSize: 14,
    color: "#D1D5DB",
    fontFamily: "dm-sans",
    marginBottom: 10,
    lineHeight: 20,
  },
  expiryRow: {
    alignItems: "center",
    gap: 6,
  },
  icon: {
    color: "#FBBF24",
  },
  expiryText: {
    color: "#FBBF24",
    fontSize: 13,
    fontFamily: "dm-sans-medium",
  },
});

export default UserOfferCard;
