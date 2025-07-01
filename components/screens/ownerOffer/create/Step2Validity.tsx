import React, { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import DatePicker from "react-native-date-picker";
import { useOfferForm } from "@/components/stores/useOfferForm";
import OfferStepContainer from "@/components/ui/offerStepContainer/offerStepContainer";

const Step2Validity = () => {
  const { validFrom, validUntil, setField } = useOfferForm();
  const [pickerType, setPickerType] = useState<"from" | "until" | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const handleOpenPicker = (type: "from" | "until") => {
    setTempDate(type === "from" ? validFrom || new Date() : validUntil || new Date());
    setPickerType(type);
  };

  const handleConfirm = () => {
    if (pickerType === "from") {
      setField("validFrom", tempDate);
    } else if (pickerType === "until") {
      setField("validUntil", tempDate);
    }
    setPickerType(null);
  };

  return (
    <OfferStepContainer>
      <Text className="text-lg font-bold text-white mb-2">Start Date</Text>
      <Pressable
        className="bg-neutral-800 p-3 rounded-xl mb-4"
        onPress={() => handleOpenPicker("from")}
      >
        <Text className="text-white">
          {validFrom ? validFrom.toLocaleString() : "Select start date"}
        </Text>
      </Pressable>

      <Text className="text-lg font-bold text-white mb-2">End Date</Text>
      <Pressable
        className="bg-neutral-800 p-3 rounded-xl"
        onPress={() => handleOpenPicker("until")}
      >
        <Text className="text-white">
          {validUntil ? validUntil.toLocaleString() : "Select end date"}
        </Text>
      </Pressable>

      <Modal visible={pickerType !== null} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-neutral-900 p-4 rounded-t-2xl">
            <DatePicker
              date={tempDate}
              onDateChange={setTempDate}
              mode="datetime"
              // textColor="#fff"
              // androidVariant="iosClone"
            />
            <Pressable
              className="mt-4 p-3 rounded-lg bg-red-600"
              onPress={handleConfirm}
            >
              <Text className="text-center text-white text-base">Confirm</Text>
            </Pressable>
            <Pressable
              className="mt-2 p-2 rounded-lg bg-neutral-800"
              onPress={() => setPickerType(null)}
            >
              <Text className="text-center text-white text-sm">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </OfferStepContainer>
  );
};

export default Step2Validity;
