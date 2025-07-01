import OfferStepContainer from "@/components/ui/offerStepContainer/offerStepContainer";
import React from "react";
import { View, Text, TextInput } from "react-native";


const Step1BasicInfo = () => {
  return (
    <OfferStepContainer>
      <Text className="text-xl font-bold text-white mb-4">Step 1: Basic Info</Text>

      <Text className="text-white mb-1">Offer Title</Text>
      <TextInput
        className="bg-neutral-800 text-white p-3 rounded-xl mb-4"
        placeholder="e.g. 2-for-1 Drinks"
        placeholderTextColor="#aaa"
      />

      <Text className="text-white mb-1">Description</Text>
      <TextInput
        className="bg-neutral-800 text-white p-3 rounded-xl h-32"
        multiline
        placeholder="Describe your offer..."
        placeholderTextColor="#aaa"
      />
    </OfferStepContainer>
  );
};

export default Step1BasicInfo;
