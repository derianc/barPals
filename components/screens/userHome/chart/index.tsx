// components/screens/userHome/chart/index.tsx

import React, { useContext } from "react";
import { ScrollView, View } from "react-native";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon, CalendarDaysIcon } from "@/components/ui/icon";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { LineChart } from "react-native-gifted-charts";
import { ThemeContext } from "@/contexts/theme-context";
import { WeatherTabContext } from "@/contexts/user-home-context";

// Re‐import SpendBucket
import { SpendBucket } from "@/types/SpendBucket";

interface ChartProps {
  chartRef: React.Ref<any>;
  data?: SpendBucket[];
  timeframe: "day" | "7days" | "30days" | "all";
  title?: string;
}

const Chart = ({ chartRef, data, timeframe, title }: ChartProps) => {
  const { colorMode }: any = useContext(ThemeContext);
  const { childRefs }: any = useContext(WeatherTabContext);

  //
  // 1) Build lineData: if data is nonempty, map SpendBucket[] → 
  //    { value: total, label: either "MM-DD" or "hh:mm AM/PM" }.
  //
  //    Otherwise, fall back to a dummy 7-day array.
  //
  const lineData =
  data && data.length > 0
    ? (() => {
        const paddedStart = { value: 0, label: "", dataPointColor: "transparent" };
        const paddedEnd = { value: 0, label: "", dataPointColor: "transparent" };

        const points = data.map((bucket) => ({
          value: typeof bucket.total === "number" ? bucket.total : 0,
          label: bucket.label,
          dataPointColor: bucket.total === 0 ? "#ccc" : "#b68cd4",
        }));

        return [paddedStart, ...points, paddedEnd];
      })()
    : [
        {}, // fallback if no data
        { value: 18, label: "06-01" },
        { value: 23, label: "06-02" },
        { value: 15, label: "06-03" },
        { value: 18, label: "06-04" },
        { value: 10, label: "06-05" },
        { value: 25, label: "06-06" },
        { value: 19, label: "06-07" },
        {},
      ];

  //
  // 2) Count real points (excluding padding)
  //
  const realPointCount = data && data.length > 0 ? data.length : 7;

  //
  // 3) Decide spacing: 
  //    - For "day" (24 points), use a larger spacing (20)
  //    - For 7 or 30 days, keep the previous values
  //
  let baseSpacing: number;
  if (timeframe === "day") {
    baseSpacing = 20;     // was 10 → now 20px per hour
  } else if (realPointCount <= 7) {
    baseSpacing = 50;     // 7-day
  } else {
    // 30 days or "all"
    baseSpacing = 30;
  }

  //
  // 4) Determine whether to rotate X-axis labels (if > 8 points)
  //
  const shouldRotate = realPointCount > 8;

  //
  // 5) Determine a default title if none provided
  //
let defaultTitle = "Points Chart";
if (timeframe === "7days") {
  defaultTitle = "Weekly Points Tracker";
} else if (timeframe === "30days") {
  defaultTitle = "Monthly Points Tracker";
} else if (timeframe === "all") {
  defaultTitle = "Total Points Tracker";
}

  //
  // 6) Calculate chart width so that horizontal scroll is possible:
  //    (number of data points + 2 padding) * spacing
  //
  const chartWidth = (realPointCount + 2) * baseSpacing;

  return (
    <VStack className="p-3 rounded-2xl bg-background-100 gap-3">
      <HStack className="items-center gap-2">
        <Box className="h-7 w-7 bg-background-50 items-center justify-center rounded-full">
          <Icon
            as={CalendarDaysIcon}
            className="text-typography-400"
            size="sm"
          />
        </Box>
        <Text className="font-dm-sans-medium text-typography-400">
          {title ?? defaultTitle}
        </Text>
      </HStack>

      <VStack className="overflow-hidden" ref={chartRef}>
        {childRefs[0].isVisible && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={{ width: chartWidth }}
          >
            <View style={{ width: chartWidth }}>
              <LineChart
                curved
                isAnimated
                areaChart
                data={lineData}
                initialSpacing={0}
                hideDataPoints={false}
                rulesColor={colorMode === "dark" ? "#414141" : "#d3d3d3"}
                rulesType="solid"
                color="#b68cd4"
                startFillColor="#b68cd4"
                endFillColor={colorMode === "dark" ? "#30203c" : "#f1ebff"}
                startOpacity={1}
                endOpacity={0}
                xAxisLabelTextStyle={{
                  color: colorMode === "dark" ? "#F5F5F5" : "#262627",
                  textAlign: "right",
                  // For hourly labels, bump font size a bit:
                  fontSize: timeframe === "day" ? (shouldRotate ? 10 : 12) : shouldRotate ? 10 : 12,
                  transform: shouldRotate ? [{ rotate: "-45deg" }] : [],
                }}
                xAxisColor={colorMode === "dark" ? "#414141" : "#d3d3d3"}
                yAxisThickness={0}
                yAxisTextStyle={{
                  color: colorMode === "dark" ? "#F5F5F5" : "#262627",
                  fontSize: 12,
                }}
                noOfSections={4}
                stepHeight={30}
                spacing={baseSpacing}
                yAxisOffset={0} // ✅ ensures Y-axis starts at zero
                adjustToWidth // ✅ stretches to fill space (optional but smooth)
                hideRules={false} // ✅ ensure grid shows
                pointerConfig={{
                  hidePointerForMissingValues: true,
                  pointerStripHeight: 86,
                  pointerStripColor:
                    colorMode === "dark" ? "lightgray" : "#5b416d",
                  pointerStripWidth: 1,
                  pointerColor:
                    colorMode === "dark" ? "lightgray" : "#5b416d",
                  radius: 5,
                  pointerLabelComponent: (items: any) => {
                    return (
                      <VStack className="h-[80px] w-[80px] justify-center items-center -ml-1.5">
                        <VStack className="px-2 rounded-full bg-background-0">
                          <Text size="sm" className="text-typography-900">
                            ${items[0].value.toFixed(2)}
                          </Text>
                        </VStack>
                      </VStack>
                    );
                  },
                }}
              />
            </View>
          </ScrollView>
        )}
      </VStack>
    </VStack>
  );
};

export default Chart;
