// components/screens/userHome/shimmer-card.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from 'expo-linear-gradient';


const ShimmerCard = () => (
  <View style={[styles.card, { flex: 1 }]}>  
    <ShimmerPlaceholder
      LinearGradient={LinearGradient}
      style={styles.iconShimmer}
    />
    <ShimmerPlaceholder
      LinearGradient={LinearGradient}
      style={styles.lineShimmer}
    />
    <ShimmerPlaceholder
      LinearGradient={LinearGradient}
      style={[styles.lineShimmer, { width: "60%" }]}
    />
  </View>
);

export default ShimmerCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e1e1e20",
    borderRadius: 16,
    padding: 16,
    height: 130,       // <-- Set fixed height to match HourlyCard
    width: "100%",     // <-- Ensure consistent layout width
    margin: 4,
  },
  iconShimmer: {
    width: 12,
    height: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  lineShimmer: {
    height: 18,
    borderRadius: 8,
    marginBottom: 8,
    width: "80%",
  },
});

