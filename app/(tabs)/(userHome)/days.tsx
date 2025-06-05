import React, { useContext, useEffect } from "react";
import { VStack } from "@/components/ui/vstack";
import DaysCard from "@/components/screens/userHome/days-card";
import Animated, { FadeInDown } from "react-native-reanimated";
import { DailyForecastData } from "@/data/screens/weather/days-tab";
import { WeatherTabContext } from "@/contexts/weather-screen-context";

const Days = () => {
  const { hasDaysTabAnimated }: any = useContext(WeatherTabContext);
  const AnimatedVStack = Animated.createAnimatedComponent(VStack);

  useEffect(() => {
    hasDaysTabAnimated.current = true;
  }, []);

  return (
    <AnimatedVStack space="md" className="px-5 pb-5">
      {DailyForecastData.map((day: any, index: number) => {
        return (
          <Animated.View
            key={day.id}
            entering={
              hasDaysTabAnimated.current
                ? undefined
                : FadeInDown.delay(index * 100)
                    .springify()
                    .damping(12)
            }
          >
            <DaysCard
              name={day.name}
              weather={day.weather}
              highest={day.highest}
              lowest={day.lowest}
              imgUrl={day.imgUrl}
            />
          </Animated.View>
        );
      })}
    </AnimatedVStack>
  );
};

export default Days;
