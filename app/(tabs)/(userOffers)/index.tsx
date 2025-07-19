import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  Image,
} from "react-native";
import { fetchUserOffers, updateSeenAtForOffers } from "@/services/sbUserOfferService";
import { useUser } from "@/contexts/userContext";
import UserOfferHeader from "@/components/shared/custom-header/userOfferHeader";
import UserOfferCard from "@/components/screens/userOffer/userOfferCard";
import FullScreenQrModal from "@/components/screens/userOffer/fullScreenQrModal";
import { useFocusEffect } from "@react-navigation/native";

const UserOffers = () => {
  const { user } = useUser();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [offersLoaded, setOffersLoaded] = useState(false);

  const handleOpenQr = (payload: any) => {
    setQrValue(JSON.stringify(payload));
    setQrVisible(true);
  };

  const loadOffers = async () => {
    if (!user?.id) return;
    setLoading(true);
    const results = await fetchUserOffers(user.id);
    setOffers(results);
    setOffersLoaded(true);
    setLoading(false);
  };

  useEffect(() => {
    loadOffers();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id && offers.length > 0) {
        updateSeenAtForOffers(user.id, offers)
      }
    }, [user?.id, offersLoaded, offers])
  );

  return (
    <View style={styles.container}>
      <UserOfferHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadOffers} />
        }
      >
        {user?.id &&
          offers.map((offer) => (
            <UserOfferCard
              key={offer.id}
              title={offer.title}
              offerId={offer.id}
              userId={user.id}
              description={offer.description}
              image_url={offer.image_url}
              valid_until={offer.valid_until}
              venue_name={offer.venue_name}
              onPress={() =>
                handleOpenQr({
                  title: offer.title,
                  offerId: offer.id,
                  userId: user.id,
                  valid_until: offer.valid_until,
                })
              }
            />
          ))}

        {!loading && offers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/4076/4076549.png" }}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No Offers Yet</Text>
            <Text style={styles.emptyDescription}>
              You’ll see offers from venues here when you’re eligible!
            </Text>
          </View>
        )}
        <FullScreenQrModal visible={qrVisible} onClose={() => setQrVisible(false)} value={qrValue} />
      </ScrollView>
    </View>
  );
};

export default UserOffers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1C", // or use your global background color
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginTop: 60,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F9FAFB", // text-white
    marginBottom: 8,
    fontFamily: "dm-sans-bold",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    color: "#9CA3AF", // text-gray-400
    paddingHorizontal: 24,
    fontFamily: "dm-sans",
  },
});
