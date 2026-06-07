"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDashboardStore } from "@/store/dashboard";
import { getOverallStatus } from "@/lib/soil-thresholds";
import { cropLabel, type ReadingWithRelations } from "@/types";

interface UseRealtimeReadingsOptions {
  /** Called whenever a brand-new reading row is inserted (already enriched with farmer/plot). */
  onInsert?: (reading: ReadingWithRelations) => void;
}

/**
 * Subscribes to Supabase Realtime INSERT events on soil_readings.
 * For each new row it fetches the related farmer/plot/device, fires
 * the onInsert callback, and — if the reading is critical — pushes a
 * toast notification via the global dashboard store.
 */
export function useRealtimeReadings({ onInsert }: UseRealtimeReadingsOptions = {}) {
  const [latestId, setLatestId] = useState<string | null>(null);
  const addToast = useDashboardStore((s) => s.addToast);
  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("realtime-soil-readings")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "soil_readings" },
        async (payload) => {
          const row = payload.new as ReadingWithRelations;

          const [{ data: farmer }, { data: plot }, { data: device }] = await Promise.all([
            row.farmer_id
              ? supabase.from("farmers").select("id, full_name, phone_number, language").eq("id", row.farmer_id).maybeSingle()
              : Promise.resolve({ data: null }),
            row.plot_id
              ? supabase.from("plots").select("id, plot_name, crop, crop_other, growth_stage").eq("id", row.plot_id).maybeSingle()
              : Promise.resolve({ data: null }),
            row.device_id
              ? supabase.from("devices").select("id, serial_number").eq("id", row.device_id).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          const enriched: ReadingWithRelations = { ...row, farmer, plot, device };

          setLatestId(row.id);
          onInsertRef.current?.(enriched);

          const crop = plot?.crop ?? "maize";
          const status = getOverallStatus(enriched, crop);
          if (status === "critical") {
            addToast({
              variant: "critical",
              title: "Critical soil alert",
              description: `${farmer?.full_name ?? "A farmer"}'s ${cropLabel(crop, plot?.crop_other)} reading shows a critical level — review it now.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addToast]);

  return { latestId };
}
