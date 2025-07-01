import OfferStepContainer from "@/components/ui/offerStepContainer/offerStepContainer";
import React from "react";
import { View, Text, Switch, TextInput } from "react-native";

const Step3Audience = () => {
  const [recentVisit, setRecentVisit] = React.useState(true);
  const [minSpend, setMinSpend] = React.useState("20");
  const [enableGeo, setEnableGeo] = React.useState(false);

  return (
    <OfferStepContainer>
      <Text className="text-lg font-bold text-white mb-4">Targeting Criteria</Text>

      {/* Recent visit switch */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white">Visited in last 30 days</Text>
        <Switch value={recentVisit} onValueChange={setRecentVisit} />
      </View>

      {/* Minimum spend input */}
      <View className="mb-4">
        <Text className="text-white mb-1">Minimum Spend ($)</Text>
        <TextInput
          className="bg-neutral-800 text-white p-3 rounded-xl"
          keyboardType="numeric"
          value={minSpend}
          onChangeText={setMinSpend}
          placeholder="e.g. 50"
          placeholderTextColor="#888"
        />
      </View>

      {/* Geolocation switch */}
      <View className="flex-row justify-between items-center">
        <Text className="text-white">Users within 5km</Text>
        <Switch value={enableGeo} onValueChange={setEnableGeo} />
      </View>
    </OfferStepContainer>
  );
};

export default Step3Audience;
