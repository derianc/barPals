import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Plus } from "lucide-react-native";

import { useUser } from "@/contexts/userContext";
import OfferCard from "@/components/screens/ownerOffer/offerCard";
import { getOffersForVenue } from "@/services/sbOfferService";
import { Fab, FabIcon } from "@/components/ui/fab";
import OwnerOfferHeader from "@/components/shared/custom-header/ownerOfferHeader";

const OwnerOfferScreen = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // ✅ new
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();

  const fetchOffers = async () => {
    if (!user?.id) return;
    const data = await getOffersForVenue(user.id);
    setOffers(data || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchOffers();
      setLoading(false);
    };

    load();
  }, [user, params.refresh]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  }, [user]);

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
