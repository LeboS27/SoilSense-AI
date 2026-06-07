"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/dashboard";
import type { Device } from "@/types";

/**
 * Subscribes to Supabase Realtime UPDATE events on devices. When a
 * device's last_sync_at changes (i.e. it just synced), shows a toast.
 */
export function useDeviceStatus() {
  const addToast = useDashboardStore((s) => s.addToast);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("realtime-device-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "devices" },
        (payload) => {
          const oldRow = payload.old as Partial<Device>;
          const newRow = payload.new as Device;

          if (newRow.last_sync_at && newRow.last_sync_at !== oldRow.last_sync_at) {
            addToast({
              variant: "info",
              title: `Device ${newRow.serial_number} just synced`,
              description: newRow.offline_readings_count > 0
                ? `${newRow.offline_readings_count} offline readings pending`
                : "All readings are up to date",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addToast]);
}
