import React, { useEffect, useState } from "react";
import { RefreshControl } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { ScrollView } from "@/components/ui/scroll-view";
import Animated, { FadeInDown, FadeInUp, FadeOutDown, } from "react-native-reanimated";
import CustomHeader from "@/components/shared/custom-header";
import { getAllReceiptsForUser } from "@/services/sbReceiptService";
import ReceiptCard from "@/components/screens/userFeed/receipt-card/receiptCard";
import ReceiptItemCard from "@/components/screens/userFeed/receipt-card/receiptItemCard";
import { getReceiptItems } from "@/services/sbReceiptItemsService";
import Modal from "react-native-modal";
import { TransactionItem } from "@/data/models/transactionModel";
import { Text as AppText } from "@/components/ui/text";


const Location = () => {

  const [receipts, setReceipts] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(1);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<number, any[]>>({});
  
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

  useEffect(() => {
    fetchReceipts();
  }, []);


  return (
    <VStack space="md" className="flex-1 bg-background-0">
      <CustomHeader
        variant="search"
        title="Location"
        label="Search Receipts"
      />
      <ScrollView
        contentContainerClassName="gap-3 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchReceipts} />
        }
      >
        {receipts.map((receipt, index) => {
          try {
            return (
              <Animated.View
                key={receipt.id}
                entering={FadeInUp.delay(index * 100).springify().damping(12)}
              >
                <ReceiptCard
                  receipt_id={receipt.id}
                  merchant_name={receipt.merchant_name}
                  transaction_date={receipt.transaction_date}
                  transaction_time={receipt.transaction_time}
                  item_count={receipt.item_count}
                  total={receipt.total}
                  isSelected={selectedCard === receipt.id}
                  isVerified={receipt.isVerified}
                  onSelect={handleSelectCard}
                />

                {selectedCard === receipt.id &&
                  Array.isArray(selectedItems[receipt.id]) && (
                    <Animated.View
                      entering={FadeInUp.delay(index * 100).springify().damping(12)}
                      exiting={FadeOutDown.delay(index * 50).springify().damping(12)}
                    >
                      <ReceiptItemCard
                        isSelected={selectedCard === receipt.id}
                        items={selectedItems[receipt.id].map((item: any) => ({
                          item_name: item.item_name,
                          quantity: item.quantity,
                          price: item.price,
                        }))}
                      />
                    </Animated.View>
                  )}
              </Animated.View>
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
        })}

      </ScrollView>
    </VStack>
  );
};

export default Location;
