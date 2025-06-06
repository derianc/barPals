import React, { useContext, useEffect } from "react";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { WeatherTabContext } from "@/contexts/user-home-context";
import { BarChart2 } from "lucide-react-native";

interface DailyVisit {
  day: string;
  count: number;
}

interface DailyVisitCardProps {
  data: DailyVisit[];
}

const AnimatedProgressFilledTrack = Animated.createAnimatedComponent(ProgressFilledTrack);

const DailyVisitCard = ({ data }: DailyVisitCardProps) => {
  const { childRefs, hasProgressBarAnimated }: any = useContext(WeatherTabContext);
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <VStack className="p-3 rounded-2xl bg-background-100 gap-3" ref={childRefs[1].ref}>
      <HStack className="items-center gap-2">
        <Box className="h-7 w-7 bg-background-50 items-center justify-center rounded-full">
          <Icon as={BarChart2} className="text-typography-400" size="sm" />
        </Box>
        <Text className="font-dm-sans-regular text-typography-400">Visits By Day</Text>
      </HStack>

      <VStack className="gap-2.5 px-3">
        {data.map((item, idx) => (
          <VisitProgressBar
            key={idx}
            day={item.day}
            count={item.count}
            maxCount={maxCount}
            animated={hasProgressBarAnimated.current < 4 && childRefs[1].isVisible}
            incrementAnimation={() => hasProgressBarAnimated.current++}
          />
        ))}
      </VStack>
    </VStack>
  );
};

interface VisitProgressBarProps {
  day: string;
  count: number;
  maxCount: number;
  animated: boolean;
  incrementAnimation: () => void;
}

const VisitProgressBar = ({
  day,
  count,
  maxCount,
  animated,
  incrementAnimation,
}: VisitProgressBarProps) => {
  const percent = (count / maxCount) * 100;
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      progressAnim.value = withTiming(percent, { duration: 500 });
      incrementAnimation();
    }
  }, [animated]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }));

  return (
    <HStack className="items-center gap-2">
      <Text className="w-6 text-typography-400 font-dm-sans-regular">{day}</Text>

      <Box className="flex-1">
        <Progress value={animated ? percent : 0} className="w-full h-3 bg-background-200">
          <AnimatedProgressFilledTrack className="h-3 bg-primary-500" style={progressStyle} />
        </Progress>
      </Box>

      <Text className="w-8 text-right text-typography-100 font-dm-sans-medium">{count}</Text>
    </HStack>
  );
};

export default DailyVisitCard;
