import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage, buildAcknowledgementReply } from "@/lib/twilio";

function normalisePhone(whatsappAddress: string): string {
  return whatsappAddress.replace(/^whatsapp:/, "");
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const from = form.get("From")?.toString();
  const body = form.get("Body")?.toString() ?? "";
  const messageSid = form.get("MessageSid")?.toString() ?? null;

  if (!from) {
    return NextResponse.json({ error: "Missing From field" }, { status: 400 });
  }

  const phone = normalisePhone(from);
  const supabase = createServiceClient();

  const { data: farmer } = await supabase
    .from("farmers")
    .select("id, full_name, language")
    .eq("phone_number", phone)
    .maybeSingle();

  await supabase.from("whatsapp_messages").insert({
    farmer_id: farmer?.id ?? null,
    direction: "inbound",
    message_body: body,
    language: farmer?.language ?? null,
    twilio_sid: messageSid,
    status: "received",
  });

  if (farmer) {
    const reply = buildAcknowledgementReply(farmer.full_name.split(" ")[0], farmer.language);
    const result = await sendWhatsAppMessage(phone, reply);
    await supabase.from("whatsapp_messages").insert({
      farmer_id: farmer.id,
      direction: "outbound",
      message_body: reply,
      language: farmer.language,
      twilio_sid: result.sid ?? null,
      status: result.success ? "sent" : "failed",
    });
  }

  return new NextResponse("<Response></Response>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
