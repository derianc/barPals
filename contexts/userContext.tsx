import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile, UserProfileData } from "@/services/sbUserService";
import { supabase } from "@/supabase";
import { Session } from "@supabase/supabase-js";
import deepEqual from "fast-deep-equal";

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
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [rehydrated, setRehydrated] = useState(false);
  const lastSessionRef = useRef<Session | null | undefined>(undefined);

  // Step 1: Initial session load + listener
  useEffect(() => {
    let mounted = true;

    const loadInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session ?? null);
      }
    };

    loadInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("🌀 Auth state changed:", event, "→", newSession);
      setSession(prev => {
        if (deepEqual(prev, newSession)) {
          console.log("⏸ Session unchanged — skipping update.");
          return prev;
        }
        return newSession ?? null;
      });
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []); 

  // Step 2: Restore user once per unique session
  useEffect(() => { 
    const restoreUser = async () => {
      if (session === undefined) return;

      // Debounce using storage
      const flagKey = "user_restore_ran";
      const lastSessionId = session?.user?.id ?? "null";

      const lastRestore = await AsyncStorage.getItem(flagKey);
      if (lastRestore === lastSessionId) {
        console.log("🔁 Skipping restoreUser — already ran for this session.");
        return;
      }

      await AsyncStorage.setItem(flagKey, lastSessionId);

      if (session === null) {
        console.log("🧹 No session – clearing user.");
        setUser(null);
        await AsyncStorage.removeItem("loggedInUser");
        setRehydrated(true);
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
            console.log("🧠 Loaded user from Supabase:", profileResult.data);
          } else if (profileResult?.error) {
            console.error("❌ Failed to load profile:", profileResult.error.message);
          } else {
            console.warn("⚠️ getProfile returned null.");
          }
        }
      } catch (err) {
        console.error("❌ Error restoring user:", err);
      } finally {
        setRehydrated(true);
      }
    };

    restoreUser();
  }, [session]);


  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        session: session ?? null,
        rehydrated,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
