// contexts/userContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile, UserProfileData } from "@/services/sbUserService";
import { supabase } from "@/supabase";

interface UserContextType {
  user: UserProfileData | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
  rehydrated: boolean;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  rehydrated: false,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [rehydrated, setRehydrated] = useState(false);

  useEffect(() => {
    const restoreSupabaseSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (session) {
        console.log("✅ Supabase session is already valid.");
      } else {
        console.warn("⚠️ Supabase session missing. Skipping refresh (not supported without tokens).");
      }
    };

    restoreSupabaseSession();
  }, []);

  useEffect(() => {
    const restoreUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("loggedInUser");

        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          console.log("🔄 Restored user from AsyncStorage:", parsed);
        } else {
          const profileResult = await getProfile();

          if (profileResult?.data) {
            setUser(profileResult.data);
            await AsyncStorage.setItem("loggedInUser", JSON.stringify(profileResult.data));
            console.log("🧠 Loaded profile from Supabase session:", profileResult.data);
          } else if (profileResult?.error) {
            console.error("❌ Failed to fetch profile from Supabase:", profileResult.error.message);
          } else {
            console.warn("⚠️ getProfile() returned null");
          }
        }
      } catch (err) {
        console.error("❌ Failed to restore user:", err);
      } finally {
        setRehydrated(true);
      }
    };

    restoreUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, rehydrated }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
