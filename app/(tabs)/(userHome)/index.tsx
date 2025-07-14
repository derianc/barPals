// components/screens/userHome/index.tsx

import React, { useContext, useState, useCallback, useEffect } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import HourlyCard from "@/components/screens/userHome/hourly-card";
import Chart from "@/components/screens/userHome/chart";
import { WeatherTabContext } from "@/contexts/user-home-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { DollarSign, StoreIcon, PackageIcon } from "lucide-react-native";
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

  const { user } = useUser();
  const userId = user?.id;

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!spendLoading) {
      setChartKey((prev) => prev + 1);
    }
  }, [spendLoading]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      InteractionManager.runAfterInteractions(() => {
        if (!userId || !isActive) return;

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

        getUserHomeMetrics(userId, start, end)
          .then((metrics) => {
            if (!metrics || !isActive) return;

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
            if (isActive) {
              console.error("❌ Error fetching edge metrics:", error);
              setSpendData([]);
              setDailyVisits([]);
            }
          })
          .finally(() => {
            if (isActive) setSpendLoading(false);
          });
      });

      return () => {
        isActive = false;
      };
    }, [timeframe, userId])
  );

  // flag animated tab state
  React.useEffect(() => {
    hasHourlyTabChild1Animated.current = true;
  }, []);

  const totalUp = (totalSpendChange ?? 0) > 0;
  const avgSpendUp = (avgSpendChange ?? 0) > 0;
  const venuesUp = (venuesVisitedChange ?? 0) > 0;
  const avgItemsUp = (avgItemsChange ?? 0) > 0;

  return (
    <VStack space="md" className="px-4 pb-5 bg-background-0">
      <AnimatedVStack space="md">
        <HStack space="md">
          <View style={{ flex: 1 }}>
            <Animated.View style={{ flex: 1 }} exiting={FadeOut} entering={FadeIn}>
              {currentTotalSpend === null ? (
                <ShimmerCard />
              ) : (
                <HourlyCard
                  icon={DollarSign}
                  text="Total Spend"
                  currentUpdate={`$${currentTotalSpend.toFixed(2)}`}
                  lastUpdate={formatTimeframeLabel(timeframe)}
                  arrowDownIcon={!totalUp}
                  arrowUpIcon={totalUp}
                />
              )}
            </Animated.View>
          </View>

          <View style={{ flex: 1 }}>
            <Animated.View style={{ flex: 1 }} exiting={FadeOut} entering={FadeIn}>
              {currentAvgSpend === null ? (
                <ShimmerCard />
              ) : (
                <HourlyCard
                  icon={DollarSign}
                  text="Avg Spend"
                  currentUpdate={`$${currentAvgSpend.toFixed(2)}`}
                  lastUpdate={formatTimeframeLabel(timeframe)}
                  arrowDownIcon={!avgSpendUp}
                  arrowUpIcon={avgSpendUp}
                />
              )}
            </Animated.View>
          </View>
        </HStack>

        <HStack space="md">
          <View style={{ flex: 1 }}>
            <Animated.View style={{ flex: 1 }} exiting={FadeOut} entering={FadeIn}>
              {currentVenuesVisited === null ? (
                <ShimmerCard />
              ) : (
                <HourlyCard
                  icon={StoreIcon}
                  text="Venues Visited"
                  currentUpdate={`${currentVenuesVisited}`}
                  lastUpdate={formatTimeframeLabel(timeframe)}
                  arrowDownIcon={!venuesUp}
                  arrowUpIcon={venuesUp}
                />
              )}
            </Animated.View>
          </View>

          <View style={{ flex: 1 }}>
            <Animated.View style={{ flex: 1 }} exiting={FadeOut} entering={FadeIn}>
              {currentAvgItems === null ? (
                <ShimmerCard />
              ) : (
                <HourlyCard
                  icon={PackageIcon}
                  text="Avg Items/Visit"
                  currentUpdate={`${currentAvgItems.toFixed(1)}`}
                  lastUpdate={formatTimeframeLabel(timeframe)}
                  arrowDownIcon={!avgItemsUp}
                  arrowUpIcon={avgItemsUp}
                />
              )}
            </Animated.View>
          </View>
        </HStack>
      </AnimatedVStack>

      <VStack className="py-3 rounded-2xl bg-background-100 gap-3 p-3">
        {spendLoading ? (
          <Text className="text-typography-400 text-center my-4">Loading chart…</Text>
        ) : (
          <View style={{ minHeight: 200 }}>
              <Chart key={chartKey} chartRef={childRefs?.[0].ref} data={spendData} timeframe={timeframe} />
          </View>
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
