import OfferStepContainer from "@/components/ui/offerStepContainer/offerStepContainer";
import React from "react";
import { View, Text } from "react-native";

const Step4Review = () => {
  return (
    <OfferStepContainer>
      <Text className="text-lg font-bold text-white mb-2">Review & Submit</Text>
      <Text className="text-sm text-gray-400 mb-4">
        Please confirm the offer details and audience criteria. Once submitted, it will be sent to all matched users.
      </Text>

      {/* Preview (static for now) */}
      <View className="space-y-2 mt-4">
        <Text className="text-white">✅ <Text className="font-semibold">Title:</Text> 2-for-1 Drinks</Text>
        <Text className="text-white">📅 <Text className="font-semibold">Valid:</Text> July 1 – July 5</Text>
        <Text className="text-white">🎯 <Text className="font-semibold">Criteria:</Text> Last 30d + $20+ + Nearby</Text>
      </View>
    </OfferStepContainer>
  );
};

export default Step4Review;
