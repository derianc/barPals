import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Platform, Image } from "react-native";
import { Icon } from "@/components/ui/icon";
import {
  Home,
  List,
  CameraIcon,
  Map as MapIcon,
  TagIcon,
  User,
} from "lucide-react-native";
import { useUser } from "@/contexts/userContext";

interface TabItem {
  name: string;
  label: string;
  path: string;
  icon: React.ElementType;
}

function BottomTabBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const avatarUrl = user?.avatar_url ?? null;
  const userType = user?.role === "owner" ? "owner" : "user";


  const tabItems: TabItem[] =
    userType === "owner"
      ? [
          { name: "(ownerHome)", label: "Home", path: "(ownerHome)", icon: Home },
          { name: "(ownerFeed)", label: "Feed", path: "(ownerFeed)/index", icon: List },
          { name: "(ownerMap)", label: "Map", path: "(ownerMap)/index", icon: MapIcon },
          { name: "(ownerOffers)", label: "Offers", path: "(ownerOffers)/index", icon: TagIcon },
          { name: "(ownerProfile)", label: "Profile", path: "(ownerProfile)/index", icon: User },
        ]
      : [
          { name: "(userHome)", label: "Home", path: "(userHome)", icon: Home },
          { name: "(userFeed)", label: "Feed", path: "(userFeed)/index", icon: List },
          { name: "camera", label: "Camera", path: "camera", icon: CameraIcon },
          { name: "(userOffers)", label: "Offers", path: "(userOffers)/index", icon: TagIcon },
          { name: "(userProfile)", label: "Settings", path: "(userProfile)/index", icon: User },
        ];

  return (
    <Box className="bg-background-0">
      <HStack
        className="bg-background-0 pt-4 px-7 rounded-t-3xl min-h-[78px]"
        style={{
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 16,
          boxShadow: "0px -10px 12px 0px rgba(0, 0, 0, 0.04)",
        }}
        space="md"
      >
        {tabItems.map((item) => {
          const isActive = props.state.routeNames[props.state.index] === item.path;
          const isProfileTab =
            item.name === "(userProfile)" || item.name === "(ownerProfile)";

          return (
            <Pressable
              key={item.name}
              className="flex-1 items-center justify-center"
              onPress={() => props.navigation.navigate(item.path)}
            >
              {isProfileTab && avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    borderWidth: 2,
                    borderColor: isActive ? "#6A11CB" : "#9CA3AF",
                  }}
                />
              ) : (
                <Icon
                  as={item.icon}
                  size="xl"
                  className={`${
                    isActive ? "text-primary-800" : "text-background-500"
                  }`}
                />
              )}
              <Text
                size="xs"
                className={`mt-1 font-medium ${
                  isActive ? "text-primary-800" : "text-background-500"
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </HStack>
    </Box>
  );
}

export default BottomTabBar;
