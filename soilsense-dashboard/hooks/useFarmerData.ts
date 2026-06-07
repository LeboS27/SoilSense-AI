"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { Farmer, Plot, Device, AIRecommendation, WhatsAppMessage } from "@/types";

export interface FarmerProfileData {
  farmer: Farmer;
  plots: Plot[];
  device: Device | null;
  recommendations: AIRecommendation[];
  messages: WhatsAppMessage[];
}

async function fetchFarmerProfile(id: string): Promise<FarmerProfileData> {
  const supabase = createClient();

  const [{ data: farmer, error: farmerError }, { data: plots }, { data: device }, { data: recommendations }, { data: messages }] =
    await Promise.all([
      supabase.from("farmers").select("*").eq("id", id).single(),
      supabase.from("plots").select("*").eq("farmer_id", id).order("created_at", { ascending: false }),
      supabase.from("devices").select("*").eq("farmer_id", id).maybeSingle(),
      supabase.from("ai_recommendations").select("*").eq("farmer_id", id).order("created_at", { ascending: false }).limit(3),
      supabase.from("whatsapp_messages").select("*").eq("farmer_id", id).order("created_at", { ascending: true }),
    ]);

  if (farmerError || !farmer) throw farmerError ?? new Error("Farmer not found");

  return {
    farmer,
    plots: plots ?? [],
    device: device ?? null,
    recommendations: recommendations ?? [],
    messages: messages ?? [],
  };
}

export function useFarmerData(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(id ? ["farmer-profile", id] : null, () => fetchFarmerProfile(id as string));

  return {
    data,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    mutate,
  };
}
