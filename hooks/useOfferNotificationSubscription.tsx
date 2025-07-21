import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { supabase } from "@/supabase";
import { useUser } from "@/contexts/userContext";

export function useOfferNotificationSubscription() {
  const { user } = useUser();
  const [notificationCount, setNotificationCount] = useState(0);
  const appState = useRef(AppState.currentState);
  const channelRef = useRef<any>(null);

  const fetchUnseenOffers = async (context: string) => {
    // console.log(`📥 [${context}] Fetching unseen offers...`);
    const { data, error } = await supabase
      .from("user_offer_candidates")
      .select("id")
      .eq("user_id", user?.id)
      .is("seen_at", null);

    if (error) {
      console.error(`❌ [${context}] Error fetching unseen offers:`, error);
      return;
    }

    // console.log(`✅ [${context}] Unseen offers: ${data.length}`);
    setNotificationCount(data.length);
  };

  const subscribeToChanges = async () => {
    if (!user?.id) return;

    // Clean old
    if (channelRef.current) {
      console.log("♻️ Removing old channel...");
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Brief delay to avoid race condition
    await new Promise((resolve) => setTimeout(resolve, 300));

    const channelName = `user-offer-sub-${user.id}-${Date.now()}`;
    console.log("🔔 Subscribing to realtime updates for user:", user.id);

    const channel = supabase.channel(channelName);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_offer_candidates",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("🔄 [subscription] Change detected:", payload.eventType, payload.new || payload.old);
          await fetchUnseenOffers("subscription");
        }
      )
      .on("system", { event: "SUBSCRIBED" }, (ctx) => {
        // console.log("📡 [subscription] Channel status: SUBSCRIBED", ctx);
      })
      .on("system", { event: "CLOSED" }, (ctx) => {
        // console.warn("📡 [subscription] Channel CLOSED", ctx);
      })
      .on("system", { event: "CHANNEL_ERROR" }, (ctx) => {
        // console.error("❌ [subscription] CHANNEL_ERROR:", ctx);
      });

    await channel.subscribe();
    channelRef.current = channel;
  };



  useEffect(() => {
    if (!user?.id) return;

    fetchUnseenOffers("initial");
    subscribeToChanges();

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("🌅 App foregrounded — refetch + resubscribe");

        await fetchUnseenOffers("foreground");

        console.warn("🧯 Removing all stale realtime channels...");
        await supabase.removeAllChannels();

        await subscribeToChanges(); // Always resubscribe to force a fresh socket
      }

      appState.current = nextAppState;
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      console.log("🧹 Cleaning up subscription hook");
      sub.remove();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [user?.id]);

  return {
    notificationCount,
    hasNewNotifications: notificationCount > 0,
  };
}
