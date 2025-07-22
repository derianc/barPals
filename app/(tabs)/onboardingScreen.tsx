import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    title: "Get Rewarded for Going Out 🍻",
    subtitle: "Discover bars, snap receipts, earn perks.",
    animation: require("@/assets/animations/rewards.json"),
  },
  {
    title: "Snap! Earn!! Repeat!!!",
    subtitle: "Snap a pic of your receipt to earn points.",
    animation: require("@/assets/animations/camera.json"),
  },
  {
    title: "Find Perks Nearby 🗺️",
    subtitle: "We use your location to suggest local spots.",
    animation: require("@/assets/animations/location.json"),
    permission: "location",
  },
  {
    title: "Never Miss a Happy Hour 🍹",
    subtitle: "Get notified when offers drop nearby.",
    animation: require("@/assets/animations/notification.json"),
    permission: "notifications",
  },
  {
    title: "You're All Set 🎉",
    subtitle: "Start exploring, snapping, and earning now.",
    animation: require("@/assets/animations/celebrate.json"),
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.setItem("onboarding_complete", "true");
  }, []);

  const handleNext = async () => {
    Haptics.selectionAsync(); // 💥 haptic feedback

    const currentSlide = slides[step];
    if (currentSlide.permission === "location") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location Needed", "We use your location to find nearby venues.");
      }
    }

    if (currentSlide.permission === "notifications") {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Enable Notifications", "We’ll notify you when venues near you offer deals.");
      }
    }

    if (step === slides.length - 1) {
      await AsyncStorage.setItem("onboarding_complete", "true");
      router.replace("/login");
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleSkip = async () => {
    Haptics.selectionAsync(); // 💥 haptic
    await AsyncStorage.setItem("onboarding_complete", "true");
    router.replace("/login");
  };

  const { title, subtitle, animation } = slides[step];

  return (
    <SafeAreaView style={styles.container}>
      <LottieView source={animation} autoPlay loop style={styles.lottie} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View
        style={[
          styles.controls,
          step === slides.length - 1 && styles.controlsCentered,
        ]}
      >
        {step < slides.length - 1 && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextText}>
            {step === slides.length - 1 ? "Get Started!!" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  lottie: {
    width: width * 0.9,
    height: height * 0.4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#cbd5e1",
    textAlign: "center",
    marginTop: 8,
  },
  controls: {
    marginTop: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlsCentered: {
    justifyContent: "center",
  },
  skip: {
    color: "#a1a1aa", // soft neutral
    fontSize: 16,
    fontFamily: "dm-sans-regular",
  },
  nextButton: {
    backgroundColor: "#a78bfa", // ✅ secondary-200 app purple
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  nextText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "dm-sans-bold",
  },
});

