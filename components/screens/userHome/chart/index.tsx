import React, { useContext } from "react";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon, CalendarDaysIcon } from "@/components/ui/icon";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { LineChart } from "react-native-gifted-charts";
import { ThemeContext } from "@/contexts/theme-context";
import { WeatherTabContext } from "@/contexts/weather-screen-context";

const Chart = ({ chartRef }: any) => {
  const { colorMode }: any = useContext(ThemeContext);
  const { childRefs }: any = useContext(WeatherTabContext);
  const lineData = [
    {},
    { value: 18, label: "Mon" },
    { value: 23, label: "Tue" },
    { value: 15, label: "Wed" },
    { value: 18, label: "Thu" },
    { value: 10, label: "Fri" },
    { value: 25, label: "Sat" },
    { value: 19, label: "Sun" },
    {},
  ];

  return (
    <VStack className="p-3 rounded-2xl bg-background-100 gap-3">
      <HStack className="items-center gap-2">
        <Box className="h-7 w-7 bg-background-50 items-center justify-center rounded-full">
          <Icon as={CalendarDaysIcon} className="text-typography-400" size="sm" />
        </Box>
        <Text className="font-dm-sans-medium text-typography-400">Day forecast</Text>
      </HStack>

      <VStack className="overflow-hidden" ref={chartRef}>
        {childRefs[0].isVisible && (
          <LineChart
            curved
            isAnimated
            areaChart
            data={lineData}
            initialSpacing={0}
            hideDataPoints
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
              fontSize: 12,
            }}
            xAxisColor={colorMode === "dark" ? "#414141" : "#d3d3d3"}
            yAxisThickness={0}
            yAxisLabelSuffix="°"
            yAxisTextStyle={{
              color: colorMode === "dark" ? "#F5F5F5" : "#262627",
              fontSize: 12,
            }}
            noOfSections={4}
            stepHeight={30}
            spacing={36}
            pointerConfig={{
              hidePointerForMissingValues: true,
              pointerStripHeight: 86,
              pointerStripColor: colorMode === "dark" ? "lightgray" : "#5b416d",
              pointerStripWidth: 1,
              pointerColor: colorMode === "dark" ? "lightgray" : "#5b416d",
              radius: 5,
              pointerLabelWidth: 100,
              pointerLabelHeight: 100,
              pointerLabelComponent: (items: any) => {
                return (
                  <VStack className="h-[100px] w-[100px] justify-center items-start -ml-1.5">
                    <VStack className="px-2 rounded-full bg-background-0">
                      <Text size="sm" className="text-typography-900">
                        {items[0].value}°
                      </Text>
                    </VStack>
                  </VStack>
                );
              },
            }}
          />
        )}
      </VStack>
    </VStack>
  );
};

export default Chart;
