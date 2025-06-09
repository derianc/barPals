// components/screens/userHome/shimmer-card.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from 'expo-linear-gradient';


const ShimmerCard = () => (
  <View style={styles.card}>
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
    borderRadius: 12,
    padding: 16,
    flex: 1,
    margin: 4,
  },
  iconShimmer: {
    width: 12,
    height: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  lineShimmer: {
    height: 10,
    borderRadius: 8,
    marginBottom: 8,
    width: "80%",
  },
});
