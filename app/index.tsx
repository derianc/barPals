// app/index.tsx
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { getLoggedInUser } from "@/services/sbUserService";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const loggedInUser = await getLoggedInUser();

      if (!loggedInUser) {
        router.replace("/login");
        return;
      }

      if (loggedInUser?.role === "owner") {
        router.replace("/(tabs)/(ownerHome)");
      } else {
        router.replace("/(tabs)/(userHome)");
      }
    };

    checkSessionAndRedirect();
  }, [router]);

  return null;
}
