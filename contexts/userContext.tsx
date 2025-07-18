import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import { UserProfileData } from '@/types/UserProfileData';
import { getProfileById } from '@/services/sbUserService';
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserContextType {
  user: UserProfileData | null;
  rehydrated: boolean;
  
}

export const UserContext = createContext<UserContextType>({
  user: null,
  rehydrated: false,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [rehydrated, setRehydrated] = useState(false);

  const loadUserProfile = async (userId: string | undefined) => {
    if (!userId) {
      setUser(null);
      return;
    }

    try {
      const result = await getProfileById(userId);
      if (result?.data) {
        setUser(result.data);
        await AsyncStorage.setItem("currentUserId", userId);
      } else {
        console.warn("⚠️ No profile data found");
        setUser(null);
      }
    } catch (err) {
      console.error("❌ Failed to load user profile", err);
      setUser(null);
    }
  };

  useEffect(() => {
    const restore = async () => {
      await supabase.auth.getSession();
      const { data, error } = await supabase.auth.getSession();
      console.log("🔁 [UserContext] restore():", data.session);

      if (error) {
        console.error("❌ Failed to get session", error);
      }
      
      await loadUserProfile(data.session?.user?.id);
      setRehydrated(true);
    };

    restore();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🌀 Auth state changed: ${event}`, session);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await loadUserProfile(session?.user?.id);
        setRehydrated(true); // ✅ In case restore missed it
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
        setRehydrated(true);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, rehydrated }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
