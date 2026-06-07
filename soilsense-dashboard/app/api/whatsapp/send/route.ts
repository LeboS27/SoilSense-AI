import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/twilio";

interface SendPayload {
  farmer_id: string;
  message?: string;
  recommendation_id?: string;
}

export async function POST(req: NextRequest) {
  let payload: SendPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.farmer_id) {
    return NextResponse.json({ error: "farmer_id is required" }, { status: 400 });
  }
  if (!payload.message && !payload.recommendation_id) {
    return NextResponse.json({ error: "Either message or recommendation_id is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: farmer, error: farmerError } = await supabase
    .from("farmers")
    .select("id, full_name, phone_number")
    .eq("id", payload.farmer_id)
    .single();
  if (farmerError || !farmer) {
    return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
  }

  let body = payload.message ?? "";
  let recommendationId: string | null = null;

  if (payload.recommendation_id) {
    const { data: recommendation, error: recError } = await supabase
      .from("ai_recommendations")
      .select("id, recommendation_text")
      .eq("id", payload.recommendation_id)
      .single();
    if (recError || !recommendation) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }
    body = recommendation.recommendation_text;
    recommendationId = recommendation.id;
  }

  const result = await sendWhatsAppMessage(farmer.phone_number, body);

  const { error: messageError } = await supabase.from("whatsapp_messages").insert({
    farmer_id: farmer.id,
    direction: "outbound",
    message_body: body,
    twilio_sid: result.sid ?? null,
    status: result.success ? "sent" : "failed",
  });
  if (messageError) console.error("Failed to record WhatsApp message:", messageError);

  if (recommendationId) {
    await supabase
      .from("ai_recommendations")
      .update({
        delivered_via_whatsapp: result.success,
        whatsapp_message_sid: result.sid ?? null,
        whatsapp_sent_at: result.success ? new Date().toISOString() : null,
      })
      .eq("id", recommendationId);
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Failed to send WhatsApp message" }, { status: 502 });
  }

  return NextResponse.json({ success: true, sid: result.sid }, { status: 200 });
}
