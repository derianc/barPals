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
  scheduledAt?: Date | null;
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
  const isUpcoming = scheduled_at ? new Date(scheduled_at) > new Date() : false;
  const formattedScheduledAt = offer.scheduled_at ? format(new Date(offer.scheduled_at), "MMM d, yyyy h:mm a") : null;

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

      {scheduled_at && !sent && isUpcoming && (
        <Text style={styles.statusBadge}>Scheduled</Text>
      )}
      {scheduled_at && sent && (
        <Text style={[styles.statusBadge, { backgroundColor: "#10B981" }]}>Sent</Text>
      )}

      <HStack style={styles.metaRow}>
        <View style={styles.validityContainer}>
          <View style={styles.side}>
            <HStack style={styles.sideInner}>
              <Icon as={CalendarCheck} size="sm" style={styles.sideIcon} />
              <View style={styles.dateTimeStack}>
                <Text style={styles.dateText}>{format(parseISO(valid_from), "MMM d")}</Text>
                <Text style={styles.timeText}>{format(parseISO(valid_from), "h:mm a")}</Text>
              </View>
            </HStack>
          </View>

          <Text style={styles.arrow}>→</Text>

          <View style={styles.side}>
            <HStack style={styles.sideInner}>
              <Icon as={CalendarCheck} size="sm" style={styles.sideIcon} />
              <View style={styles.dateTimeStack}>
                <Text style={styles.dateText}>{format(parseISO(valid_until), "MMM d")}</Text>
                <Text style={styles.timeText}>{format(parseISO(valid_until), "h:mm a")}</Text>
              </View>
            </HStack>
          </View>
        </View>

        <Divider orientation="vertical" style={styles.divider} />

        <HStack style={styles.metaItem}>
          <Icon as={Clock} size="lg" style={styles.metaIcon} />
          <Text style={styles.metaText}>
            Created {format(parseISO(created_at), "MMM d, yyyy")}
          </Text>
        </HStack>
      </HStack>

      {formattedScheduledAt && (
        <HStack style={styles.metaItem}>
          <Icon as={CalendarClock} size={"lg"} style={styles.metaIcon} />
          <Text style={styles.metaText}>
            {offer.sent ? "Sent at" : "Scheduled for"} {formattedScheduledAt}
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
  metaIcon: {
    color: "#9CA3AF",
  },
  metaText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "dm-sans-light",
  },
  targetSection: {
    marginTop: 4,
    gap: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FBBF24", // Tailwind amber-400
    color: "#111827", // Tailwind gray-900
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  arrowContainer: {
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F9FAFB", // white
    fontFamily: "dm-sans-medium",
  },
  timeText: {
    fontSize: 13,
    color: "#D1D5DB", // light gray
    fontFamily: "dm-sans",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    gap: 16,
  },

  validityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
    maxWidth: "65%", // Ensures space for created date
  },
  side: {
    flexShrink: 1,
  },
  sideInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  sideIcon: {
    color: "#9CA3AF",
    marginTop: 8,
  },
  dateTimeStack: {
    flexDirection: "column",
  },
  arrow: {
    fontSize: 18,
    color: "#9CA3AF",
    marginHorizontal: 4,
    alignSelf: "center",
  },
  divider: {
    height: "100%",
    width: 1,
    backgroundColor: "#374151",
    marginHorizontal: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
});

export default OfferCard;
