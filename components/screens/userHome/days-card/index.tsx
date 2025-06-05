import React from "react";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { Box } from "@/components/ui/box";
import { Image } from "@/components/ui/image";
import { ChevronDownIcon, Icon } from "@/components/ui/icon";

interface IDaysCard {
  name: string;
  weather: string;
  highest: number;
  lowest: number;
  imgUrl: any;
}

const DaysCard = ({ name, weather, highest, lowest, imgUrl }: IDaysCard) => {
  return (
    <HStack className="justify-between rounded-[18px] bg-background-100 p-4">
      <VStack space="xs">
        <Text className="text-typography-900 font-dm-sans-regular">{name}</Text>
        <Text className="text-typography-600 font-dm-sans-regular">
          {weather}
        </Text>
      </VStack>

      <HStack space="sm" className="items-center">
        <VStack>
          <Text className="text-typography-700 text-right font-dm-sans-regular">
            {highest}°
          </Text>
          <Text className="text-typography-700 font-dm-sans-regular">
            {lowest}°
          </Text>
        </VStack>
        <Divider orientation="vertical" className="bg-outline-200" />
        <Box className="h-[54px] w-[40.5px]">
          <Image
            source={imgUrl}
            alt="image"
            contentFit="contain"
            className="w-full h-full"
          />
        </Box>
        <Box className="w-5 h-5 rounded-full bg-background-0">
          <Icon
            as={ChevronDownIcon}
            size="lg"
            className="text-background-800"
          />
        </Box>
      </HStack>
    </HStack>
  );
};

export default DaysCard;
