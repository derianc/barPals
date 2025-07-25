// components/TooltipModal.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import Modal from "react-native-modal";
import { Icon } from "@/components/ui/icon";

const { width } = Dimensions.get("window");

interface TooltipModalProps {
  isVisible: boolean;
  onNext: () => void;
  icon: React.ElementType;
  message: string;
  tabX: number;
}

export default function TooltipModal({ isVisible, onNext, icon: IconComp, message, tabX }: TooltipModalProps) {
  return (
    <Modal isVisible={isVisible} backdropOpacity={0.4} animationIn="fadeIn" animationOut="fadeOut">
      <View style={[styles.tooltip, { left: tabX - 90 }]}>
        <Icon as={IconComp} size="xl" className="text-primary-800" style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
        <Pressable onPress={onNext}>
          <Text style={styles.next}>Next</Text>
        </Pressable>
        <View style={styles.arrow} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    bottom: 120,
    width: 180,
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  icon: {
    marginBottom: 6,
  },
  message: {
    color: "#FFF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  next: {
    marginTop: 8,
    color: "#FFD700",
    fontWeight: "bold",
  },
  arrow: {
    position: "absolute",
    bottom: -10,
    left: 85,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#000",
  },
});
