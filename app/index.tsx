// app/index.tsx
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { getLoggedInUser } from "@/services/sbUserService";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      console.log("🔍 Checking logged-in user...");

      const loggedInUser = await getLoggedInUser();

      if (!loggedInUser) {
        console.log("🚫 No user found. Redirecting to login...");
        router.replace("/login");
        return;
      }

      console.log("✅ Logged in user:", loggedInUser);

      if (loggedInUser.role === "owner") {
        console.log("👑 User is owner. Redirecting to /ownerHome...");
        router.replace("/(tabs)/(ownerHome)");
      } else {
        console.log("🙋‍♂️ User is not owner. Redirecting to /userHome...");
        router.replace("/(tabs)/(userHome)");
      }
    };

    checkSessionAndRedirect();
  }, [router]);

  return null;
}

