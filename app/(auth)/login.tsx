// app/(auth)/login.tsx
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, Platform, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { createOrUpdateUserProfile } from "@/services/sbUserService";
import { useUser } from "@/contexts/userContext";
import { registerForFcmPushNotificationsAsync } from "@/services/fcmNotificationService";
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import { supabase } from "@/supabase";
import {
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Constants from "expo-constants";
import LottieView from "lottie-react-native";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user, rehydrated } = useUser();
  const [hasRedirected, setHasRedirected] = useState(false);
  const leftOffset = useSharedValue(-200); // slide in from far left
  const rightOffset = useSharedValue(200); // slide in from far right

  useEffect(() => {
    leftOffset.value = withTiming(0, {
      duration: 2700,
      easing: Easing.out(Easing.exp),
    });
    rightOffset.value = withTiming(0, {
      duration: 2700,
      easing: Easing.out(Easing.exp),
    });
  }, []);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "951598715886-jmsbgqouev3rfoqeaupa4t7nbohslre2.apps.googleusercontent.com",
      scopes: ['profile', 'email'],
      forceCodeForRefreshToken: true,
    });
  }, []);

  
  const LoadingOverlay = () => (
    <View style={styles.overlay}>
      <LottieView
        source={require("@/assets/animations/loading.json")}
        autoPlay
        loop
        style={styles.lottie}
      />
    </View>
  );

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();

      // 👇 Force account picker every time
      await GoogleSignin.signOut();

      const response = await GoogleSignin.signIn();
      // Alert.alert("login response", JSON.stringify(response, null, 2));

      setLoading(true); // ⬅️ Start loading

      if (isSuccessResponse(response)) {
        const { idToken, user } = response.data;
        const { name, email, photo } = user;
        console.log("user:", JSON.stringify(user, null, 2));

        if (!idToken) {
          console.error("❌ Google returned null idToken");
          // Alert.alert("Error", "Unable to retrieve ID token from Google.");
          return;
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (error)
          console.log("supabase login error", JSON.stringify(error, null, 2))

        await createOrUpdateUserProfile(user, data.user?.id!)

      } else {
        Alert.alert("login error", JSON.stringify(response, null, 2));
        console.log("google signin was canceled");
      }

    }
    catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            console.log("Google Signin is in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.log("Play Services are not available")
            break;
          default:
          // Alert.alert(error.code + error.message)
        }
      }
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (rehydrated && user && !hasRedirected) {
        const run = async () => {
          try {
            await registerForFcmPushNotificationsAsync(user.id);
            setHasRedirected(true);

            const destination =
              user.role === "owner"
                ? "/(tabs)/(ownerHome)"
                : "/(tabs)/(userHome)";
            router.replace(destination);
          } catch (e) {
            console.error("Login redirect error", e);
          }
        };

        run();
      }
    }, 500); // Adjust this timeout to what works reliably on your device

    return () => clearTimeout(delay);
  }, [rehydrated, user?.id, hasRedirected]);

  return (
    <LinearGradient colors={["#6A11CB", "#2575FC"]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require("@/assets/icons/appIcon.png")} style={styles.logo} />
        </View>
        <Text style={styles.appName}>BarPals</Text>
        <Text style={styles.subtitle}>Discover the best deals, drinks, and nights out</Text>

        <View  style={styles.googleButtonWrapper}>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
            <Image source={require("@/assets/icons/google.png")} style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 DCM Design Studios</Text>
        <Text style={styles.footerText}>v{Constants.expoConfig?.version ?? "1.0.0"}</Text>
      </View>

      {loading && <LoadingOverlay  />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 40, // ⬅️ Added paddingTop
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 34,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 12,
  },
  tagline: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#e0e0e0",
    marginBottom: 32,
    textAlign: "center",
  },
  googleButtonWrapper: {
  marginTop: 64,
},
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  googleIcon: {
    width: 28,
    height: 28,
    marginRight: 12,
    resizeMode: "contain",
    borderRadius: 14,
    overflow: "hidden",
  },
  footer: {
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  footerText: {
    color: "#bbb",
    fontSize: 12,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    height: Dimensions.get("window").height,
    width: Dimensions.get("window").width,
    backgroundColor: "rgba(0, 0, 0, 0.25)", // optional: dim background
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 20,
    pointerEvents: "auto",
  },
  lottie: {
    width: 120,
    height: 120,
  },
});
