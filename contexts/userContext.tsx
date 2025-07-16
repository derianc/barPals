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

    const result = await getProfileById(userId);
    if (result?.data) {
      setUser(result.data);
      await AsyncStorage.setItem("currentUserId", userId);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const restore = async () => {
      const { data } = await supabase.auth.getSession();
      console.log("🔁 [UserContext] restore():", data.session);
      
      await loadUserProfile(data.session?.user?.id);
      setRehydrated(true);
    };

    restore();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log(`🌀 Auth state changed: ${_event}`, session);
      await loadUserProfile(session?.user?.id);
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
