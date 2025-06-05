import React from "react";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

interface IScheduleCard {
  icon: any;
  text: string;
  time: string;
  currentUpdate: string;
}

const ScheduleCard = ({ icon, text, time, currentUpdate }: IScheduleCard) => {
  return (
    <HStack space="sm" className="px-3 py-2 rounded-2xl bg-background-100">
      <Box className="h-7 w-7 bg-background-50">
        <Icon as={icon} className="text-background-800 w-7 h-7" />
      </Box>
      <VStack>
        <Text size="sm" className="text-typography-900">
          {text}
        </Text>
        <HStack className="justify-between">
          <Text className="text-typography-900">{time}</Text>
          <Text size="xs" className="text-typography-900">
            {currentUpdate}
          </Text>
        </HStack>
      </VStack>
    </HStack>
  );
};

export default ScheduleCard;
