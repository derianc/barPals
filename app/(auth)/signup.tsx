import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Divider } from "@/components/ui/divider";
import { Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { registerUser } from "@/services/sbUserService";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);

    const { user, signUpError, profileError } = await registerUser(
      email,
      password
    );

    setLoading(false);

    if (signUpError) {
      Alert.alert("Signup Error", signUpError.message);
      return;
    }

    if (profileError) {
      console.error("Profile creation failed:", profileError);
      Alert.alert(
        "Error",
        "Your account was created, but we couldn’t create your profile. Please try again."
      );
      return;
    }

    // If both steps succeeded:
    Alert.alert(
      "Success",
      "🎉 Check your email for a confirmation link before logging in."
    );
    router.replace("/login");
    
  };

  return (
    <LinearGradient
      colors={["#6A11CB", "#2575FC"]}
      style={styles.container}
    >
      <VStack style={styles.inner}>
        <Text style={styles.header}>Create Account</Text>

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

        {/* Confirm Password Input */}
        <View style={styles.inputWrapper}>
          <HStack style={styles.iconRow}>
            <Entypo name="lock" size={20} color="#fff" />
            <Input variant="underlined" size="md" className="flex-1">
              <InputField
                placeholder="Confirm Password"
                placeholderTextColor="#eee"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.underlineInput}
              />
            </Input>
          </HStack>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Link back to Login */}
        <HStack style={styles.signinRow}>
          <Text style={styles.signinText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.signinLink}> Sign In</Text>
          </TouchableOpacity>
        </HStack>

        {/* Divider with OR */}
        <HStack style={styles.dividerRow}>
          <Divider style={styles.divider} />
          <Text style={styles.orText}>Or</Text>
          <Divider style={styles.divider} />
        </HStack>

        {/* Social Signup Icons */}
        <Text style={styles.socialPrompt}>Sign Up with Social Networks</Text>
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
    borderBottomWidth: 1,
    borderColor: "#fff",
    backgroundColor: "transparent",
    borderRadius: 8,
  },
  signupButton: {
    backgroundColor: "#9C27B0",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  signupButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  signinRow: {
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  signinText: {
    color: "#fff",
    fontSize: 13,
  },
  signinLink: {
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
