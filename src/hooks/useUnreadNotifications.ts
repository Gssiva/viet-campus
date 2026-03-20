import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUnreadNotifications = () => {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_read", false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchCount();

    // Real-time subscription
    const channel = supabase
      .channel("notifications-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  return unreadCount;
};
