import React, { useState } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import StepIndicator from "react-native-step-indicator";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

import Step1BasicInfo from "@/components/screens/ownerOffer/create/Step1BasicInfo";
import Step2Validity from "@/components/screens/ownerOffer/create/Step2Validity";
import Step3Audience from "@/components/screens/ownerOffer/create/Step3Audience";
import Step4Review from "@/components/screens/ownerOffer/create/Step4Review";
import OwnerOfferHeader from "@/components/shared/custom-header/ownerOfferHeader";

const labels = ["Basic Info", "Validity", "Audience", "Review"];
const screenWidth = Dimensions.get("window").width;

const CreateOfferStepper = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const translateX = useSharedValue(0);

  const nextStep = () => {
    if (currentStep < labels.length - 1) {
      translateX.value = withTiming(-(currentStep + 1) * screenWidth);
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      translateX.value = withTiming(-(currentStep - 1) * screenWidth);
      setCurrentStep(prev => prev - 1);
    }
  };

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="flex-1 bg-background-0">
      <OwnerOfferHeader />

      <View className="p-4">
        <StepIndicator
          currentPosition={currentStep}
          labels={labels}
          stepCount={labels.length}
          customStyles={{
            stepIndicatorSize: 25,
            currentStepIndicatorSize: 30,
            separatorStrokeWidth: 2,
            currentStepStrokeWidth: 3,
            stepStrokeCurrentColor: "#EF4444",
            stepIndicatorCurrentColor: "#EF4444",
            stepIndicatorLabelCurrentColor: "#fff",
            stepStrokeFinishedColor: "#EF4444",
            separatorFinishedColor: "#EF4444",
            stepIndicatorFinishedColor: "#EF4444",
            stepIndicatorLabelFinishedColor: "#fff",
            stepStrokeUnFinishedColor: "#D1D5DB",
            separatorUnFinishedColor: "#D1D5DB",
            stepIndicatorUnFinishedColor: "#D1D5DB",
            stepIndicatorLabelUnFinishedColor: "#9CA3AF",
            labelColor: "#6B7280",
            labelSize: 12,
            currentStepLabelColor: "#fff",
          }}
        />
      </View>

      <Animated.View style={[{ flexDirection: "row", width: screenWidth * 4 }, slideStyle]}>
        <View style={{ width: screenWidth, padding: 16 }}>
          <Step1BasicInfo />
        </View>
        <View style={{ width: screenWidth, padding: 16 }}>
          <Step2Validity />
        </View>
        <View style={{ width: screenWidth, padding: 16 }}>
          <Step3Audience />
        </View>
        <View style={{ width: screenWidth, padding: 16 }}>
          <Step4Review />
        </View>
      </Animated.View>

      <View className="flex-row justify-between mt-6 px-4 pb-4">
        <Pressable
          disabled={currentStep === 0}
          onPress={prevStep}
          className="bg-gray-300 px-4 py-2 rounded-xl"
        >
          <Text className="text-sm text-black">Back</Text>
        </Pressable>

        <Pressable
          onPress={nextStep}
          className="bg-red-600 px-4 py-2 rounded-xl"
        >
          <Text className="text-sm text-white">
            {currentStep === labels.length - 1 ? "Submit" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default CreateOfferStepper;
