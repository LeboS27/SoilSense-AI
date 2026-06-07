import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateRecommendation } from "@/lib/claude";
import type { Language } from "@/types";

interface RecommendPayload {
  reading_id: string;
  language?: Language;
}

export async function POST(req: NextRequest) {
  let payload: RecommendPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.reading_id) {
    return NextResponse.json({ error: "reading_id is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: reading, error: readingError } = await supabase
    .from("soil_readings")
    .select("*")
    .eq("id", payload.reading_id)
    .single();
  if (readingError || !reading) {
    return NextResponse.json({ error: "Reading not found" }, { status: 404 });
  }

  let farmerName = "Farmer";
  let language: Language = payload.language ?? "en";
  if (reading.farmer_id) {
    const { data: farmer } = await supabase.from("farmers").select("full_name, language").eq("id", reading.farmer_id).maybeSingle();
    if (farmer) {
      farmerName = farmer.full_name;
      if (!payload.language) language = (["en", "sn", "nd"].includes(farmer.language) ? farmer.language : "en") as Language;
    }
  }

  let crop = "maize";
  let growthStage: string | null = null;
  if (reading.plot_id) {
    const { data: plot } = await supabase.from("plots").select("crop, growth_stage").eq("id", reading.plot_id).maybeSingle();
    if (plot) {
      crop = plot.crop;
      growthStage = plot.growth_stage;
    }
  }

  const generated = await generateRecommendation({
    crop,
    growthStage,
    farmerName,
    language,
    nitrogen: reading.nitrogen_mg_kg,
    phosphorus: reading.phosphorus_mg_kg,
    potassium: reading.potassium_mg_kg,
    ph: reading.ph,
    ec: reading.electrical_conductivity_ds_m,
    moisture: reading.moisture_percent,
    temperature: reading.temperature_celsius,
  });

  if (!generated) {
    return NextResponse.json({ error: "Could not generate a recommendation at this time. Please try again later." }, { status: 502 });
  }

  const { result, tokensUsed, model } = generated;

  const { data: recommendation, error: insertError } = await supabase
    .from("ai_recommendations")
    .insert({
      reading_id: reading.id,
      farmer_id: reading.farmer_id,
      plot_id: reading.plot_id,
      crop,
      language,
      recommendation_text: result.recommendation_text,
      action_items: result.action_items as unknown as never,
      alerts: result.alerts as unknown as never,
      tokens_used: tokensUsed,
      model_used: model,
    })
    .select()
    .single();

  if (insertError || !recommendation) {
    return NextResponse.json({ error: insertError?.message ?? "Failed to store recommendation" }, { status: 500 });
  }

  return NextResponse.json({ success: true, recommendation }, { status: 201 });
}
