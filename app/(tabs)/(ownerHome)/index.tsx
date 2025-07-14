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
import ShimmerCard from "@/components/screens/shimmer-card/shimmer-card";
import { useUser } from "@/contexts/userContext";
import { useVenue } from "@/contexts/venueContex";

import { SpendBucket } from "@/types/SpendBucket";
import { getOwnerHomeMetrics } from "@/services/sbEdgeFunctions";

type Timeframe = "7days" | "30days" | "all";

function getDateRange(timeframe: Timeframe): { start: Date | null; end: Date | null } {
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = now;

  if (timeframe === "7days") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
  } else if (timeframe === "30days") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 29);
  }

  return { start, end };
}

const OwnerHome = () => {
  const { childRefs, hasHourlyTabChild1Animated }: any = useContext(WeatherTabContext);
  const AnimatedVStack = Animated.createAnimatedComponent(VStack);
  const { selectedTabIndex } = useContext(WeatherTabContext);
  const hasAnimatedRef = useRef(false);

  const timeframe: Timeframe =
    selectedTabIndex === 0 ? "7days" :
      selectedTabIndex === 1 ? "30days" : "all";

  const [metricsLoading, setMetricsLoading] = useState(true);
  const [spendLoading, setSpendLoading] = useState(true);

  const [currentTotalSpend, setCurrentTotalSpend] = useState<number | null>(null);
  const [currentAvgSpend, setCurrentAvgSpend] = useState<number | null>(null);
  const [currentVisitors, setCurrentVisitors] = useState<number | null>(null);
  const [currentAvgItems, setCurrentAvgItems] = useState<number | null>(null);

  const [totalSpendChange, setTotalSpendChange] = useState<number | null>(null);
  const [avgSpendChange, setAvgSpendChange] = useState<number | null>(null);
  const [visitorsChange, setVisitorsChange] = useState<number | null>(null);
  const [itemsChange, setItemsChange] = useState<number | null>(null);

  const [spendData, setSpendData] = useState<SpendBucket[]>([]);
  const [dailyVisits, setDailyVisits] = useState<{ day: string; visitCount: number }[]>([]);
  const { user } = useUser();
  const { selectedVenue } = useVenue();

  useEffect(() => {
    if (selectedVenue?.venue_hash) {
      loadOwnerHomeData(selectedVenue.venue_hash);
    }
  }, [timeframe, selectedVenue?.venue_hash]);

  useFocusEffect(
    useCallback(() => {
      if (selectedVenue?.venue_hash) {
        loadOwnerHomeData(selectedVenue.venue_hash);
      }
    }, [timeframe, selectedVenue?.venue_hash])
  );

  async function loadOwnerHomeData(venueHash: string) {
    if (!venueHash) return;

    const { start, end } = getDateRange(timeframe);

    setMetricsLoading(true);
    setSpendLoading(true);

    try {
      const metrics = await getOwnerHomeMetrics(venueHash, start, end);

      setCurrentTotalSpend(metrics.totalSpend.current);
      setTotalSpendChange(metrics.totalSpend.percentChange);

      setCurrentAvgSpend(metrics.avgSpend.current);
      setAvgSpendChange(metrics.avgSpend.percentChange);

      setCurrentVisitors(metrics.totalVisitors.current);
      setVisitorsChange(metrics.totalVisitors.percentChange);

      setCurrentAvgItems(metrics.avgItems.current);
      setItemsChange(metrics.avgItems.percentChange);

      const paddedSpendData = [
        { day: "padding-start", total: 0 },
        ...metrics.spendTrend.reverse(),
        { day: "padding-end", total: 0 },
      ];
      setSpendData(paddedSpendData);

      setDailyVisits(metrics.visitsByDay);
    } catch (error) {
      console.error("❌ Error fetching owner metrics:", error);
      setSpendData([]);
      setDailyVisits([]);
    } finally {
      setMetricsLoading(false);
      setSpendLoading(false);
    }
  }


  useEffect(() => {
    hasHourlyTabChild1Animated.current = true;
  }, []);

  useEffect(() => {
    hasAnimatedRef.current = true;
  }, []);

  return (
    <VStack space="md" className="px-4 pb-5 bg-background-0">
      <AnimatedVStack space="md">
        <HStack space="md">
          <Animated.View
            style={{ flex: 1 }}
            entering={!hasAnimatedRef.current ? FadeInDown.delay(0).springify().damping(12) : undefined}
          >
            {metricsLoading ? (
              <ShimmerCard />
            ) : (
              <HourlyCard
                icon={DollarSign}
                text="Total Spend"
                currentUpdate={`$${currentTotalSpend?.toFixed(2) ?? "--"}`}
                lastUpdate={formatTimeframeLabel(timeframe)}
                arrowUpIcon={(totalSpendChange ?? 0) > 0}
                arrowDownIcon={(totalSpendChange ?? 0) < 0}
              />
            )}
          </Animated.View>

          <Animated.View
            style={{ flex: 1 }}
            entering={!hasAnimatedRef.current ? FadeInDown.delay(100).springify().damping(12) : undefined}
          >
            {metricsLoading ? (
              <ShimmerCard />
            ) : (
              <HourlyCard
                icon={DollarSign}
                text="Avg Spend"
                currentUpdate={`$${currentAvgSpend?.toFixed(2) ?? "--"}`}
                lastUpdate={formatTimeframeLabel(timeframe)}
                arrowUpIcon={(avgSpendChange ?? 0) > 0}
                arrowDownIcon={(avgSpendChange ?? 0) < 0}
              />
            )}
          </Animated.View>
        </HStack>

        <HStack space="md">
          <Animated.View
            style={{ flex: 1 }}
            entering={!hasAnimatedRef.current ? FadeInDown.delay(200).springify().damping(12) : undefined}
          >
            {metricsLoading ? (
              <ShimmerCard />
            ) : (
              <HourlyCard
                icon={StoreIcon}
                text="Visitors"
                currentUpdate={`${currentVisitors ?? "--"}`}
                lastUpdate={formatTimeframeLabel(timeframe)}
                arrowUpIcon={(visitorsChange ?? 0) > 0}
                arrowDownIcon={(visitorsChange ?? 0) < 0}
              />
            )}
          </Animated.View>

          <Animated.View
            style={{ flex: 1 }}
            entering={!hasAnimatedRef.current ? FadeInDown.delay(300).springify().damping(12) : undefined}
          >
            {metricsLoading ? (
              <ShimmerCard />
            ) : (
              <HourlyCard
                icon={PackageIcon}
                text="Items/Cust"
                currentUpdate={`${currentAvgItems?.toFixed(1) ?? "--"}`}
                lastUpdate={formatTimeframeLabel(timeframe)}
                arrowUpIcon={(itemsChange ?? 0) > 0}
                arrowDownIcon={(itemsChange ?? 0) < 0}
              />
            )}
          </Animated.View>
        </HStack>
      </AnimatedVStack>

      <VStack className="py-3 rounded-2xl bg-background-100 gap-3 p-3">
        {spendLoading ? (
          <Text className="text-typography-400 text-center my-4">Loading chart…</Text>
        ) : spendData.length === 0 ? (
          <Text className="text-typography-400 text-center my-4">No data available</Text>
        ) : (
          <Chart chartRef={childRefs?.[0]?.ref} data={spendData} timeframe={timeframe} />
        )}
      </VStack>

      <VStack className="py-3 rounded-2xl bg-background-100 gap-3 p-3">
        {spendLoading || !dailyVisits.length ? (
          <Text className="text-typography-400 text-center my-4">Loading chart…</Text>
        ) : (
          <VisitBarCard data={dailyVisits.map(d => ({ day: d.day, count: d.visitCount }))} />
        )}
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
