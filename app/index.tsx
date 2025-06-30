// app/index.tsx
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useUser } from "@/contexts/userContext";

export default function Index() {
  const router = useRouter();
  const { user, rehydrated } = useUser();

  useEffect(() => {
    if (!rehydrated) return; // wait until context finishes loading

    if (!user) {
      console.log("🚫 No user found. Redirecting to login...");
      router.replace("/login");
      return;
    }

    console.log("✅ Logged in user:", user);

    if (user.role === "owner") {
      console.log("👑 Redirecting to /ownerHome...");
      router.replace("/(tabs)/(ownerHome)");
    } else {
      console.log("🙋‍♂️ Redirecting to /userHome...");
      router.replace("/(tabs)/(userHome)");
    }
  }, [user, rehydrated]);

  return null;
}
