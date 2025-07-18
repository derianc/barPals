// components/screens/userHome/index.tsx

import React, { useContext, useState, useCallback, useEffect, useRef } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import HourlyCard from "@/components/screens/userHome/hourly-card";
import Chart from "@/components/screens/userHome/chart";
import { WeatherTabContext } from "@/contexts/user-home-context";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { Zap, BadgeCheck, StoreIcon, PackageIcon } from "lucide-react-native";
import VisitBarCard from "@/components/screens/userHome/daily-visit-card";
import ShimmerCard from "@/components/screens/shimmer-card/shimmer-card";
import { View } from "react-native";
import { useUser } from "@/contexts/userContext";
import { getUserHomeMetrics } from "@/services/sbEdgeFunctions";
import { SpendBucket } from "@/types/SpendBucket";
import { useFocusEffect } from "@react-navigation/native";
import { InteractionManager } from "react-native"; // ⬅️ add this

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
  const timeframe: Timeframe =
    selectedTabIndex === 0 ? "7days" :
      selectedTabIndex === 1 ? "30days" : "all";

  const [currentTotalSpend, setCurrentTotalSpend] = useState<number | null>(null);
  const [currentAvgSpend, setCurrentAvgSpend] = useState<number | null>(null);
  const [currentVenuesVisited, setCurrentVenuesVisited] = useState<number | null>(null);
  const [currentAvgItems, setCurrentAvgItems] = useState<number | null>(null);

  const [totalSpendChange, setTotalSpendChange] = useState<number | null>(null);
  const [avgSpendChange, setAvgSpendChange] = useState<number | null>(null);
  const [venuesVisitedChange, setVenuesVisitedChange] = useState<number | null>(null);
  const [avgItemsChange, setAvgItemsChange] = useState<number | null>(null);

  const [spendData, setSpendData] = useState<SpendBucket[]>([]);
  const [spendLoading, setSpendLoading] = useState<boolean>(true);
  const [dailyVisits, setDailyVisits] = useState<{ day: string; visitCount: number }[]>([]);
  const [mounted, setMounted] = useState(false); // ⬅️ add this above state declarations
  const [chartKey, setChartKey] = useState(0);
  const hasAnimatedRef = useRef(false);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const { user } = useUser();
  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      loadUserHomeData(userId);
    }
  }, [timeframe, userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadUserHomeData(userId);
      }
    }, [timeframe, userId])
  );

  async function loadUserHomeData(userId: string) {

    setCurrentTotalSpend(null);
    setCurrentAvgSpend(null);
    setCurrentVenuesVisited(null);
    setCurrentAvgItems(null);
    setTotalSpendChange(null);
    setAvgSpendChange(null);
    setVenuesVisitedChange(null);
    setAvgItemsChange(null);
    setSpendLoading(true);

    const { start, end } = getDateRange(timeframe);

    setMetricsLoading(true);
    getUserHomeMetrics(userId, start, end)
      .then((metrics) => {
        setCurrentTotalSpend(metrics.totalSpend.current);
        setCurrentAvgSpend(metrics.avgSpend.current);
        setCurrentVenuesVisited(metrics.uniqueVenues.current);
        setCurrentAvgItems(metrics.avgItems.current);

        setTotalSpendChange(metrics.totalSpend.percentChange);
        setAvgSpendChange(metrics.avgSpend.percentChange);
        setVenuesVisitedChange(metrics.uniqueVenues.percentChange);
        setAvgItemsChange(metrics.avgItems.percentChange);

        // setSpendData([...metrics.spendTrend].reverse());
        const paddedSpendData = [
          { day: "padding-start", total: 0 },
          ...metrics.spendTrend.reverse(),
          { day: "padding-end", total: 0 },
        ];
        setSpendData(paddedSpendData);

        setDailyVisits(metrics.dailyVisits);
      })
      .catch((error) => {
        console.error("❌ Error fetching edge metrics:", error);
        setSpendData([]);
        setDailyVisits([]);
      })
      .finally(() => {
        setMetricsLoading(false);
        setSpendLoading(false);
      });
  }

  useEffect(() => {
    hasHourlyTabChild1Animated.current = true;
  }, []);

  useEffect(() => {
    hasAnimatedRef.current = true;
  }, []);

  // flag animated tab state
  React.useEffect(() => {
    hasHourlyTabChild1Animated.current = true;
  }, []);

  const totalUp = (totalSpendChange ?? 0) > 0;
  const avgSpendUp = (avgSpendChange ?? 0) > 0;
  const venuesUp = (venuesVisitedChange ?? 0) > 0;
  const avgItemsUp = (avgItemsChange ?? 0) > 0;

  function convertDollarsToPoints(amount: number | null): number {
    if (amount == null) return 0;
    const multiplier = 10; 
    return Math.round(amount * multiplier);
  }

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
                icon={BadgeCheck}
                text="Total Points"
                currentUpdate={`${convertDollarsToPoints(currentTotalSpend)?.toFixed(0) ?? "--"} pts`}
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
                icon={BadgeCheck}
                text="Avg Points / Visit"
                currentUpdate={`${convertDollarsToPoints(currentAvgSpend)?.toFixed(0) ?? "--"} pts`}
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
                text="Unique Venues"
                currentUpdate={`${currentVenuesVisited ?? "--"}`}
                lastUpdate={formatTimeframeLabel(timeframe)}
                arrowUpIcon={(venuesVisitedChange ?? 0) > 0}
                arrowDownIcon={(venuesVisitedChange ?? 0) < 0}
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
                text="Items/Visit"
                currentUpdate={`${currentAvgItems?.toFixed(1) ?? "--"}`}
                lastUpdate={formatTimeframeLabel(timeframe)}
                arrowUpIcon={(avgItemsChange ?? 0) > 0}
                arrowDownIcon={(avgItemsChange ?? 0) < 0}
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

export default UserHome;

function formatTimeframeLabel(timeframe: Timeframe): string {
  switch (timeframe) {
    case "all": return "All Time";
    case "7days": return "Prev 7 Days";
    case "30days": return "Prev 30 Days";
  }
}
