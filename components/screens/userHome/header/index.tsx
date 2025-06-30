import React, { useContext, useEffect, useState } from "react";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { ImageBackground } from "@/components/ui/image-background";
import { ThemeContext } from "@/contexts/theme-context";
import { format } from "date-fns";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { getConsecutiveReceiptDays } from "@/services/sbCoreReceiptService";
import { useUser } from "@/contexts/userContext";


interface UserProfileData {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  allow_notifications: boolean;
  avatar_url?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Header = ({ height }: { height: number }) => {
  const [visitStreak, setVisitStreak] = useState(0);
  const [displayName, setDisplayName] = useState("Welcome back!");
  const { user } = useUser() as { user: UserProfileData | null };

  useEffect(() => {
    if (user?.full_name) {
      setDisplayName(user.full_name);
    }
  }, [user]);

  useEffect(() => {
    const fetchConsecutiveVisits = async () => {
      if (!user?.id) return;
      const result = await getConsecutiveReceiptDays(user.id);
      setVisitStreak(result);
    };

    fetchConsecutiveVisits();
  }, [user]);

  const { colorMode }: any = useContext(ThemeContext);
  const now = new Date();

  const getStreakEmoji = (streak: number) => {
    if (streak >= 8) return "🥇"; // Gold
    if (streak >= 4) return "🥈"; // Silver
    if (streak >= 0) return "🥉"; // Bronze
  };

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
            ? require("@/assets/images/barpals-header.jpg")
            : require("@/assets/images/weather-bg-light.webp")
        }
        className="h-full"
      >
        <Box
          className="absolute top-0 left-0 right-0 bottom-0"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }} // adjust opacity as needed
        />
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
                {displayName}
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
                {format(now, "MMMM d, h:mm a")}
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
            <Animated.Text
              style={[
                {
                  fontFamily: "dm-sans-medium",
                  color: colorMode === "dark" ? "#F2EDFF" : "#FEFEFF",
                  fontSize: 16,
                  textAlign: "center",
                },
              ]}
            >
              {getStreakEmoji(visitStreak)} {visitStreak} day streak
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      </ImageBackground>
    </Box>
  );
};

export default Header;
