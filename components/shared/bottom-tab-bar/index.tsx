import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Platform, Image, View, TouchableOpacity } from "react-native";
import { Icon } from "@/components/ui/icon";
import {
  Home,
  List,
  CameraIcon,
  Map as MapIcon,
  TagIcon,
  User,
  Settings,
  Building,
  Users2,
} from "lucide-react-native";
import { useUser } from "@/contexts/userContext";
import { useOfferNotificationSubscription } from "@/hooks/useOfferNotificationSubscription";
import Tooltip from "react-native-walkthrough-tooltip";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/supabase";
import TooltipModal from "../tooltip/TooltipModal";

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
  const userType = user?.role === "admin" ? "admin" : user?.role === "owner" ? "owner" : "user";
  const { notificationCount } = useOfferNotificationSubscription();
  const [step, setStep] = useState(0);
  const [showTooltips, setShowTooltips] = useState(user?.has_seen_tooltips === false);
  const tabRefs = useRef<(View | null)[]>([]);
  const [tabX, setTabX] = useState<number>(0);

  const tooltipSteps = userType === "owner"
    ? [
      { name: "(ownerHome)", message: "Your dashboard of recent activity." },
      { name: "(ownerFeed)", message: "Track receipts submitted by users." },
      { name: "(ownerMap)", message: "View nearby users in real-time." },
      { name: "(ownerOffers)", message: "Create and manage promotions." },
      { name: "(ownerProfile)", message: "Update your venue profile." },
    ]
    : userType === "admin"
      ? [
        { name: "(adminHome)", message: "Admin dashboard and metrics." },
        { name: "(adminVenues)", message: "Review user receipts and actions." },
        { name: "(adminUsers)", message: "Oversee geographic user activity." },
        { name: "(adminOffers)", message: "View and manage all offers." },
        { name: "(ownerProfile)", message: "Admin profile and user management." },
      ]
      : [
        { name: "(userHome)", message: "Browse personalized offers here." },
        { name: "(userFeed)", message: "See your latest activity." },
        { name: "camera", message: "Snap receipts to earn rewards." },
        { name: "(userOffers)", message: "Check new rewards or discounts." },
        { name: "(userProfile)", message: "View and update your settings." },
      ];

  const tabItems: TabItem[] =
    userType === "owner"
      ? [
        { name: "(ownerHome)", label: "Home", path: "(ownerHome)", icon: Home },
        { name: "(ownerFeed)", label: "Feed", path: "(ownerFeed)/index", icon: List },
        { name: "(ownerMap)", label: "Map", path: "(ownerMap)/index", icon: MapIcon },
        { name: "(ownerOffers)", label: "Offers", path: "(ownerOffers)/index", icon: TagIcon },
        { name: "(ownerProfile)", label: "Profile", path: "(ownerProfile)/index", icon: User },
      ]
      : userType === "admin"
        ? [
          { name: "(adminHome)", label: "Dashboard", path: "(adminHome)", icon: Home },
          { name: "(adminVenues)", label: "Venues", path: "(adminVenues)/index", icon: Building },
          { name: "(adminUsers)", label: "Users", path: "(adminUsers)/index", icon: Users2 },
          { name: "(adminOffers)", label: "Offers", path: "(adminOffers)/index", icon: TagIcon },
          { name: "(ownerProfile)", label: "Settings", path: "(ownerProfile)/index", icon: Settings },
        ]
        : [
          { name: "(userHome)", label: "Home", path: "(userHome)", icon: Home },
          { name: "(userFeed)", label: "Feed", path: "(userFeed)/index", icon: List },
          { name: "camera", label: "Camera", path: "camera", icon: CameraIcon },
          { name: "(userOffers)", label: "Offers", path: "(userOffers)/index", icon: TagIcon },
          { name: "(userProfile)", label: "Settings", path: "(userProfile)/index", icon: User },
        ];

        

  useEffect(() => {
    const targetIndex = tabItems.findIndex(t => t.name === tooltipSteps[step]?.name);
    const tabRef = tabRefs.current[targetIndex];

    if (tabRef) {
      tabRef.measureInWindow((x, y, width) => {
        setTabX(x + width / 2); // center of the tab
      });
    }
  }, [step, tabItems]);

  const handleNext = async () => {
    if (step < tooltipSteps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      setShowTooltips(false);
      await supabase
        .from("profiles")
        .update({ has_seen_tooltips: true })
        .eq("id", user?.id);
    }
  };

  return (
  <View style={{ position: "relative" }}>
    <Box className="bg-background-0">
      <HStack
        className="bg-background-0 pt-4 px-7 rounded-t-3xl min-h-[78px]"
        style={{
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 16,
          justifyContent: "space-between",
        }}
      >
        {tabItems.map((item, index) => {
          const isActive = props.state.routeNames[props.state.index] === item.path;
          const isProfileTab = item.name === "(userProfile)" || item.name === "(ownerProfile)";
          const isOffersTab = item.name === "(userOffers)";

          const pressable = (
            <TouchableOpacity
              key={item.name}
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 4,
              }}
              onPress={() => {
                // console.log("🔍 Pressed tab:", item.name);
                props.navigation.navigate(item.path);
              }}
            >
              <Box style={{ position: "relative", alignItems: "center" }}>
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
                    className={isActive ? "text-primary-800" : "text-background-500"}
                  />
                )}

                {isOffersTab && notificationCount > 0 && (
                  <Box
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -12,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: "red",
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text size="2xs" style={{ color: "white", fontWeight: "bold" }}>
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </Text>
                  </Box>
                )}
              </Box>

              <Text
                size="xs"
                className={`mt-1 font-medium ${isActive ? "text-primary-800" : "text-background-500"}`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );

          return (
            <View
              key={`${item.name}-wrapper`}
              style={{ flex: 1 }}
              ref={(el) => { tabRefs.current[index] = el as View }}
            >
              {pressable}
            </View>
          );
        })}
      </HStack>
    </Box>

    {/* ✅ Overlay tooltip modal after rendering tabs */}
      {showTooltips && tooltipSteps[step] && (
        <TooltipModal
          isVisible={true}
          onNext={handleNext}
          icon={tooltipSteps[step]?.name ? tabItems.find(t => t.name === tooltipSteps[step]?.name)?.icon ?? Home : Home}
          message={tooltipSteps[step].message}
          tabX={tabX} // ✅ actual measured tab position
        />
      )}
  </View>
);

}

export default BottomTabBar;
