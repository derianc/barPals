import React, { useEffect, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
} from "react-native";
import { fetchUserOffers } from "@/services/sbUserOfferService";
import { useUser } from "@/contexts/userContext";
import UserOfferHeader from "@/components/shared/custom-header/userOfferHeader";
import UserOfferCard from "@/components/screens/userOffer/userOfferCard";

const UserOffers = () => {
  const { user } = useUser();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOffers = async () => {
    if (!user?.id) return;
    setLoading(true);
    const results = await fetchUserOffers(user.id);
    setOffers(results);
    setLoading(false);
  };

  useEffect(() => {
    loadOffers();
  }, [user?.id]);

  return (
    <View style={styles.container}>
      <UserOfferHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadOffers} />
        }
      >
        {offers.map((offer) => (
          <UserOfferCard
            key={offer.id}
            title={offer.title}
            description={offer.description}
            image_url={offer.image_url}
            valid_until={offer.valid_until}
            venue_name={offer.venue_name}
            onPress={() => {
              console.log("Offer tapped:", offer.id);
            }}
          />
        ))}

        {!loading && offers.length === 0 && (
          <View style={styles.emptyContainer}>
            <UserOfferCard
              title="No Offers Yet"
              description="You’ll see offers from venues here when you're eligible!"
              valid_until={new Date().toISOString()}
              venue_name=""
              image_url="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
              onPress={() => {}}
            />
          </View>
        )}
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
    paddingTop: 24,
    alignItems: "center",
  },
});
