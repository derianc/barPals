import React from "react";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ArrowUpIcon, ArrowDownIcon } from "@/components/shared/icon";

interface IHourlyCard {
  icon: any;
  text: string;
  currentUpdate: string;
  lastUpdate: string;
  arrowDownIcon?: boolean;
  arrowUpIcon?: boolean;
}

const HourlyCard = ({
  icon,
  text,
  currentUpdate,
  lastUpdate,
  arrowDownIcon,
  arrowUpIcon,
}: IHourlyCard) => {
  return (
    <VStack className="p-3 rounded-2xl bg-background-100 flex-1 items-left gap-4">
      <HStack className="gap-2 items-center">
        <Box className="h-7 w-7 bg-background-50 rounded-full items-center justify-center">
          <Icon as={icon} className="text-typography-400" size="sm" />
        </Box>
        <Text className="text-typography-400 font-dm-sans-regular">
          {text}
        </Text>
      </HStack>
      <VStack className="flex-1 gap-2">
        <Text className="text-typography-900 font-dm-sans-regular text-[28px]">
          {currentUpdate}
        </Text>
        <HStack className="items-center gap-1">
          {arrowDownIcon && (
            <Icon
              size="xs"
              as={ArrowDownIcon}
              className="stroke-none fill-primary-200"
            />
          )}
          {arrowUpIcon && (
            <Icon
              size="xs"
              as={ArrowUpIcon}
              className="stroke-none fill-primary-200"
            />
          )}
          <Text className="text-typography-900 font-dm-sans-medium" size='xs'>
            {lastUpdate}
          </Text>
        </HStack>
      </VStack>
    </VStack>
  );
};

export default HourlyCard;
