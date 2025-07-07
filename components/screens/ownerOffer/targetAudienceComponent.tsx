import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
} from "react-native";
import OfferStepContainer from "@/components/ui/offerStepContainer/offerStepContainer";
import Slider from "@react-native-community/slider";

const chipOptions = [
    { label: "Previous 7 Days", value: "7days" },
    { label: "Previous 30 Days", value: "30Days" },
    { label: "Any Time", value: "allTime" },
    { label: "Never Before", value: "never" },
];

// Update: components/screens/ownerOffer/TargetAudienceSection.tsx
type Props = {
  selectedChips: string[];
  setSelectedChips: React.Dispatch<React.SetStateAction<string[]>>;
  spend: number;
  setSpend: (v: number) => void;
  distance: number;
  setDistance: (v: number) => void;
};

const TargetAudienceSection = ({
  selectedChips,
  setSelectedChips,
  spend,
  setSpend,
  distance,
  setDistance,
}: Props) => {
    const toggleChip = (value: string) => {
        setSelectedChips((prev: string[]) =>
            prev.includes(value) ? prev.filter((v: string) => v !== value) : [...prev, value]
        );
    };

  return (
    <OfferStepContainer title="Target Audience">
      {/* Chips */}
      <Text style={styles.label}>Last Visited</Text>
      <View style={styles.chipContainer}>
        {chipOptions.map((chip) => (
          <Pressable
            key={chip.value}
            onPress={() => toggleChip(chip.value)}
            style={[
              styles.chip,
              selectedChips.includes(chip.value) && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedChips.includes(chip.value) && styles.chipTextSelected,
              ]}
            >
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Spend Slider */}
      <Text style={styles.label}>Min Spend (${spend})</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={1000}
        step={5}
        value={spend}
        onValueChange={setSpend}
        minimumTrackTintColor="#7C3AED"
        maximumTrackTintColor="#4B5563"
        thumbTintColor="#7C3AED"
      />

      {/* Distance Slider */}
      <Text style={styles.label}>Max Distance ({distance} mi)</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={20}
        step={5}
        value={distance}
        onValueChange={setDistance}
        minimumTrackTintColor="#7C3AED"
        maximumTrackTintColor="#4B5563"
        thumbTintColor="#7C3AED"
      />
    </OfferStepContainer>
  );
};


const styles = StyleSheet.create({
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 12,
    },
    chip: {
        borderWidth: 1,
        borderColor: "#7C3AED",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
    },
    chipSelected: {
        backgroundColor: "#7C3AED",
    },
    chipText: {
        color: "#7C3AED",
        fontWeight: "500",
    },
    chipTextSelected: {
        color: "#fff",
    },
    label: {
        fontSize: 14,
        color: "#ffffff",
        fontWeight: "600",
        marginTop: 16,
        marginBottom: 6,
    },
    dropdown: {
        backgroundColor: "#1F2937",
        borderColor: "#7C3AED",
        marginBottom: 8,
    },
    slider: {
        width: "100%",
        height: 40,
    },
});

export default TargetAudienceSection;
