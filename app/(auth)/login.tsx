// app/(auth)/login.tsx
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Divider } from "@/components/ui/divider";
import { Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createOrUpdateUserProfile, login } from "@/services/sbUserService";
import { useUser } from "@/contexts/userContext";
import { registerForFcmPushNotificationsAsync } from "@/services/fcmNotificationService";
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import { supabase } from "@/supabase";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Image as RNImage } from "react-native";
import Constants from "expo-constants";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user, rehydrated } = useUser();
  const [hasRedirected, setHasRedirected] = useState(false);  
  const leftOffset = useSharedValue(-200); // slide in from far left
  const rightOffset = useSharedValue(200); // slide in from far right
  const AnimatedImage = Reanimated.createAnimatedComponent(RNImage);

  const leftAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(-35, { duration: 1000 }) }],
    alignSelf: "center",
  }));

  const rightAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(35, { duration: 1000 }) }],
    alignSelf: "center",
  }));

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
    const isPreview = Constants.expoConfig?.android?.package === 'com.derianc.BarPalsPreview';

    GoogleSignin.configure({
      webClientId: "951598715886-jmsbgqouev3rfoqeaupa4t7nbohslre2.apps.googleusercontent.com",
      scopes: ['profile', 'email'],
      forceCodeForRefreshToken: true,
    });

    console.log("✅ Google Signin configured for:", isPreview ? "Preview" : "Dev");
  }, []);


   const handleGoogleSignIn = async () => {
    try{
      await GoogleSignin.hasPlayServices();

      // 👇 Force account picker every time
      await GoogleSignin.signOut();

      const response = await GoogleSignin.signIn();
      // Alert.alert("login response", JSON.stringify(response, null, 2));

      if (isSuccessResponse(response)) {
        const { idToken, user } = response.data;
        const { name, email, photo } = user;
        console.log("user:", JSON.stringify(user, null, 2));

        if (!idToken) {
          console.error("❌ Google returned null idToken");
          Alert.alert("Error", "Unable to retrieve ID token from Google.");
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
            
            Alert.alert(error.code + error.message)
        }
      }
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

  // GoogleSignin.configure({
  //   scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  //   webClientId: '951598715886-jmsbgqouev3rfoqeaupa4t7nbohslre2.apps.googleusercontent.com',
  // })

  return (
    <LinearGradient colors={["#6A11CB", "#2575FC"]} style={styles.container}>
      <VStack style={styles.inner}>
        {/* 🥳 Animated Icons */}
        <AnimatedImage
          source={require("@/assets/icons/appIcon.png")}
          style={[styles.iconImage, leftAnimatedStyle]}
        />
        <AnimatedImage
          source={require("@/assets/icons/appIcon.png")}
          style={[styles.iconImage, rightAnimatedStyle]}
        />

        <Text style={styles.header}>Welcome!</Text>
        <Text style={styles.subtext}>Sign in to get started</Text>

        <HStack style={styles.socialRow}>
          <TouchableOpacity style={styles.socialIconWrapper} onPress={handleGoogleSignIn}>
            <Image source={require("@/assets/icons/google.png")} style={styles.socialIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIconWrapper}>
            <Image source={require("@/assets/icons/facebook.png")} style={styles.socialIcon} />
          </TouchableOpacity>
        </HStack>
      </VStack>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    gap: 20,
  },
  header: {
    fontSize: 36,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
  },
  subtext: {
    fontSize: 16,
    color: "#eee",
    marginBottom: 30,
    textAlign: "center",
  },
  socialRow: {
    flexDirection: "row",
    gap: 30,
    marginTop: 12,
  },
  socialIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    resizeMode: "contain",
  },
  socialIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  emojiIcon: {
    fontSize: 42,
    position: "absolute",
    top: 120,
  },
  iconImage: {
    width: 140,
    height: 140,
    position: "absolute",
    top: 280,
    resizeMode: "contain",
  },
});
