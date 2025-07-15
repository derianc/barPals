import React, { useEffect, useRef, useState } from "react";
import { RefreshControl, View } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { ScrollView } from "@/components/ui/scroll-view";
import Animated, { FadeInUp, FadeOutDown, } from "react-native-reanimated";
import UserFeedHeader from "@/components/shared/custom-header/userFeedHeader";
import { archiveReceiptById, deleteReceiptById, getAllReceiptsForUser } from "@/services/sbCoreReceiptService";
import ReceiptCard from "@/components/screens/userFeed/receipt-card/receiptCard";
import { getReceiptItems } from "@/services/sbReceiptItemsService";
import { Text as AppText } from "@/components/ui/text";
import 'react-native-gesture-handler';
import { RectButton, } from "react-native-gesture-handler";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useUser } from "@/contexts/userContext";
import LoadingFooter from "@/components/loadingComponent/LoadingFooter";
import { Trash2, Archive, FileText  } from "lucide-react-native"; 
import { StyleSheet, Linking } from "react-native";

const userFeed = () => {

  const [receipts, setReceipts] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(1);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<number, any[]>>({});
  const swipeableRefs = useRef<Record<number, Swipeable | null>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredReceipts, setFilteredReceipts] = useState<any[]>([]);
  const { user, rehydrated } = useUser();

  const [lastSeenDate, setLastSeenDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (rehydrated && user) {
      loadReceipts(true); // pass explicitly
    }
  }, [rehydrated, user]);

const pageSize = 5;
const [hasMore, setHasMore] = useState(true);

const loadReceipts = async (reset = false) => {
  if (loading || (!reset && !hasMore)) return;

  setLoading(true);
  setShowSkeleton(true);

  try {
    if (!user) return;

    const cursor = reset ? null : lastSeenDate;
    const newReceipts = await getAllReceiptsForUser(user.id, cursor, pageSize);

    if (reset) {
      setReceipts(newReceipts);
    } else {
      setReceipts((prev) => [...prev, ...newReceipts]);
    }

    if (newReceipts.length < pageSize) {
      setHasMore(false);
    }

    if (newReceipts.length > 0) {
      const last = newReceipts[newReceipts.length - 1];
      setLastSeenDate(last.transaction_date); // ✅ now safe to update
    }
  } catch (err) {
    console.error("🔴 Error fetching receipts:", err);
  } finally {
    setLoading(false);
    setShowSkeleton(false);
  }
};


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
   <View style={styles.actionsContainer}>
    <RectButton
      style={[styles.actionButton, styles.archive]}
      onPress={() => handleArchive(receiptId)}
    >
      <Archive color="white" size={20} />
    </RectButton>

    <RectButton
      style={[styles.actionButton, styles.delete]}
      onPress={() => handleDelete(receiptId)}
    >
      <Trash2 color="white" size={20} />
    </RectButton>
  </View>
);

const renderLeftActions = (receiptUrl: string) => (
  <View style={styles.container}>
    <RectButton
      style={[styles.actionButton, styles.viewReceipt]}
      onPress={() => {
        if (receiptUrl && typeof receiptUrl === "string") {
          Linking.openURL(receiptUrl);
        } else {
          console.warn("⚠️ No valid receipt URL to open.");
        }
      }}
    >
      <FileText color="white" size={20} />
    </RectButton>
  </View>
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

  const handleArchive = async (receiptId: number) => {
    try {
      const { success } = await archiveReceiptById(receiptId);

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
        contentContainerClassName="gap-3 px-5 pb-20"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              if (user) {
                setReceipts([]);             // ✅ Clear old data
                setLastSeenDate(null);       // ✅ Reset cursor
                setHasMore(true);            // ✅ Allow more loads
                setFilteredReceipts([]);     // (Optional) Clear filtered view
                loadReceipts(true);          // ✅ Fetch fresh
              }
            }}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;

          if (isBottom && hasMore && !loading && user) {
            loadReceipts();
          }
        }}
        onContentSizeChange={(width, height) => {
          // when content height grows, check again
          if (height > contentHeight) {
            setContentHeight(height);
            setTimeout(() => {
              // ensure it re-checks scroll position on next tick
              loadReceipts(); // 🔁 try loading more if we're still at bottom
            }, 100);
          }
        }}
        scrollEventThrottle={400}
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
                  renderLeftActions={() => renderLeftActions(receipt.receipt_url)}
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
                      isVerified={!!receipt.venue_id}
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

        {loading && hasMore && <LoadingFooter />}
      </ScrollView>
    </VStack>
  );
};

export default userFeed;

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: "row", // horizontal layout
    alignItems: "center",
    height: "100%",
    paddingRight: 8,
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  archive: {
    backgroundColor: "#3B82F6", // blue
  },
  delete: {
    backgroundColor: "#EF4444", // red
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    paddingLeft: 8,
  },
  viewReceipt: {
    backgroundColor: "#10B981", // teal-green (to distinguish from archive/delete)
  },
});
