import React, { useContext } from "react";
import { HStack } from "@/components/ui/hstack";
import { SearchIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { ImageBackground } from "@/components/ui/image-background";
import { Image } from "@/components/ui/image";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Mic } from "lucide-react-native";
import { ThemeContext } from "@/contexts/theme-context";

const CustomHeader = ({
  variant = "general",
  title,
  label,
}: {
  variant: "general" | "search";
  title?: string;
  label?: string;
}) => {
  const { colorMode }: any = useContext(ThemeContext);
  return (
    <Box className="bg-background-0 rounded-b-3xl overflow-hidden mb-3">
      <ImageBackground
        source={
          colorMode === "dark"
            ? require("@/assets/images/weather-bg-dark.webp")
            : require("@/assets/images/weather-bg-light.webp")
        }
      >
        <HStack className="p-5 pt-16 gap-6 justify-between">
          <HStack className="justify-between">
            <VStack className="gap-2.5 justify-between">
              <Text className="text-background-700 font-dm-sans-bold text-3xl">
                {title}
              </Text>
              <Text className="text-background-700 font-dm-sans-medium text-lg">
                Bengaluru, India
              </Text>
            </VStack>
          </HStack>
          <HStack className="gap-4">
            <VStack className="justify-end items-center">
              <Text className="text-typography-800 font-dm-sans-regular text-4xl mt-2">
                13°
              </Text>
              <Text className="text-typography-800 font-dm-sans-medium text-xs">
                Feels like 12°
              </Text>
            </VStack>

            <VStack className="justify-end items-center ">
              <Image
                source={require("@/assets/images/thunderstorm.png")}
                alt="thunderstorm"
                contentFit="contain"
                className="h-12 w-12"
              />
              <Text className="text-background-700" size="xs">
                Thunderstorm
              </Text>
            </VStack>
          </HStack>
        </HStack>
        {variant === "search" && (
          <Input
            variant="outline"
            className="border-0 bg-background-50 rounded-xl py-1 px-4 mt-2 mb-5 mx-5"
            size="lg"
          >
            <InputSlot>
              <InputIcon as={SearchIcon} className="text-outline-200" />
            </InputSlot>
            <InputField
              placeholder={label}
              className="placeholder:text-typography-200"
            />
            <InputSlot>
              <InputIcon as={Mic} className="text-outline-200" />
            </InputSlot>
          </Input>
        )}
      </ImageBackground>
    </Box>
  );
};

export default CustomHeader;
