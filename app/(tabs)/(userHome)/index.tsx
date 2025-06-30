// components/screens/userHome/index.tsx

import React, { useCallback, useContext, useEffect, useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import HourlyCard from "@/components/screens/userHome/hourly-card";
import Chart from "@/components/screens/userHome/chart";
import { WeatherTabContext } from "@/contexts/user-home-context";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { supabase } from "@/supabase";
import {
  getAverageItemsPerVisit,
  getAverageUserSpend,
  getTotalUserSpend,
  getUniqueMerchantsVisited,
  SpendBucket,
  getUserSpendTrend,
  getUserVisitsByDay,
} from "@/services/sbCoreReceiptService";
import { DollarSign, StoreIcon, PackageIcon, Box, CloudRain } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import VisitBarCard from "@/components/screens/userHome/daily-visit-card";
import ShimmerCard from "@/components/screens/shimmer-card/shimmer-card";
import { View } from "react-native";
import { useUser } from "@/contexts/userContext";

type Timeframe = "7days" | "30days" | "all";

function getDateRange(timeframe: Timeframe): { start: Date | null; end: Date | null } {
  const now = new Date();
  let startCurrent: Date | null = null;
  let endCurrent: Date | null = now;

  if (timeframe === "7days") {
    startCurrent = new Date(now);
    startCurrent.setHours(0, 0, 0, 0);
    startCurrent.setDate(startCurrent.getDate() - 6);
  } else if (timeframe === "30days") {
    startCurrent = new Date(now);
    startCurrent.setHours(0, 0, 0, 0);
    startCurrent.setDate(startCurrent.getDate() - 29);
  }

  return { start: startCurrent, end: endCurrent };
}


const UserHome = () => {
  const { childRefs, hasHourlyTabChild1Animated }: any = useContext(WeatherTabContext);
  const AnimatedVStack = Animated.createAnimatedComponent(VStack);

  const { selectedTabIndex } = useContext(WeatherTabContext);


  // 1) Define your timeframe here. Change as needed:
  // const timeframe: Timeframe = "day"; // Options: "day", "7days", "30days", "all"
  const timeframe: Timeframe =
    selectedTabIndex === 0 ? "7days" :
      selectedTabIndex === 1 ? "30days" : "all";


  // 2) State for “current” metrics
  const [currentTotalSpend, setCurrentTotalSpend] = useState<number | null>(null);
  const [currentAvgSpend, setCurrentAvgSpend] = useState<number | null>(null);
  const [currentVenuesVisited, setCurrentVenuesVisited] = useState<number | null>(null);
  const [currentAvgItems, setCurrentAvgItems] = useState<number | null>(null);

  // 3) State for “previous” metrics (for arrow comparisons)
  const [totalSpendChange, setTotalSpendChange] = useState<number | null>(null);
  const [avgSpendChange, setAvgSpendChange] = useState<number | null>(null);
  const [venuesVisitedChange, setVenuesVisitedChange] = useState<number | null>(null);
  const [avgItemsChange, setAvgItemsChange] = useState<number | null>(null);

  // 4) State for chart buckets and loading flag
  const [spendData, setSpendData] = useState<SpendBucket[]>([]);
  const [spendLoading, setSpendLoading] = useState<boolean>(true);
  const [dailyVisits, setDailyVisits] = useState<{ day: string; visitCount: number }[]>([]);
  const { user } = useUser();
  const userId = user?.id;


  // load userHome Data
  useEffect(() => {
    if (userId) {
      loadUserHomeData();
    }
  }, [timeframe, userId]);

  async function loadUserHomeData() {
    if (!userId) return;

    const { start: startCurrent, end: endCurrent } = getDateRange(timeframe);

    // Reset shimmer indicators
    setCurrentTotalSpend(null);
    setCurrentAvgSpend(null);
    setCurrentVenuesVisited(null);
    setCurrentAvgItems(null);
    setTotalSpendChange(null);
    setAvgSpendChange(null);
    setVenuesVisitedChange(null);
    setAvgItemsChange(null);
    setSpendLoading(true);

    try {
      const [
        totalSpend,
        avgSpend,
        totalVenuesVisited,
        avgItemsPerVisit,
        spendTrendResult,
        visitsResult
      ] = await Promise.all([
        getTotalUserSpend(startCurrent, endCurrent, userId),
        getAverageUserSpend(startCurrent, endCurrent, userId),
        getUniqueMerchantsVisited(startCurrent, endCurrent, userId),
        getAverageItemsPerVisit(startCurrent, endCurrent, userId),
        getUserSpendTrend(startCurrent, endCurrent, userId),
        getUserVisitsByDay(startCurrent, endCurrent, userId)
      ]);

      // Metrics
      setCurrentTotalSpend(totalSpend.current);
      setCurrentAvgSpend(avgSpend.current);
      setCurrentVenuesVisited(totalVenuesVisited.current);
      setCurrentAvgItems(avgItemsPerVisit.current);
      setTotalSpendChange(totalSpend.percentChange);
      setAvgSpendChange(avgSpend.percentChange);
      setVenuesVisitedChange(totalVenuesVisited.percentChange);
      setAvgItemsChange(avgItemsPerVisit.percentChange);

      // Trend and visits
      setSpendData(spendTrendResult.data.reverse());
      setDailyVisits(visitsResult.data);
    } catch (error) {
      console.error("❌ Error fetching metrics:", error);
      setSpendData([]);
      setDailyVisits([]);
    } finally {
      setSpendLoading(false);
    }
  }

  useEffect(() => {
    hasHourlyTabChild1Animated.current = true;
  }, []);

  // set change arrows
  const totalUp = (totalSpendChange ?? 0) > 0;
  const avgSpendUp = (avgSpendChange ?? 0) > 0;
  const venuesUp = (venuesVisitedChange ?? 0) > 0;
  const avgItemsUp = (avgItemsChange ?? 0) > 0;

  return (

    <VStack space="md" className="px-4 pb-5 bg-background-0">
      <AnimatedVStack space="md">

        <HStack space="md">
          {/* Total Spend Card */}
          <View style={{ flex: 1 }}>
            <Animated.View
              style={{ flex: 1 }}
              exiting={FadeOut.duration(300)}
              entering={FadeIn.duration(300)}
            >
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
            </Animated.View>
          </View>

          {/* Avg Spend Card */}
          <View style={{ flex: 1 }}>
            <Animated.View
              style={{ flex: 1 }}
              exiting={FadeOut.duration(300)}
              entering={FadeIn.duration(300)}
            >
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
            </Animated.View>
          </View>
        </HStack>


        <HStack space="md">
          {/* Venues Visited Card */}
          <View style={{ flex: 1 }}>
            <Animated.View
              style={{ flex: 1 }}
              exiting={FadeOut.duration(300)}
              entering={FadeIn.duration(300)}
            >
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
            </Animated.View>
          </View>

          {/* Avg Items/Visit Card */}
          <View style={{ flex: 1 }}>
            <Animated.View
              style={{ flex: 1 }}
              exiting={FadeOut.duration(300)}
              entering={FadeIn.duration(300)}
            >
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
            </Animated.View>
          </View>
        </HStack>
      </AnimatedVStack>

      {/* Spend Card */}
      <VStack className="py-3 rounded-2xl bg-background-100 gap-3 p-3">
        {spendLoading ? (
          <Text className="text-typography-400 text-center my-4">
            Loading chart…
          </Text>
        ) : (
          <Chart
            chartRef={childRefs?.[0].ref}
            data={spendData}
            timeframe={timeframe}
          />
        )}
      </VStack>

      {/* Daily Visits Card */}
      <VStack className="py-3 rounded-2xl bg-background-100 gap-3 p-3">
        {spendLoading || !dailyVisits.length ? (
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