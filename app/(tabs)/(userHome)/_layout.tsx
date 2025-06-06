import React, { useContext, useState, useEffect, useRef } from "react";
import { Slot } from "expo-router";
import { ScrollView } from "@/components/ui/scroll-view";
import { View } from "@/components/ui/view";
import Header from "@/components/screens/userHome/header";
import Tabs from "@/components/screens/userHome/tabs";
import useChildVisibility from "@/hooks/useChildVisibility";
import {
  WeatherTabProvider,
  WeatherTabContext,
} from "@/contexts/user-home-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";

const WeatherLayout = () => {
  const { scrollViewRef, selectedTabIndex }: any =
    useContext(WeatherTabContext);
  const { handleScroll } = useChildVisibility();
  const scrollY = useSharedValue(0);
  const [height, setHeight] = useState(340);
  const animatedHeight = useSharedValue(340);
  const isHeaderShrunk = useSharedValue(false);

  useEffect(() => {
    if (scrollViewRef.current) {
      const targetY = isHeaderShrunk.value ? 200 : 0;

      scrollViewRef.current.scrollTo({
        y: targetY,
        animated: false,
      });

      scrollY.value = targetY;
      animatedHeight.value = isHeaderShrunk.value ? 140 : 340;
    }
  }, [selectedTabIndex]);

  const handleScrollWithPosition = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    scrollY.value = y;

    isHeaderShrunk.value = y >= 200;

    animatedHeight.value = interpolate(
      y,
      [0, 200],
      [340, 140],
      Extrapolation.CLAMP
    );

    if (selectedTabIndex === 0) {
      handleScroll(event);
    }
  };

  const updateHeight = (value: number) => {
    "worklet";
    runOnJS(setHeight)(value);
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    updateHeight(animatedHeight.value);
    return {
      height: animatedHeight.value,
    };
  });

  return (
    <View className="flex-1">
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <Animated.View style={[headerAnimatedStyle]}>
          <Header height={height} />
        </Animated.View>

        <Tabs />
      </View>

      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScrollWithPosition}
        scrollEventThrottle={16}
        className="bg-background-0"
        contentContainerClassName="pt-[419px]"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <Slot />
        {/* consider it like a {children} */}
      </ScrollView>
    </View>
  );
};

export default function HomeLayout() {
  return (
    <WeatherTabProvider>
      <WeatherLayout />
    </WeatherTabProvider>
  );
}