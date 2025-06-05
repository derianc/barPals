// app/index.tsx
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase"; // Adjust the import path as necessary

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.log("Error checking Supabase session:", error);
        // fallback to login on error
        router.replace("/login");
        return;
      }

      if (session) {
        // if there is a session, send them to the home tab
        // — in an Expo Router setup where your (tabs) layout houses home.tsx,
        router.replace("/(tabs)/(userHome)");
      } else {
        // otherwise, send them to login
        router.replace("/login");
      }
    };

    checkSessionAndRedirect();
  }, [router]);

  return null;
}
