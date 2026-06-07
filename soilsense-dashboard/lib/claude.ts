import Anthropic from "@anthropic-ai/sdk";
import { getOptimalRange } from "@/lib/soil-thresholds";
import type { ActionItem, Language, RecommendationAlert } from "@/types";

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  sn: "Shona",
  nd: "Ndebele",
};

const SYSTEM_PROMPT =
  "You are SoilSense AI, an agricultural assistant helping smallholder farmers in Zimbabwe " +
  "improve their soil health and crop yields. You analyse soil readings and provide clear, " +
  "practical recommendations that farmers can act on immediately. Always respond in the " +
  "specified language. Always respond with valid JSON only — no markdown, no preamble.";

export interface ClaudePromptInput {
  crop: string;
  growthStage: string | null;
  farmerName: string;
  language: Language;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  ph: number | null;
  ec: number | null;
  moisture: number | null;
  temperature: number | null;
}

export interface ClaudeRecommendationResult {
  recommendation_text: string;
  action_items: ActionItem[];
  alerts: RecommendationAlert[];
  overall_status: "good" | "warning" | "critical";
}

function fmtRange(range: { min: number; max: number }): string {
  return `${range.min}–${range.max}`;
}

export function buildUserPrompt(input: ClaudePromptInput): string {
  const crop = input.crop;
  const n = getOptimalRange("nitrogen", crop);
  const p = getOptimalRange("phosphorus", crop);
  const k = getOptimalRange("potassium", crop);
  const ph = getOptimalRange("ph", crop);
  const ec = getOptimalRange("ec", crop);
  const moisture = getOptimalRange("moisture", crop);

  const languageName = LANGUAGE_NAMES[input.language];

  return `Analyse the following soil reading for a farmer growing ${crop} at ${input.growthStage ?? "unknown"} stage in Bulawayo, Zimbabwe.

Soil readings:
- Nitrogen: ${input.nitrogen} mg/kg (optimal for ${crop}: ${fmtRange(n)} mg/kg)
- Phosphorus: ${input.phosphorus} mg/kg (optimal: ${fmtRange(p)} mg/kg)
- Potassium: ${input.potassium} mg/kg (optimal: ${fmtRange(k)} mg/kg)
- pH: ${input.ph} (optimal for ${crop}: ${fmtRange(ph)})
- Electrical Conductivity: ${input.ec} dS/m (optimal: ${fmtRange(ec)} dS/m)
- Soil Moisture: ${input.moisture}% (optimal: ${fmtRange(moisture)}%)
- Soil Temperature: ${input.temperature}°C

Farmer name: ${input.farmerName}
Language for response: ${languageName} (${input.language})

Respond ONLY with a JSON object in this exact structure:
{
  "recommendation_text": "A 2–4 sentence plain-language summary in ${languageName} that the farmer can understand without any agronomic training. Start with the most urgent action. Use simple, direct language.",
  "action_items": [
    { "action": "specific thing to do", "urgency": "immediate|soon|monitor", "timing": "when to do it" }
  ],
  "alerts": [
    { "parameter": "parameter name", "level": "warning|critical", "message": "plain language alert" }
  ],
  "overall_status": "good|warning|critical"
}`;
}

function getAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/**
 * Calls Claude to generate a soil recommendation. Returns null (rather than
 * throwing) on any failure so the dashboard never crashes when the AI
 * service is unavailable — callers should handle the null case gracefully.
 */
export async function generateRecommendation(
  input: ClaudePromptInput
): Promise<{ result: ClaudeRecommendationResult; tokensUsed: number; model: string } | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not configured");
    return null;
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error("Claude response contained no text block");
      return null;
    }

    let parsed: ClaudeRecommendationResult;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      // Claude occasionally wraps JSON in markdown fences despite instructions
      const match = textBlock.text.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error("Could not parse JSON from Claude response:", textBlock.text);
        return null;
      }
      parsed = JSON.parse(match[0]);
    }

    const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

    return { result: parsed, tokensUsed, model: response.model };
  } catch (error) {
    console.error("Claude API call failed:", error);
    return null;
  }
}
