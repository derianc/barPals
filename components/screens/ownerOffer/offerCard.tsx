import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { format, parseISO } from "date-fns";
import {
  CalendarCheck,
  Clock,
  Radar,
  DollarSign,
  Target,
  SendHorizonal,
  CalendarClock,
} from "lucide-react-native";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";

type TargetCriteria = {
  lastVisited?: string[];
  minSpend?: number;
  maxDistance?: number;
};

type Offer = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
  scheduled_at?: string;
  sent?: boolean;
  target_criteria?: TargetCriteria;
};

const OfferCard = ({ offer }: { offer: Offer }) => {
  const {
    title,
    description,
    image_url,
    valid_from,
    valid_until,
    created_at,
    scheduled_at,
    sent,
    target_criteria,
  } = offer;

  const lastVisited = target_criteria?.lastVisited;

  return (
    <View style={styles.card}>
      {image_url && (
        <Image
          source={{ uri: image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <HStack style={styles.metaRow}>
        <HStack style={styles.metaItem}>
          <Icon as={CalendarCheck} size={"lg"} style={styles.metaIcon} />
          <Text style={styles.metaText}>
            {format(parseISO(valid_from), "MMM d")} →{" "}
            {format(parseISO(valid_until), "MMM d")}
          </Text>
        </HStack>

        <Divider orientation="vertical" style={styles.divider} />

        <HStack style={styles.metaItem}>
          <Icon as={Clock} size={"lg"} style={styles.metaIcon} />
          <Text style={styles.metaText}>
            Created {format(parseISO(created_at), "MMM d, yyyy")}
          </Text>
        </HStack>
      </HStack>

      {scheduled_at && (
        <HStack style={styles.metaItem}>
          <Icon as={CalendarClock} size={"lg"} style={styles.metaIcon} />
          <Text style={styles.metaText}>
            Scheduled {format(parseISO(scheduled_at), "MMM d, yyyy h:mm a")}
          </Text>
        </HStack>
      )}

      {typeof sent === "boolean" && (
        <HStack style={styles.metaItem}>
          <Icon as={SendHorizonal} size={"lg"} style={[styles.metaIcon, { color: sent ? "#10B981" : "#F87171" }]} />
          <Text style={[styles.metaText, { color: sent ? "#10B981" : "#F87171" }]}>
            {sent ? "Sent" : "Not Sent"}
          </Text>
        </HStack>
      )}

      {target_criteria && (
        <VStack style={styles.targetSection}>
          {Array.isArray(lastVisited) && lastVisited.length > 0 && (
            <HStack style={styles.metaItem}>
              <Icon as={Target} size={"lg"} style={styles.metaIcon} />
              <Text style={styles.metaText}>
                Last Visited: {lastVisited.join(", ")}
              </Text>
            </HStack>
          )}

          {"minSpend" in target_criteria && (
            <HStack style={styles.metaItem}>
              <Icon as={DollarSign} size={"lg"} style={styles.metaIcon} />
              <Text style={styles.metaText}>
                Min Spend: ${target_criteria.minSpend?.toFixed(2)}
              </Text>
            </HStack>
          )}

          {"maxDistance" in target_criteria && (
            <HStack style={styles.metaItem}>
              <Icon as={Radar} size={"lg"} style={styles.metaIcon} />
              <Text style={styles.metaText}>
                Max Distance: {target_criteria.maxDistance} mi
              </Text>
            </HStack>
          )}
        </VStack>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#F9FAFB",
    fontFamily: "dm-sans-bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#D1D5DB",
    fontFamily: "dm-sans",
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  metaIcon: {
    color: "#9CA3AF",
  },
  metaText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "dm-sans-light",
  },
  divider: {
    height: 48,
    width: 1,
    backgroundColor: "#374151",
    marginHorizontal: 12,
  },
  targetSection: {
    marginTop: 4,
    gap: 4,
  },
});

export default OfferCard;
