import type { Database } from "@/lib/supabase/types";

export type Farmer = Database["public"]["Tables"]["farmers"]["Row"];
export type Plot = Database["public"]["Tables"]["plots"]["Row"];
export type Device = Database["public"]["Tables"]["devices"]["Row"];
export type SoilReading = Database["public"]["Tables"]["soil_readings"]["Row"];
export type AIRecommendation = Database["public"]["Tables"]["ai_recommendations"]["Row"];
export type RevenueRecord = Database["public"]["Tables"]["revenue_records"]["Row"];
export type WhatsAppMessage = Database["public"]["Tables"]["whatsapp_messages"]["Row"];

export type Language = "en" | "sn" | "nd";

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  sn: "Shona",
  nd: "Ndebele",
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  en: "🇬🇧 EN",
  sn: "SN",
  nd: "ND",
};

export const CROP_OPTIONS = [
  { value: "maize", label: "Maize" },
  { value: "tomatoes", label: "Tomatoes" },
  { value: "sweet_potatoes", label: "Sweet Potatoes" },
  { value: "beetroot", label: "Beetroot" },
  { value: "cabbage", label: "Cabbage" },
  { value: "other", label: "Other" },
] as const;

export const GROWTH_STAGE_OPTIONS = [
  { value: "germination", label: "Germination" },
  { value: "vegetative", label: "Vegetative" },
  { value: "flowering", label: "Flowering" },
  { value: "fruiting", label: "Fruiting" },
  { value: "harvest", label: "Harvest" },
] as const;

export interface ActionItem {
  action: string;
  urgency: "immediate" | "soon" | "monitor";
  timing: string;
}

export interface RecommendationAlert {
  parameter: string;
  level: "warning" | "critical";
  message: string;
}

/** A soil_reading row joined with the bits of farmer/plot needed for display. */
export interface ReadingWithRelations extends SoilReading {
  farmer?: Pick<Farmer, "id" | "full_name" | "phone_number" | "language"> | null;
  plot?: Pick<Plot, "id" | "plot_name" | "crop" | "crop_other" | "growth_stage"> | null;
  device?: Pick<Device, "id" | "serial_number"> | null;
}

export function cropLabel(crop: string, cropOther?: string | null): string {
  if (crop === "other") return cropOther || "Other";
  const found = CROP_OPTIONS.find((c) => c.value === crop);
  return found ? found.label : crop;
}
