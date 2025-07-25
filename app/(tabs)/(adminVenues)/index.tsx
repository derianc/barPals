import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { fetchAdminVenues } from "@/services/sbAdminVenueService";
import { AdminVenueViewRow } from "@/types/Venue";
import VenueCard from "@/components/screens/adminVenue/venueCard";
import GenericHeader from "@/components/shared/custom-header/genericHeader";
import { VStack } from "@/components/ui/vstack";

const AdminVenuesScreen = () => {
  const router = useRouter();
  const [venues, setVenues] = useState<(AdminVenueViewRow  & { owner_email: string | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVenues = async () => {
    setLoading(true);
    const result = await fetchAdminVenues();
    // console.log('result', JSON.stringify(result, null, 2))
    setVenues(result || []);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVenues();
    setRefreshing(false);
  };

  useEffect(() => {
    loadVenues();
  }, []);

    return (
        <VStack space="md" className="flex-1 bg-background-0">
            <GenericHeader />

            <ScrollView
                contentContainerClassName="gap-3 px-5 pb-24"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {venues.length === 0 ? (
                    <Text style={styles.emptyText}>No venues found.</Text>
                ) : (
                    venues.map((item) => (
                        <VenueCard
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            address={item.address_line1}
                            city={item.city}
                            state={item.state}
                            is_active={item.is_active}
                            owner_email={item.owner_email}
                            scan_count={item.receipt_scan_count}
                            onPress={() =>
                                router.replace({
                                    pathname: "/(tabs)/(adminVenues)/[id]/edit",
                                    params: {
                                        id: item.id,
                                        name: item.name,
                                        address: item.address_line1,
                                        city: item.city,
                                        state: item.state,
                                        owner_email: item.owner_email ?? "",
                                    },
                                    key: item.id
                                } as any)
                            }
                        />
                    ))
                )}
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
            onPress={() => router.push("/(tabs)/(adminVenues)/registerVenue")}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </VStack>
    );
};

export default AdminVenuesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  venueCard: {
    backgroundColor: "#E6F0FF", // consistent soft blue card
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  venueName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0e0e10",
  },
  activeBadge: {
    backgroundColor: "#D1FAE5",
    color: "#065F46",
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    borderRadius: 8,
  },
  inactiveBadge: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    borderRadius: 8,
  },
  venueAddress: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 4,
  },
  ownerText: {
    fontSize: 13,
    marginTop: 4,
    color: "#6B7280",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#2575FC",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
});
