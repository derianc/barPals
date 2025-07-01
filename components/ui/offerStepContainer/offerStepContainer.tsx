import React from "react";
import { View } from "react-native";

const OfferStepContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <View className="bg-neutral-900 p-5 rounded-2xl shadow-md">
      {children}
    </View>
  );
};

export default OfferStepContainer;
