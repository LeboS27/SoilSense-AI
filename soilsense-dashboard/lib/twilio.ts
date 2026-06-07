import twilio from "twilio";

export interface SendWhatsAppResult {
  success: boolean;
  sid?: string;
  error?: string;
}

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

/**
 * Sends a WhatsApp message via Twilio. Never throws — failures are reported
 * via the returned result object so callers can record status='failed'.
 */
export async function sendWhatsAppMessage(to: string, body: string): Promise<SendWhatsAppResult> {
  const client = getTwilioClient();
  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  if (!client) {
    const message = "Twilio is not configured (missing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)";
    console.error(message);
    return { success: false, error: message };
  }

  try {
    const message = await client.messages.create({
      from,
      to: `whatsapp:${to}`,
      body,
    });
    return { success: true, sid: message.sid };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown Twilio error";
    console.error("Twilio send failed:", error);
    return { success: false, error: errorMessage };
  }
}

const ACK_MESSAGES: Record<string, string> = {
  en: "Thank you {name}. Your message has been received by the SoilSense AI team.",
  sn: "Tatenda {name}. Meseji yenyu yagamuchirwa neSoilSense AI team.",
  nd: "Siyabonga {name}. Umlayezo wakho usufikile kwiqembu le-SoilSense AI.",
};

export function buildAcknowledgementReply(name: string, language: string | null): string {
  const template = ACK_MESSAGES[language ?? "en"] ?? ACK_MESSAGES.en;
  return template.replace("{name}", name);
}
