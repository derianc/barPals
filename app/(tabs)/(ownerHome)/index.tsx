// components/screens/userHome/index.tsx

import React, { useCallback, useContext, useEffect, useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import HourlyCard from "@/components/screens/userHome/hourly-card";
import Chart from "@/components/screens/userHome/chart";
import { WeatherTabContext } from "@/contexts/user-home-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { supabase } from "@/supabase";
import {
  getAverageItemsPerVisit,
  getAverageUserSpend,
  getSpendBuckets,
  getTotalUserSpend,
  getUniqueMerchantsVisited,
  getUniqueVisitsByWeekday,
  SpendBucket,
} from "@/services/sbReceiptService";
import { DollarSign, StoreIcon, PackageIcon, Box, CloudRain } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import VisitBarCard from "@/components/screens/userHome/daily-visit-card";
import ShimmerCard from "@/components/screens/userHome/shimmer-card/shimmer-card";

/**
 * Timeframe union type includes "day", "7days", "30days", and "all".
 */
type Timeframe = "7days" | "30days" | "all";

const UserHome = () => {
  const { childRefs, hasHourlyTabChild1Animated }: any = useContext(WeatherTabContext);
  const AnimatedVStack = Animated.createAnimatedComponent(VStack);

  const { selectedTabIndex } = useContext(WeatherTabContext);


  // 1) Define your timeframe here. Change as needed:
  // const timeframe: Timeframe = "day"; // Options: "day", "7days", "30days", "all"
  const timeframe: Timeframe =
    selectedTabIndex === 0
      ? "7days"
      : selectedTabIndex === 1
        ? "30days"
        : selectedTabIndex === 2
          ? "all"
          : "all";


  // 2) State for “current” metrics
  const [currentTotalSpend, setCurrentTotalSpend] = useState<number | null>(null);
  const [currentAvgSpend, setCurrentAvgSpend] = useState<number | null>(null);
  const [currentVenuesVisited, setCurrentVenuesVisited] = useState<number | null>(null);
  const [currentAvgItems, setCurrentAvgItems] = useState<number | null>(null);

  // 3) State for “previous” metrics (for arrow comparisons)
  const [previousTotalSpend, setPreviousTotalSpend] = useState<number | null>(null);
  const [previousAvgSpend, setPreviousAvgSpend] = useState<number | null>(null);
  const [previousVenuesVisited, setPreviousVenuesVisited] = useState<number | null>(null);
  const [previousAvgItems, setPreviousAvgItems] = useState<number | null>(null);

  // 4) State for chart buckets and loading flag
  const [spendData, setSpendData] = useState<SpendBucket[]>([]);
  const [spendLoading, setSpendLoading] = useState<boolean>(true);

  const [dailyVisits, setDailyVisits] = useState<{ day: string; visitCount: number }[]>([]);

  // 5) Fetch both “current” and “previous” metrics whenever timeframe changes
  useEffect(() => {
    fetchCurrentAndPreviousMetrics();
  }, [timeframe]);

  async function fetchCurrentAndPreviousMetrics() {
    // Reset to trigger shimmer
    setCurrentTotalSpend(null);
    setCurrentAvgSpend(null);
    setCurrentVenuesVisited(null);
    setCurrentAvgItems(null);
    setPreviousTotalSpend(null);
    setPreviousAvgSpend(null);
    setPreviousVenuesVisited(null);
    setPreviousAvgItems(null);


    const now = new Date();
    let startCurrent: Date | null;
    let startPrevious: Date | null;
    let endPrevious: Date | null;

    // 5a) Determine windows based on timeframe
    if (timeframe === "7days") {
      // Last 7 days: midnight 6 days ago → now
      startCurrent = new Date(now);
      startCurrent.setHours(0, 0, 0, 0);
      startCurrent.setDate(startCurrent.getDate() - 6);

      // Previous 7 days: midnight 14 days ago → midnight 7 days ago
      endPrevious = new Date(startCurrent);
      startPrevious = new Date(endPrevious);
      startPrevious.setDate(startPrevious.getDate() - 7);
    } else if (timeframe === "30days") {
      // Last 30 days: midnight 29 days ago → now
      startCurrent = new Date(now);
      startCurrent.setHours(0, 0, 0, 0);
      startCurrent.setDate(startCurrent.getDate() - 29);

      // Previous 30 days: midnight 59 days ago → midnight 30 days ago
      endPrevious = new Date(startCurrent);
      startPrevious = new Date(endPrevious);
      startPrevious.setDate(startPrevious.getDate() - 30);
    } else {
      // “all”: no lower bound → compare against zero
      startCurrent = null;
      startPrevious = null;
      endPrevious = null;
    }

    // 5b) FETCH CURRENT PERIOD METRICS
    try {
      // Total Spend (current)
      // Use service method if timeframe !== "all"; otherwise fetch all receipts
      let currTotal: number;
      if (timeframe === "all") {
        const { data: allReceipts, error: allError } = await supabase
          .from("user_receipts")
          .select("total");
        if (allError) throw allError;
        currTotal =
          allReceipts?.reduce((sum, r) => sum + (r.total || 0), 0) ?? 0;
      } else {
        currTotal = await getTotalUserSpend(timeframe);
      }
      setCurrentTotalSpend(currTotal);

      // Avg Spend (current)
      let currAvg: number;
      if (timeframe === "all") {
        const { data: allReceiptsForAvg, error: allAvgError } = await supabase
          .from("user_receipts")
          .select("total", { count: "exact" });
        if (allAvgError) throw allAvgError;
        const arr = allReceiptsForAvg ?? [];
        if (arr.length === 0) {
          currAvg = 0;
        } else {
          const sumAll = arr.reduce((sum, r) => sum + (r.total || 0), 0);
          currAvg = parseFloat((sumAll / arr.length).toFixed(2));
        }
      } else {
        currAvg = await getAverageUserSpend(timeframe);
      }
      setCurrentAvgSpend(currAvg);

      // Venues Visited (current)
      let currVenues: number;
      if (timeframe === "all") {
        const { data: allVenuesData, error: allVenuesError } = await supabase
          .from("user_receipts")
          .select("merchant_name");
        if (allVenuesError) throw allVenuesError;
        const uniqueAll = new Set(
          (allVenuesData ?? []).map((r) =>
            r.merchant_name?.trim().toLowerCase()
          )
        );
        currVenues = uniqueAll.size;
      } else {
        currVenues = await getUniqueMerchantsVisited(timeframe);
      }
      setCurrentVenuesVisited(currVenues);

      // Avg Items/Visit (current)
      let currAvgItems: number;
      if (timeframe === "all") {
        const { data: allReceiptIds, error: allReceiptIdsError } = await supabase
          .from("user_receipts")
          .select("id");
        if (allReceiptIdsError) throw allReceiptIdsError;
        const allIds = (allReceiptIds ?? []).map((r) => r.id);
        if (allIds.length === 0) {
          currAvgItems = 0;
        } else {
          const {
            count: allItemCount,
            error: allItemCountError,
          } = await supabase
            .from("user_receipt_items")
            .select("id", { head: true, count: "exact" })
            .in("receipt_id", allIds);
          if (allItemCountError || allItemCount === null)
            throw allItemCountError;
          currAvgItems = parseFloat((allItemCount / allIds.length).toFixed(2));
        }
      } else {
        currAvgItems = await getAverageItemsPerVisit(timeframe);
      }
      setCurrentAvgItems(currAvgItems);
    } catch (err) {
      console.error("Error fetching current‐period metrics:", err);
      setCurrentTotalSpend(0);
      setCurrentAvgSpend(0);
      setCurrentVenuesVisited(0);
      setCurrentAvgItems(0);
    }

    // 5c) FETCH PREVIOUS PERIOD METRICS (skip if timeframe === "all")
    if (timeframe === "all") {
      setPreviousTotalSpend(0);
      setPreviousAvgSpend(0);
      setPreviousVenuesVisited(0);
      setPreviousAvgItems(0);
    } else {
      try {
        // Previous Total Spend
        const { data: prevReceipts, error: prevTotalError } =
          await supabase
            .from("user_receipts")
            .select("total")
            .gte(
              "transaction_date",
              (startPrevious as Date).toISOString().split("T")[0]
            )
            .lt(
              "transaction_date",
              (endPrevious as Date).toISOString().split("T")[0]
            );
        if (prevTotalError) throw prevTotalError;
        const sumPrevTotal =
          prevReceipts?.reduce((sum, r) => sum + (r.total || 0), 0) ?? 0;
        setPreviousTotalSpend(sumPrevTotal);

        // Previous Avg Spend
        const { data: prevReceiptsForAvg, error: prevAvgError } =
          await supabase
            .from("user_receipts")
            .select("total", { count: "exact" })
            .gte(
              "transaction_date",
              (startPrevious as Date).toISOString().split("T")[0]
            )
            .lt(
              "transaction_date",
              (endPrevious as Date).toISOString().split("T")[0]
            );
        if (prevAvgError) throw prevAvgError;
        if ((prevReceiptsForAvg ?? []).length === 0) {
          setPreviousAvgSpend(0);
        } else {
          const sumPrev = (prevReceiptsForAvg ?? []).reduce(
            (sum, r) => sum + (r.total || 0),
            0
          );
          setPreviousAvgSpend(
            parseFloat((sumPrev / prevReceiptsForAvg.length).toFixed(2))
          );
        }

        // Previous Venues Visited
        const { data: prevVenuesData, error: prevVenuesError } =
          await supabase
            .from("user_receipts")
            .select("merchant_name")
            .gte(
              "transaction_date",
              (startPrevious as Date).toISOString().split("T")[0]
            )
            .lt(
              "transaction_date",
              (endPrevious as Date).toISOString().split("T")[0]
            );
        if (prevVenuesError) throw prevVenuesError;
        const uniquePrev = new Set(
          (prevVenuesData ?? []).map((r) =>
            r.merchant_name?.trim().toLowerCase()
          )
        );
        setPreviousVenuesVisited(uniquePrev.size);

        // Previous Avg Items/Visit
        const { data: prevReceiptIds, error: prevReceiptIdsError } =
          await supabase
            .from("user_receipts")
            .select("id")
            .gte(
              "transaction_date",
              (startPrevious as Date).toISOString().split("T")[0]
            )
            .lt(
              "transaction_date",
              (endPrevious as Date).toISOString().split("T")[0]
            );
        if (prevReceiptIdsError) throw prevReceiptIdsError;
        const prevIds = (prevReceiptIds ?? []).map((r) => r.id);
        if (prevIds.length === 0) {
          setPreviousAvgItems(0);
        } else {
          const {
            count: prevItemCount,
            error: prevItemCountError,
          } = await supabase
            .from("user_receipt_items")
            .select("id", { head: true, count: "exact" })
            .in("receipt_id", prevIds);
          if (prevItemCountError || prevItemCount === null)
            throw prevItemCountError;
          setPreviousAvgItems(
            parseFloat((prevItemCount / prevIds.length).toFixed(2))
          );
        }
      } catch (err) {
        console.error("Error fetching previous‐period metrics:", err);
        setPreviousTotalSpend(0);
        setPreviousAvgSpend(0);
        setPreviousVenuesVisited(0);
        setPreviousAvgItems(0);
      }
    }
  }

  // 6) Fetch chart buckets (hourly or daily depending on timeframe)
  useEffect(() => {
    loadSpendBuckets();
  }, [timeframe]);

  const loadSpendBuckets = async () => {
    setSpendLoading(true);
    try {
      const { data, error } = await getSpendBuckets(timeframe);
      if (error) {
        console.error("Error loading spend buckets:", error);
        setSpendData([]);
      } else {
        //console.log("✅ spendData shape check", data.map((d) => ({ label: d.label, total: d.total })));

        setSpendData(data.reverse());
      }
    } catch (e) {
      console.error("Unexpected error loading spend data:", e);
      setSpendData([]);
    } finally {
      setSpendLoading(false);
    }
  };

  useEffect(() => {
    getUniqueVisitsByWeekday(timeframe)
      .then(setDailyVisits)
      .catch((err) => {
        console.error("Failed to fetch daily visits:", err);
        setDailyVisits([]);
      });
  }, [timeframe]);

  useFocusEffect(
    useCallback(() => {
      // This runs every time the tab/screen is focused
      
      fetchCurrentAndPreviousMetrics();
      loadSpendBuckets();
      getUniqueVisitsByWeekday();
    }, [timeframe])
  );

  useEffect(() => {
    hasHourlyTabChild1Animated.current = true;
  }, []);

  // 7) Compare “current” vs “previous” to decide arrow directions
  const totalUp = (currentTotalSpend ?? 0) > (previousTotalSpend ?? 0);
  const avgSpendUp = (currentAvgSpend ?? 0) > (previousAvgSpend ?? 0);
  const venuesUp = (currentVenuesVisited ?? 0) > (previousVenuesVisited ?? 0);
  const avgItemsUp = (currentAvgItems ?? 0) > (previousAvgItems ?? 0);

  return (

    <VStack space="md" className="px-4 pb-5 bg-background-0">
      <AnimatedVStack space="md">
        <Animated.View
          entering={
            hasHourlyTabChild1Animated.current
              ? undefined
              : FadeInDown.delay(0 * 100).springify().damping(12)
          }
        >
          <HStack space="md">
            {/* Total Spend Card */}
            {currentTotalSpend === null ? (
              <ShimmerCard />
            ) : (
              <HourlyCard
                icon={DollarSign}
                text="Total Spend"
                currentUpdate={
                  currentTotalSpend !== null
                    ? `$${currentTotalSpend.toFixed(2)}`
                    : "--"
                }
                lastUpdate={formatTimeframeLabel(timeframe)}
                arrowDownIcon={!totalUp}
                arrowUpIcon={totalUp}
              />
            )}

            {/* Avg Spend Card */}
            {currentAvgSpend === null ? (
              <ShimmerCard />
            ) : (
              <HourlyCard
                icon={DollarSign}
                text="Avg Spend"
                currentUpdate={
                  currentAvgSpend !== null
                    ? `$${currentAvgSpend.toFixed(2)}`
                    : "--"
                }
                lastUpdate={formatTimeframeLabel(timeframe)}
                arrowDownIcon={!avgSpendUp}
                arrowUpIcon={avgSpendUp}
              />
            )}
          </HStack>
        </Animated.View>

        <Animated.View
          entering={
            hasHourlyTabChild1Animated.current
              ? undefined
              : FadeInDown.delay(1 * 100).springify().damping(12)
          }
        >
          <HStack space="md">
            {/* Venues Visited Card */}
            {currentVenuesVisited === null ? (
              <ShimmerCard />
            ) : (
              <HourlyCard
                icon={StoreIcon}
                text="Venues Visited"
                currentUpdate={
                  currentVenuesVisited !== null
                    ? `${currentVenuesVisited}`
                    : "--"
                }
                lastUpdate={formatTimeframeLabel(timeframe)}
                arrowDownIcon={!venuesUp}
                arrowUpIcon={venuesUp}
              />
            )}

            {/* Avg Items/Visit Card */}
            {currentAvgItems === null ? (
              <ShimmerCard />
            ) : (
              <HourlyCard
                icon={PackageIcon}
                text="Avg Items/Visit"
                currentUpdate={
                  currentAvgItems !== null
                    ? `${currentAvgItems.toFixed(1)}`
                    : "--"
                }
                lastUpdate={formatTimeframeLabel(timeframe)}
                arrowDownIcon={!avgItemsUp}
                arrowUpIcon={avgItemsUp}
              />
            )}
          </HStack>
        </Animated.View>
      </AnimatedVStack>

      {/* Spend Card */}
      <VStack className="py-3 rounded-2xl bg-background-100 gap-3 p-3">
        {spendLoading ? (
          <Text className="text-typography-400 text-center my-4">
            Loading chart…
          </Text>
        ) : (
          <Chart
            chartRef={childRefs[0].ref}
            data={spendData}
            timeframe={timeframe}
          />
        )}
      </VStack>

      {/* Daily Visits Card */}
      <VStack className="py-3 rounded-2xl bg-background-100 gap-3 p-3">
        {spendLoading ? (
          <Text className="text-typography-400 text-center my-4">
            Loading chart…
          </Text>
        ) : (
          <VisitBarCard data={dailyVisits.map(d => ({ day: d.day, count: d.visitCount }))} />
        )}
      </VStack>

    </VStack>
  );
};

export default UserHome;

function formatTimeframeLabel(timeframe: Timeframe): string {
  switch (timeframe) {
    case "all":
      return "All Time";
    case "7days":
      return "Prev 7 Days";
    case "30days":
      return "Prev 30 Days";
  }
}