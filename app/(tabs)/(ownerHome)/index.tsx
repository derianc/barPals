// index.tsx

import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import HourlyCard from "@/components/screens/userHome/hourly-card";
import Chart from "@/components/screens/userHome/chart";
import { WeatherTabContext } from "@/contexts/user-home-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { DollarSign, StoreIcon, PackageIcon } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import VisitBarCard from "@/components/screens/userHome/daily-visit-card";
import ShimmerCard from "@/components/screens/userHome/shimmer-card/shimmer-card";
import { getSelectedVenueHash } from "@/services/sbVenueService";
import {
  getSpendBuckets,
  getUniqueVisitsByWeekday,
  SpendBucket,
} from "@/services/sbReceiptService";
import {
  getCurrentAndPreviousTotalVenueSpend,
  getAverageSpendPerCustomer,
  getUniqueVisitorsToVenue,
  getAverageItemsPerCustomer,
  getVenueSpendTrend,
  getVenueVisitsByDay,
} from "@/services/sbOwnerReceiptService";

type Timeframe = "7days" | "30days" | "all";

const OwnerHome = () => {
  const { childRefs, hasHourlyTabChild1Animated }: any = useContext(WeatherTabContext);
  const AnimatedVStack = Animated.createAnimatedComponent(VStack);
  const { selectedTabIndex } = useContext(WeatherTabContext);
  const hasAnimatedRef = useRef(false);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const timeframe: Timeframe =
    selectedTabIndex === 0 ? "7days" :
    selectedTabIndex === 1 ? "30days" : "all";

  const [currentTotalSpend, setCurrentTotalSpend] = useState<number | null>(null);
  const [currentAvgSpend, setCurrentAvgSpend] = useState<number | null>(null);
  const [currentVenuesVisited, setCurrentVenuesVisited] = useState<number | null>(null);
  const [currentAvgItems, setCurrentAvgItems] = useState<number | null>(null);

  const [totalSpendChange, setTotalSpendChange] = useState<number | null>(null);
  const [avgSpendChange, setAvgSpendChange] = useState<number | null>(null);
  const [visitorsChange, setVisitorsChange] = useState<number | null>(null);
  const [itemsPerVisitChange, setItemsPerVisitChange] = useState<number | null>(null);

  const [previousTotalSpend, setPreviousTotalSpend] = useState<number | null>(null);
  const [previousAvgSpend, setPreviousAvgSpend] = useState<number | null>(null);
  const [previousVenuesVisited, setPreviousVenuesVisited] = useState<number | null>(null);
  const [previousAvgItems, setPreviousAvgItems] = useState<number | null>(null);

  const [spendData, setSpendData] = useState<SpendBucket[]>([]);
  const [spendLoading, setSpendLoading] = useState<boolean>(true);
  const [dailyVisits, setDailyVisits] = useState<{ day: string; visitCount: number }[]>([]);
  const [venueHash, setVenueHash] = useState<string | null>(null);

  useEffect(() => {
    getSelectedVenueHash().then(setVenueHash);
  }, []);

  useEffect(() => {
    if (venueHash) {
      fetchCurrentAndPreviousMetrics();
    }
  }, [timeframe, venueHash]);

  async function fetchCurrentAndPreviousMetrics() {
    if (!venueHash) return;

    setMetricsLoading(true);

    const now = new Date();
    let startCurrent: Date | null = null;
    let endCurrent: Date | null = null;

    if (timeframe === "7days") {
      endCurrent = now;
      startCurrent = new Date(endCurrent);
      startCurrent.setHours(0, 0, 0, 0);
      startCurrent.setDate(startCurrent.getDate() - 6);
    } else if (timeframe === "30days") {
      endCurrent = now;
      startCurrent = new Date(endCurrent);
      startCurrent.setHours(0, 0, 0, 0);
      startCurrent.setDate(startCurrent.getDate() - 29);
    }

    try {
      const [
        totalSpend,
        avgSpend,
        totalCust,
        avgItems,
        trend,
        visitsByDay
      ] = await Promise.all([
        getCurrentAndPreviousTotalVenueSpend(startCurrent, endCurrent, venueHash),
        getAverageSpendPerCustomer(startCurrent, endCurrent, venueHash),
        getUniqueVisitorsToVenue(startCurrent, endCurrent, venueHash),
        getAverageItemsPerCustomer(startCurrent, endCurrent, venueHash),
        getVenueSpendTrend(startCurrent, endCurrent, venueHash),
        getVenueVisitsByDay(startCurrent, endCurrent, venueHash)
      ]);

      setCurrentTotalSpend(totalSpend.current);
      setPreviousTotalSpend(totalSpend.previous);
      setTotalSpendChange(totalSpend.percentChange);

      setCurrentAvgSpend(avgSpend.current);
      setPreviousAvgSpend(avgSpend.previous);
      setAvgSpendChange(avgSpend.percentChange);

      setCurrentVenuesVisited(totalCust.current);
      setPreviousVenuesVisited(totalCust.previous);
      setVisitorsChange(totalCust.percentChange);

      setCurrentAvgItems(avgItems.current);
      setPreviousAvgItems(avgItems.previous);
      setItemsPerVisitChange(avgItems.percentChange);

      setSpendData(trend.data);

      setDailyVisits(visitsByDay.data);

    } catch (error) {
      console.error("❌ Error fetching metrics:", error);
    } finally {
      setMetricsLoading(false);
    }
  }

  useEffect(() => {
    if (venueHash) loadSpendBuckets();
  }, [timeframe, venueHash]);

  const loadSpendBuckets = async () => {
    setSpendLoading(true);
    const { data, error } = await getSpendBuckets(timeframe);
    if (error) {
      console.error(error);
      setSpendData([]);
    } else {
      setSpendData(data.reverse());
    }
    setSpendLoading(false);
  };

  useEffect(() => {
    getUniqueVisitsByWeekday(timeframe).then(setDailyVisits).catch(console.error);
  }, [timeframe]);

  useFocusEffect(useCallback(() => {
    if (!venueHash) return;
    fetchCurrentAndPreviousMetrics();
    loadSpendBuckets();
    getUniqueVisitsByWeekday(timeframe);
  }, [timeframe, venueHash]));

  useEffect(() => {
    hasHourlyTabChild1Animated.current = true;
  }, []);

  useEffect(() => {
    hasAnimatedRef.current = true;
  }, []);

  return (
    <VStack space="md" className="px-4 pb-5 bg-background-0">
      <AnimatedVStack space="md">
        {/* First Row: Total Spend & Avg Spend */}
        <Animated.View
          entering={ !hasAnimatedRef.current ? FadeInDown.delay(0).springify().damping(12) : undefined }>
          <HStack space="md">
            {metricsLoading ? (
              <>
                <ShimmerCard />
                <ShimmerCard />
              </>
            ) : (
              <>
                <HourlyCard icon={DollarSign} text="Total Spend" currentUpdate={`$${currentTotalSpend?.toFixed(2) ?? "--"}`} lastUpdate={formatTimeframeLabel(timeframe)} arrowUpIcon={(totalSpendChange ?? 0) > 0} arrowDownIcon={(totalSpendChange ?? 0) < 0} />
                <HourlyCard icon={DollarSign} text="Avg Spend" currentUpdate={`$${currentAvgSpend?.toFixed(2) ?? "--"}`} lastUpdate={formatTimeframeLabel(timeframe)} arrowUpIcon={(avgSpendChange ?? 0) > 0} arrowDownIcon={(avgSpendChange ?? 0) < 0} />
              </>
            )}
          </HStack>
        </Animated.View>

        {/* Second Row: Total Cust & Items/Cust */}
        <Animated.View
          entering={
            !hasAnimatedRef.current
              ? FadeInDown.delay(100).springify().damping(12)
              : undefined
          }
        >
          <HStack space="md">
            {metricsLoading ? (
              <>
                <ShimmerCard />
                <ShimmerCard />
              </>
            ) : (
              <>
                <HourlyCard icon={StoreIcon} text="Total Cust" currentUpdate={`${currentVenuesVisited ?? "--"}`} lastUpdate={formatTimeframeLabel(timeframe)} arrowUpIcon={(visitorsChange ?? 0) > 0} arrowDownIcon={(visitorsChange ?? 0) < 0} />
                <HourlyCard icon={PackageIcon} text="Items/Cust" currentUpdate={`${currentAvgItems?.toFixed(1) ?? "--"}`} lastUpdate={formatTimeframeLabel(timeframe)} arrowUpIcon={(itemsPerVisitChange ?? 0) > 0} arrowDownIcon={(itemsPerVisitChange ?? 0) < 0} />
              </>
            )}
          </HStack>
        </Animated.View>
      </AnimatedVStack>

      {/* Spend Chart */}
      <VStack className="py-3 rounded-2xl bg-background-100 gap-3 p-3">
        {spendLoading ? (
          <Text className="text-typography-400 text-center my-4">Loading chart…</Text>
        ) : spendData.length === 0 ? (
          <Text className="text-typography-400 text-center my-4">No data available</Text>
        ) : (
          <Chart
            chartRef={childRefs[0].ref}
            data={spendData}
            timeframe={timeframe}
          />
        )}
      </VStack>

      {/* Daily Visits */}
      <VStack className="py-3 rounded-2xl bg-background-100 gap-3 p-3">
        <VisitBarCard
          data={dailyVisits.map((d) => ({ day: d.day, count: d.visitCount }))}
        />
      </VStack>
    </VStack>
  );

};

export default OwnerHome;

function formatTimeframeLabel(timeframe: Timeframe): string {
  switch (timeframe) {
    case "all": return "All Time";
    case "7days": return "Prev 7 Days";
    case "30days": return "Prev 30 Days";
  }
}
