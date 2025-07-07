import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface OfferStepContainerProps {
  children: React.ReactNode;
  title?: string;
}

const OfferStepContainer = ({ children, title }: OfferStepContainerProps) => {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111827", // Tailwind bg-background-100
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
});

export default OfferStepContainer;
