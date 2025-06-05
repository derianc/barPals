import React, { useContext } from "react";
import { HStack } from "@/components/ui/hstack";
import { Icon, SearchIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { ImageBackground } from "@/components/ui/image-background";
import { Image } from "@/components/ui/image";
import { ThemeContext } from "@/contexts/theme-context";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

const Header = ({ height }: { height: number }) => {
  const { colorMode }: any = useContext(ThemeContext);

  // Update all interpolation ranges to match new height values
  const locationTextStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      height,
      [340, 140], // Updated from [340, 170]
      [20, 16]
    ),
  }));

  const dateTextStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      height,
      [340, 140], // Updated from [340, 170]
      [16, 14]
    ),
  }));

  const temperatureTextStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      height,
      [340, 140], // Updated from [340, 170]
      [112, 40]
    ),
    marginLeft: interpolate(
      height,
      [340, 140], // Updated from [340, 170]
      [0, 15]
    ),
  }));

  const feelsLikeTextStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      height,
      [340, 140], // Updated from [340, 170]
      [18, 14]
    ),
  }));

  const weatherTextStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(
      height,
      [340, 140], // Updated from [340, 170]
      [20, 14]
    ),
  }));

  const imageStyle = useAnimatedStyle(() => ({
    width: interpolate(
      height,
      [340, 140], // Updated from [340, 170]
      [124, 56]
    ),
    height: interpolate(
      height,
      [340, 140], // Updated from [340, 170]
      [112, 50]
    ),
    marginTop: interpolate(
      height,
      [340, 140], // Updated from [340, 170]
      [6, 0]
    ),
  }));

  return (
    <Box className="bg-background-0 rounded-b-3xl overflow-hidden flex-1">
      <ImageBackground
        source={
          colorMode === "dark"
            ? require("@/assets/images/weather-bg-dark.webp")
            : require("@/assets/images/weather-bg-light.webp")
        }
        className="h-full"
      >
        <Animated.View
          style={[
            {
              margin: 20,
              display: "flex",
              flex: 1,
              flexDirection: "column",
            },
            useAnimatedStyle(() => ({
              marginTop: interpolate(
                height,
                [340, 140], // Updated from [340, 170]
                [64, 70]
              ),
            })),
          ]}
        >
          <HStack className="justify-between">
            <VStack className="gap-2">
              <Animated.Text
                style={[
                  {
                    fontFamily: "dm-sans-medium",
                    color: colorMode === "dark" ? "#F2EDFF" : "#FEFEFF",
                  },
                  locationTextStyle,
                ]}
              >
                Last Name, First Name
              </Animated.Text>
              <Animated.Text
                style={[
                  {
                    fontFamily: "dm-sans-regular",
                    color: colorMode === "dark" ? "#E5E5E5" : "#F5F5F5",
                  },
                  dateTextStyle,
                ]}
              >
                January 18, 16:14
              </Animated.Text>
            </VStack>
            <Animated.View
              style={[
                {
                  opacity: interpolate(height, [340, 200], [1, 0], "clamp"),
                },
              ]}
            >
              {/* <Icon as={SearchIcon} size="xl" className="text-background-700" /> */}
            </Animated.View>
          </HStack>

          <Animated.View
            style={[
              {
                justifyContent: "space-between",
                position: "absolute",
              },
              useAnimatedStyle(() => ({
                left: interpolate(
                  height,
                  [340, 140], // Updated from [340, 170]
                  [0, 170]
                ),
                bottom: interpolate(
                  height,
                  [340, 140], // Updated from [340, 170]
                  [0, -5]
                ),
              })),
            ]}
          >
            <Animated.Text
              style={[
                {
                  fontFamily: "dm-sans-regular",
                  color: colorMode === "dark" ? "#F2EDFF" : "#FEFEFF",
                },
                temperatureTextStyle,
              ]}
            >
              13°
            </Animated.Text>
            <Animated.Text
              style={[
                {
                  fontFamily: "dm-sans-regular",
                  color: colorMode === "dark" ? "#F2EDFF" : "#FEFEFF",
                },
                feelsLikeTextStyle,
              ]}
            >
              Feels like 12°
            </Animated.Text>
          </Animated.View>

          <Animated.View
            style={[
              {
                justifyContent: "space-between",
                alignItems: "center",
                position: "absolute",
                right: 0,
              },
              useAnimatedStyle(() => ({
                bottom: interpolate(
                  height,
                  [340, 140], // Updated from [340, 170]
                  [0, -5]
                ),
              })),
            ]}
          >
            <Animated.View style={imageStyle}>
              <Image
                source={require("@/assets/images/thunderstorm.png")}
                alt="thunderstorm"
                size="full"
              />
            </Animated.View>
            <Animated.Text
              style={[
                {
                  fontFamily: "dm-sans-regular",
                  color: colorMode === "dark" ? "#F2EDFF" : "#FEFEFF",
                },
                weatherTextStyle,
              ]}
            >
              Thunderstorm
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      </ImageBackground>
    </Box>
  );
};

export default Header;
