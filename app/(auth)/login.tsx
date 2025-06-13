// app/(auth)/login.tsx
import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Divider } from "@/components/ui/divider";
import { Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getProfile, login } from "@/services/sbUserService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "@/contexts/userContext";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("derianc@gmail.com");
  const [password, setPassword] = useState("Test123!");
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    const { authData, error } = await login(email, password);
    setLoading(false);

    if (error) {
      Alert.alert("Sign-in Error", error.message);
      return;
    }

    // 🔁 Load and apply user profile into context
    const profileResult = await getProfile();
    if (!profileResult || profileResult.error || !profileResult.data) {
      Alert.alert("Error", "Failed to load user profile.");
      return;
    }

    // update global context
    setUser(profileResult.data);

    // update local storage
    await AsyncStorage.setItem("loggedInUser", JSON.stringify(profileResult.data));

    if (profileResult.data.role === "owner") {
      router.replace("/(tabs)/(ownerHome)");
    } else {
      router.replace("/(tabs)/(userHome)");
    }
  };

  return (
    <LinearGradient
      colors={["#6A11CB", "#2575FC"]}
      style={styles.container}
    >
      <VStack style={styles.inner}>
        <Text style={styles.header}>Welcome!</Text>

        {/* Email Input */}
        <View style={styles.inputWrapper}>
          <HStack style={styles.iconRow}>
            <Entypo name="mail" size={20} color="#fff" />
            <Input variant="underlined" size="md" className="flex-1">
              <InputField
                placeholder="Email"
                placeholderTextColor="#eee"
                value={email}
                onChangeText={setEmail}
                style={styles.underlineInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Input>
          </HStack>
        </View>

        {/* Password Input */}
        <View style={styles.inputWrapper}>
          <HStack style={styles.iconRow}>
            <Entypo name="lock" size={20} color="#fff" />
            <Input variant="underlined" size="md" className="flex-1">
              <InputField
                placeholder="Password"
                placeholderTextColor="#eee"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.underlineInput}
              />
            </Input>
          </HStack>
        </View>

        {/* Forgot Password (optional) */}
        <TouchableOpacity>
          <Text style={styles.forgot}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Sign In Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleSignIn}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Link to Signup */}
        <HStack style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </HStack>

        {/* Divider with OR */}
        <HStack style={styles.dividerRow}>
          <Divider style={styles.divider} />
          <Text style={styles.orText}>Or</Text>
          <Divider style={styles.divider} />
        </HStack>

        {/* Social Login Icons (if needed) */}
        <Text style={styles.socialPrompt}>Sign In with Social Networks</Text>
        <HStack style={styles.socialRow}>
          <TouchableOpacity style={styles.socialIconWrapper}>
            <Image
              source={require("@/assets/icons/google.png")}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIconWrapper}>
            <Image
              source={require("@/assets/icons/facebook.png")}
              style={styles.socialIcon}
            />
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
    paddingHorizontal: 30,
    gap: 20,
  },
  header: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  underlineInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 8,
  },
  inputWrapper: {
    // borderBottomWidth: 1,
    // borderColor: "#fff",
    backgroundColor: "transparent",
    borderRadius: 8,
  },
  forgot: {
    alignSelf: "flex-end",
    color: "#fff",
    fontSize: 13,
    marginTop: -10,
  },
  loginButton: {
    backgroundColor: "#9C27B0",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  signupRow: {
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  signupText: {
    color: "#fff",
    fontSize: 13,
  },
  signupLink: {
    color: "#B2EBF2",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 4,
  },
  dividerRow: {
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  divider: {
    flex: 1,
    backgroundColor: "#fff",
    height: 1,
  },
  orText: {
    color: "#fff",
    fontSize: 12,
  },
  socialPrompt: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  socialRow: {
    justifyContent: "center",
    gap: 20,
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
});
