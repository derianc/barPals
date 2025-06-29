import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile, UserProfileData } from "@/services/sbUserService";
import { supabase } from "@/supabase";
import { Session } from "@supabase/supabase-js";

interface UserContextType {
  user: UserProfileData | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
  session: Session | null;
  rehydrated: boolean;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  session: null,
  rehydrated: false,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [rehydrated, setRehydrated] = useState(false);

  // Step 1: Restore Supabase session and subscribe to future changes
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (session) {
        console.log("✅ Supabase session is already valid.");
        setSession(session);
      } else {
        console.warn("⚠️ Supabase session missing. Skipping refresh.");
      }

      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });

      return () => {
        listener.subscription.unsubscribe();
      };
    };

    init();
  }, []);

  // Step 2: Load user profile only after session is ready
  useEffect(() => {
    const restoreUser = async () => {
      if (!session) {
        console.warn("⏳ Waiting for Supabase session before loading user.");
        return;
      }

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
  }, [session]); // ✅ Only runs after session is restored

  return (
    <UserContext.Provider value={{ user, setUser, session, rehydrated }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
