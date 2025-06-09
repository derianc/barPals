import React, { useEffect, useRef, useState } from "react";
import { RefreshControl } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { ScrollView } from "@/components/ui/scroll-view";
import Animated, { FadeInUp, FadeOutDown, } from "react-native-reanimated";
import UserFeedHeader from "@/components/shared/custom-header/userFeedHeader";
import { deleteReceiptById, getAllReceiptsForUser } from "@/services/sbReceiptService";
import ReceiptCard from "@/components/screens/userFeed/receipt-card/receiptCard";
import { getReceiptItems } from "@/services/sbReceiptItemsService";
import { Text as AppText } from "@/components/ui/text";
import 'react-native-gesture-handler';
import { RectButton, } from "react-native-gesture-handler";
import Swipeable from 'react-native-gesture-handler/Swipeable';

const userFeed = () => {

  const [receipts, setReceipts] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(1);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<number, any[]>>({});
  const swipeableRefs = useRef<Record<number, Swipeable | null>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredReceipts, setFilteredReceipts] = useState<any[]>([]);

  const fetchReceipts = async () => {
    try {
      setRefreshing(true);
      const result = await getAllReceiptsForUser();
      setReceipts(result);
    } catch (err) {
      console.error("Failed to load receipts", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReceipts(receipts);
    } else {
      const query = searchQuery.toLowerCase();
      const results = receipts.filter((r) =>
        r.merchant_name.toLowerCase().includes(query)
      );
      setFilteredReceipts(results);
    }
  }, [searchQuery, receipts]);

  const handleSelectCard = async (receiptId: number) => {
    // Toggle card selection
    setSelectedCard((prev) => (prev === receiptId ? null : receiptId));

    // Fetch and cache items if not already loaded
    if (!selectedItems[receiptId]) {
      try {
        const fetched = await getReceiptItems(receiptId);
        setSelectedItems((prev) => ({ ...prev, [receiptId]: fetched }));
      } catch (err) {
        console.error("Failed to fetch receipt items:", err);
      }
    }
  };

  const renderRightActions = (receiptId: number) => (
    <RectButton
      style={{
        backgroundColor: '#EF4444', // red
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        borderRadius: 18,
        marginVertical: 4,
      }}
      onPress={() => handleDelete(receiptId)}
    >
      <AppText className="text-white font-bold">Delete</AppText>
    </RectButton>
  );

  const handleDelete = async (receiptId: number) => {
    try {
      const { success } = await deleteReceiptById(receiptId);

      if (success) {
        // Close swipeable
        swipeableRefs.current[receiptId]?.close?.();

        // Remove from UI
        setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
        setSelectedItems((prev) => {
          const updated = { ...prev };
          delete updated[receiptId];
          return updated;
        });

        if (selectedCard === receiptId) {
          setSelectedCard(null);
        }
      }
    } catch (error) {
      console.error("❌ Failed to delete receipt:", error);
    }
  };

  const getMostVisitedVenue = (): string => {
    const countMap: Record<string, number> = {};

    receipts.forEach((receipt) => {
      const name = receipt.merchant_name || "Unknown";
      countMap[name] = (countMap[name] || 0) + 1;
    });

    let maxVisits = 0;
    let mostVisited = "N/A";

    for (const [merchant, count] of Object.entries(countMap)) {
      if (count > maxVisits) {
        maxVisits = count;
        mostVisited = merchant;
      }
    }

    return mostVisited;
  };

  return (
    <VStack space="md" className="flex-1 bg-background-0">
      <UserFeedHeader
        title="Receipts"
        label="Search Receipts"
        receiptCount={receipts.length}
        mostVisited={getMostVisitedVenue()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ScrollView
        contentContainerClassName="gap-3 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchReceipts} />
        }
      >
        {filteredReceipts.length === 0 ? (
          <AppText className="text-center text-typography-300 mt-6">
            No receipts match your search.
          </AppText>
        ) : (
          filteredReceipts.map((receipt, index) => {
            try {
              return (
                <Swipeable
                  key={receipt.id}
                  ref={(ref) => {
                    if (ref) swipeableRefs.current[receipt.id] = ref;
                  }}
                  renderRightActions={() => renderRightActions(receipt.id)}
                >
                  <Animated.View
                    entering={FadeInUp.delay(index * 100).springify().damping(12)}
                  >
                    <ReceiptCard
                      receipt_id={receipt.id}
                      merchant_name={receipt.merchant_name}
                      merchant_address={receipt.merchant_address ?? "Unknown Address"}
                      transaction_date={receipt.transaction_date}
                      transaction_time={receipt.transaction_time}
                      item_count={receipt.item_count}
                      total={receipt.total}
                      isSelected={selectedCard === receipt.id}
                      isVerified={receipt.isVerified}
                      onSelect={handleSelectCard}
                      items={selectedItems[receipt.id] || []}
                      isExpanded={selectedCard === receipt.id}
                    />
                  </Animated.View>
                </Swipeable>
              );
            } catch (error) {
              console.error(`🚨 Render error for receipt ID ${receipt.id}:`, error);
              return (
                <VStack key={`error-${receipt.id}`} className="p-4 bg-red-100 rounded-xl">
                  <AppText className="text-red-700 font-semibold">
                    Failed to render receipt ID {receipt.id}
                  </AppText>
                </VStack>
              );
            }
          })
        )}

      </ScrollView>
    </VStack>
  );
};

export default userFeed;
