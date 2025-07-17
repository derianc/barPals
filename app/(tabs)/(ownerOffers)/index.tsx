import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Plus } from "lucide-react-native";
import { useUser } from "@/contexts/userContext";
import { useVenue } from "@/contexts/venueContex";
import OfferCard from "@/components/screens/ownerOffer/offerCard";
import { getOffersForVenue } from "@/services/sbOwnerOfferService";
import { Fab, FabIcon } from "@/components/ui/fab";
import OwnerOfferHeader from "@/components/shared/custom-header/ownerOfferHeader";

const OwnerOfferScreen = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { selectedVenue } = useVenue(); // ✅ Grab selectedVenue from context
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUser();

  const fetchOffers = async () => {
    if (!selectedVenue?.id || !user?.id) return;
    
    const data = await getOffersForVenue(user?.id, selectedVenue.id);
    setOffers(data || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchOffers();
      setLoading(false);
    };

    load();
  }, [selectedVenue?.id, params.refresh]); // ✅ depend on selectedVenue.id

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  }, [selectedVenue?.id]);

  const handleCreateOffer = () => {
    router.push("./create");
  };

  return (
    <View className="flex-1 bg-background-0">
      <OwnerOfferHeader />

      {loading ? (
        <ActivityIndicator className="mt-10" size="large" />
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OfferCard offer={item} />}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <Fab
        placement="bottom right"
        size="lg"
        className="bg-red-600 hover:bg-red-700 active:bg-red-800"
        onPress={handleCreateOffer}
      >
        <FabIcon as={Plus} size="xl" />
      </Fab>
    </View>
  );
};

export default OwnerOfferScreen;
