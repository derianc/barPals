import React, { useContext, useEffect } from "react";
import { VStack } from "@/components/ui/vstack";
import { CloudRain } from "lucide-react-native";
import { ClockIcon, Icon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import HourlyCard from "@/components/screens/userHome/hourly-card";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import ForeCastCard from "@/components/screens/userHome/forecast-card";
import RainCard from "@/components/screens/userHome/rain-card";
import Chart from "@/components/screens/userHome/chart";
import { ScrollView } from "@/components/ui/scroll-view";
import { WeatherTabContext } from "@/contexts/weather-screen-context";
import {
  WindAndPrecipitationData,
  PressureAndUVIndexData,
  HourlyForecastData,
  RainPredictionData,
  SunriseAndSunsetData,
} from "@/data/screens/weather/hourly-tab";
import Animated, { FadeInDown } from "react-native-reanimated";

const Hourly = () => {
  const { childRefs, hasHourlyTabChild1Animated }: any =
    useContext(WeatherTabContext);
  const AnimatedVStack = Animated.createAnimatedComponent(VStack);

  useEffect(() => {
    hasHourlyTabChild1Animated.current = true;
  }, []);

  return (
    <VStack space="md" className="px-4 pb-5 bg-background-0">
      <AnimatedVStack space="md">
        <Animated.View
          entering={
            hasHourlyTabChild1Animated.current
              ? undefined
              : FadeInDown.delay(0 * 100)
                  .springify()
                  .damping(12)
          }
        >
          <HStack space="md">
            {WindAndPrecipitationData.map((card: any) => {
              return (
                <HourlyCard
                  key={card.id}
                  icon={card.icon}
                  text={card.text}
                  currentUpdate={card.currentUpdate}
                  lastUpdate={card.lastUpdate}
                  arrowDownIcon={card.arrowDownIcon}
                  arrowUpIcon={card.arrowUpIcon}
                />
              );
            })}
          </HStack>
        </Animated.View>

        <Animated.View
          entering={
            hasHourlyTabChild1Animated.current
              ? undefined
              : FadeInDown.delay(1 * 100)
                  .springify()
                  .damping(12)
          }
        >
          <HStack space="md">
            {PressureAndUVIndexData.map((card: any) => {
              return (
                <HourlyCard
                  key={card.id}
                  icon={card.icon}
                  text={card.text}
                  currentUpdate={card.currentUpdate}
                  lastUpdate={card.lastUpdate}
                  arrowDownIcon={card.arrowDownIcon}
                  arrowUpIcon={card.arrowUpIcon}
                />
              );
            })}
          </HStack>
        </Animated.View>
      </AnimatedVStack>

      {/* ---------------------------- Hourly forecast ---------------------------- */}
      <VStack className="py-3 rounded-2xl bg-background-100 gap-3 p-3">
        <HStack className="gap-2 items-center">
          <Box className="h-7 w-7 bg-background-50 items-center justify-center rounded-full">
            <Icon as={ClockIcon} className="text-typography-400" size="sm" />
          </Box>
          <Text className="font-dm-sans-regular text-typography-400">
            Hourly forecast
          </Text>
        </HStack>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className=""
          contentContainerClassName="gap-x-8 px-3"
        >
          {HourlyForecastData.map((card: any) => {
            return (
              <ForeCastCard
                key={card.id}
                time={card.time}
                imgUrl={card.imgUrl}
                temperature={card.temperature}
              />
            );
          })}
        </ScrollView>
      </VStack>

      {/* ---------------------------- Day forecast ----------------------------- */}

      <Chart chartRef={childRefs[0].ref} />

      {/* ---------------------------- Chance of rain ---------------------------- */}
      <VStack
        className="p-3 rounded-2xl bg-background-100 gap-3"
        ref={childRefs[1].ref}
      >
        <HStack className="items-center gap-2">
          <Box className="h-7 w-7 bg-background-50 items-center justify-center rounded-full">
            <Icon as={CloudRain} className="text-typography-400" size="sm" />
          </Box>
          <Text className="font-dm-sans-regular text-typography-400">
            Chance of rain
          </Text>
        </HStack>

        <VStack className="justify-between px-3 gap-2.5">
          {RainPredictionData.map((card: any) => {
            return (
              <RainCard key={card.id} time={card.time} value={card.value} />
            );
          })}
        </VStack>
      </VStack>

      <HStack space="md">
        {SunriseAndSunsetData.map((card: any) => {
          return (
            <HourlyCard
              key={card.id}
              icon={card.icon}
              text={card.text}
              currentUpdate={card.currentUpdate}
              lastUpdate={card.lastUpdate}
            />
          );
        })}
      </HStack>
    </VStack>
  );
};

export default Hourly;
