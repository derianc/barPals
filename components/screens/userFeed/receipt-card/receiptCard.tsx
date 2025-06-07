import React from "react";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Text as AppText } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { Pressable } from "@/components/ui/pressable";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Icon } from "@/components/ui/icon";
import { Clock, Calendar, CheckCircle, XCircle } from "lucide-react-native";
import { TransactionItem } from "@/data/models/transactionModel";

interface IReceiptCard {
  receipt_id: number;
  merchant_name: string;
  transaction_date: string;
  transaction_time: string;
  item_count: number;
  total: number;
  isVerified: boolean;
  isSelected: boolean;
  onSelect: (receipt_id: number) => void;
  items?: TransactionItem[];
  isExpanded?: boolean;
}

const ReceiptCard = ({
  receipt_id,
  merchant_name,
  transaction_date,
  transaction_time,
  item_count,
  total,
  isVerified = true,
  isSelected,
  onSelect,
  items = [],
  isExpanded = false,
}: IReceiptCard) => {
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.9), withSpring(1));
    onSelect(receipt_id);
  };

  return (
    <AnimatedPressable
      className={`p-4 rounded-[18px] gap-4 flex-col ${
        isSelected ? "bg-primary-50" : "bg-background-100"
      }`}
      onPress={handlePress}
      style={animatedStyle}
    >
      {/* 🔹 Merchant Name: full-width on its own line */}
      <Text size="lg" className="font-semibold text-typography-700" style={{fontFamily: "dm-sans-bold",}}>
        {merchant_name}
      </Text>

      {/* 🔹 Item count, date/time, total in LocationCard-style row */}
      <HStack>
        <VStack className="flex-1">
          <Text size="sm" className="font-medium text-typography-600">
            {item_count} item{item_count !== 1 ? "s" : ""}
          </Text>
        </VStack>

        <HStack className="items-center" space="sm">
          <VStack className="items-start space-y-1">
            <HStack space="xs" className="items-center">
              <Icon as={Calendar} size="sm" className="text-typography-500" />
              <Text
                size="sm"
                style={{ fontFamily: "dm-sans-light" }}
                className="text-typography-500"
              >
                {transaction_date}
              </Text>
            </HStack>

            <HStack space="xs" className="items-center">
              <Icon as={Clock} size="sm" className="text-typography-500" />
              <Text
                size="sm"
                style={{ fontFamily: "dm-sans-light" }}
                className="text-typography-500"
              >
                {transaction_time}
              </Text>
            </HStack>
          </VStack>


          <Divider orientation="vertical" className="bg-outline-200 h-[62px]" />

          <Text size="xl" className="text-typography-700">
            <Text className="text-success-600 font-bold">$</Text>
            <Text className="font-normal">
              {total.toFixed(2).padStart(5, "0")}
            </Text>
          </Text>
        </HStack>
      </HStack>

      <HStack className="items-center space-x-1 mt-2">
        <Icon
          as={isVerified ? CheckCircle : XCircle}
          size="sm"
          className={isVerified ? "text-success-600" : "text-error-600"}
        />
        <Text
          size="xs"
          style={{ fontFamily: "dm-sans-light" }}
          className="text-typography-500"
        >
          {isVerified ? "Verified" : "Unverified"}
        </Text>
      </HStack>

      {isExpanded && Array.isArray(items) && items.length > 0 && (
        <VStack className="mt-3 bg-background-100 rounded-xl p-3 gap-2">
          {items.map((item, index) => (
            <HStack key={index} className="justify-between items-center">
              <AppText className="flex-1 text-typography-900">{index + 1}. {item.item_name}</AppText>
              <AppText className="text-typography-600">x{item.quantity}</AppText>
              <AppText className="text-typography-900">${item.price?.toFixed(2) ?? "—"}</AppText>
            </HStack>
          ))}
        </VStack>
      )}

    </AnimatedPressable>
  );
};

export default ReceiptCard;
