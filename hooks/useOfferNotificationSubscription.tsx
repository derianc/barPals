// hooks/useOfferNotificationSubscription.ts
import { useEffect, useState } from "react";
import { supabase } from "@/supabase";
import { useUser } from "@/contexts/userContext";

export function useOfferNotificationSubscription() {
  const { user } = useUser();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      console.warn("⚠️ [useOfferNotificationSubscription] Skipped — no user ID found");
      return;
    }

    console.log("🔔 [useOfferNotificationSubscription] Subscribing for user:", user.id);

    // Initial fetch
    const fetchInitial = async () => {
      console.log("📥 [fetchInitial] Fetching unseen offers...");
      const { data, error } = await supabase
        .from("user_offer_candidates")
        .select("id")
        .eq("user_id", user.id)
        .is("seen_at", null);

      if (error) {
        console.error("❌ [fetchInitial] Failed to fetch unseen offers:", error);
        return;
      }

      console.log(`✅ [fetchInitial] Initial unseen offer count: ${data.length}`);
      setNotificationCount(data.length);
    };

    fetchInitial();

    // Live subscription
    const channel = supabase
      .channel("realtime:offer_notifications")
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

          // Refetch unseen count
          console.log("🔁 [subscription] Refetching unseen offer count...");
          const { data, error } = await supabase
            .from("user_offer_candidates")
            .select("id")
            .eq("user_id", user.id)
            .is("seen_at", null);

          if (error) {
            console.error("❌ [subscription] Failed to refetch unseen offers:", error);
            return;
          }

          console.log(`✅ [subscription] Updated unseen offer count: ${data.length}`);
          setNotificationCount(data.length);
        }
      )
      .subscribe((status) => {
        console.log("📡 [subscription] Channel status:", status);
      });

    return () => {
      console.log("❌ [useOfferNotificationSubscription] Unsubscribing...");
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    notificationCount,
    hasNewNotifications: notificationCount > 0,
  };
}
