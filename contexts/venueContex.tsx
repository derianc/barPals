import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getVenuesForProfile } from "@/services/sbVenueService";
import { useUser } from "./userContext";
import { Venue } from "@/types/Venue";

interface VenueContextProps {
    selectedVenue: Venue | null;
    setSelectedVenue: (venue: Venue) => void;
    allVenues: Venue[];
    setAllVenues: (venues: Venue[]) => void;
    selectedVenueHash: string | null;
}

const VenueContext = createContext<VenueContextProps | undefined>(undefined);

export const VenueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedVenue, setSelectedVenueState] = useState<Venue | null>(null);
    const [allVenues, setAllVenues] = useState<Venue[]>([]);
    const selectedVenueHash = selectedVenue?.venue_hash ?? null;
    const { user, rehydrated } = useUser();

    useEffect(() => {
        const isOwner = user?.role === "owner";
        if (!isOwner || !rehydrated || !user?.id) {
            console.log("⏳ Waiting for owner role and user ID...");
            return;
        }

        const loadVenues = async () => {
            console.log("📡 Fetching venues for user:", user.id);
            const data = await getVenuesForProfile(user.id);
            // console.log("📦 Venues fetched:", data.length, data);
            setAllVenues(data);

            try {
                const stored = await AsyncStorage.getItem("selectedVenue");

                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        const freshMatch = data.find(v => v.id === parsed.id);

                        if (freshMatch) {
                            // 🧠 Use fresh data instead of stale cache
                            console.log("✅ Replacing stale selectedVenue with updated info:", freshMatch);
                            setSelectedVenueState(freshMatch);
                            await AsyncStorage.setItem("selectedVenue", JSON.stringify(freshMatch));
                            return;
                        }
                    } catch (err) {
                        console.warn("⚠️ Failed to parse stored selectedVenue. Clearing it.", err);
                        await AsyncStorage.removeItem("selectedVenue");
                    }
                }
            } catch (storageError) {
                console.error("❌ Error accessing AsyncStorage:", storageError);
            }

            if (data.length > 0) {
                console.log("🔁 Setting fallback selectedVenue to first venue in list:", data[0]);
                setSelectedVenueState(data[0]);
                await AsyncStorage.setItem("selectedVenue", JSON.stringify(data[0]));
            } else {
                console.warn("🚫 No venues available to fallback to.");
            }
        };

        loadVenues();
    }, [rehydrated, user?.id, user?.role]);

    const setSelectedVenue = (venue: Venue) => {
        setSelectedVenueState(venue);
        AsyncStorage.setItem("selectedVenue", JSON.stringify(venue));
    };

    return (
        <VenueContext.Provider value={{ selectedVenue, selectedVenueHash, setSelectedVenue, allVenues, setAllVenues }}>
            {children}
        </VenueContext.Provider>
    );
};

export const useVenue = (): VenueContextProps => {
    const context = useContext(VenueContext);
    if (!context) throw new Error("useVenue must be used within a VenueProvider");
    return context;
};
