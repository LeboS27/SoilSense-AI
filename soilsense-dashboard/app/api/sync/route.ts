import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!process.env.DEVICE_INGEST_API_KEY || apiKey !== process.env.DEVICE_INGEST_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { device_serial?: string; battery_level?: number | null; signal_strength?: number | null; offline_readings_count?: number };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.device_serial) {
    return NextResponse.json({ error: "device_serial is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select("id")
    .eq("serial_number", payload.device_serial)
    .maybeSingle();

  if (deviceError || !device) {
    return NextResponse.json({ error: `Unknown device serial: ${payload.device_serial}` }, { status: 404 });
  }

  const update: Record<string, unknown> = {
    last_sync_at: new Date().toISOString(),
    status: "deployed",
  };
  if (payload.battery_level != null) update.battery_level = payload.battery_level;
  if (payload.signal_strength != null) update.signal_strength = payload.signal_strength;
  if (payload.offline_readings_count != null) update.offline_readings_count = payload.offline_readings_count;

  const { error: updateError } = await supabase.from("devices").update(update as never).eq("id", device.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
