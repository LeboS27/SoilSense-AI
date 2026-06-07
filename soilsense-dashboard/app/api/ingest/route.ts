import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface IngestPayload {
  device_serial: string;
  reading_taken_at: string;
  nitrogen_mg_kg?: number | null;
  phosphorus_mg_kg?: number | null;
  potassium_mg_kg?: number | null;
  ph?: number | null;
  electrical_conductivity_ds_m?: number | null;
  moisture_percent?: number | null;
  temperature_celsius?: number | null;
  was_offline_sync?: boolean;
  battery_level?: number | null;
  signal_strength?: number | null;
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!process.env.DEVICE_INGEST_API_KEY || apiKey !== process.env.DEVICE_INGEST_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: IngestPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.device_serial || !payload.reading_taken_at) {
    return NextResponse.json({ error: "device_serial and reading_taken_at are required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select("id, farmer_id")
    .eq("serial_number", payload.device_serial)
    .maybeSingle();

  if (deviceError || !device) {
    return NextResponse.json({ error: `Unknown device serial: ${payload.device_serial}` }, { status: 404 });
  }

  let plotId: string | null = null;
  if (device.farmer_id) {
    const { data: plot } = await supabase
      .from("plots")
      .select("id")
      .eq("farmer_id", device.farmer_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    plotId = plot?.id ?? null;
  }

  const { data: reading, error: readingError } = await supabase
    .from("soil_readings")
    .insert({
      device_id: device.id,
      farmer_id: device.farmer_id,
      plot_id: plotId,
      nitrogen_mg_kg: payload.nitrogen_mg_kg ?? null,
      phosphorus_mg_kg: payload.phosphorus_mg_kg ?? null,
      potassium_mg_kg: payload.potassium_mg_kg ?? null,
      ph: payload.ph ?? null,
      electrical_conductivity_ds_m: payload.electrical_conductivity_ds_m ?? null,
      moisture_percent: payload.moisture_percent ?? null,
      temperature_celsius: payload.temperature_celsius ?? null,
      raw_payload: payload as unknown as never,
      was_offline_sync: payload.was_offline_sync ?? false,
      reading_taken_at: payload.reading_taken_at,
    })
    .select()
    .single();

  if (readingError || !reading) {
    return NextResponse.json({ error: readingError?.message ?? "Failed to store reading" }, { status: 500 });
  }

  const deviceUpdate: Record<string, unknown> = {
    last_sync_at: new Date().toISOString(),
    status: "deployed",
  };
  if (payload.battery_level != null) deviceUpdate.battery_level = payload.battery_level;
  if (payload.signal_strength != null) deviceUpdate.signal_strength = payload.signal_strength;
  if (payload.was_offline_sync) {
    deviceUpdate.offline_readings_count = 0;
  }
  await supabase.from("devices").update(deviceUpdate as never).eq("id", device.id);

  return NextResponse.json({ success: true, reading_id: reading.id }, { status: 201 });
}
