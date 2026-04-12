"use client";

import { useEffect, useRef } from "react";
import { getLocalHistory, clearLocalHistory } from "@/lib/localHistory";
import { syncHistoryAction } from "@/app/actions/history";

interface Props {
  userId?: string;
}

export default function HistorySync({ userId }: Props) {
  const isSyncing = useRef(false);

  useEffect(() => {
    // Only sync if user is logged in and not already syncing
    if (!userId || isSyncing.current) return;

    const syncLocalToDB = async () => {
      try {
        const localData = getLocalHistory();
        if (localData && localData.length > 0) {
          isSyncing.current = true;
          console.log(`[HistorySync] Syncing ${localData.length} items to database...`);
          
          const result = await syncHistoryAction(localData);
          
          if (result.success) {
            console.log("[HistorySync] Sync successful. Clearing local history.");
            clearLocalHistory();
          } else {
            console.error("[HistorySync] Sync failed:", result.error);
          }
        }
      } catch (err) {
        console.error("[HistorySync] Error during sync:", err);
      } finally {
        isSyncing.current = false;
      }
    };

    syncLocalToDB();
  }, [userId]);

  // This component doesn't render anything
  return null;
}
