import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";

import { useUser } from "@/contexts/userContext";
import OfferCard from "@/components/screens/ownerOffer/offerCard";
import { getOffersForVenue } from "@/services/sbOfferService";
import { Fab, FabIcon } from "@/components/ui/fab";
import OwnerOfferHeader from "@/components/shared/custom-header/ownerOfferHeader";

const OwnerOfferScreen = () => {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();
    const router = useRouter();

    useEffect(() => {
        const fetchOffers = async () => {
            setLoading(true);
            if (!user?.id) return;
            const data = await getOffersForVenue(user.id);
            setOffers(data || []);
            setLoading(false);
        };

        fetchOffers();
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
