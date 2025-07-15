import React from "react";
import LottieView from "lottie-react-native";
import { View, StyleSheet, Dimensions } from "react-native";

const LoadingFooter = () => (
  <View style={styles.overlay}>
    <LottieView
      source={require("@/assets/animations/loading.json")}
      autoPlay
      loop
      style={styles.lottie}
    />
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: -5,
    width: Dimensions.get("window").width,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000, // High priority
    elevation: 10, // For Android
  },
  lottie: {
    width: 100,
    height: 100,
  },
});


export default LoadingFooter;
