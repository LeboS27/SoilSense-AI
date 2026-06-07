"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useDashboardStore } from "@/store/dashboard";
import { formatDateTime, cn } from "@/lib/utils";
import { LANGUAGE_NAMES, type ActionItem, type AIRecommendation, type Farmer, type Language, type RecommendationAlert } from "@/types";

const URGENCY_TONE: Record<ActionItem["urgency"], string> = {
  immediate: "bg-red-50 border-red-200 text-alert-red",
  soon: "bg-orange-50 border-orange-200 text-alert-orange",
  monitor: "bg-green-50 border-green-200 text-primary",
};

export function RecommendationCard({
  recommendation,
  farmer,
  readingId,
  onGenerate,
  onLanguageChange,
  onSent,
}: {
  recommendation: AIRecommendation | null;
  farmer: Pick<Farmer, "id" | "full_name" | "phone_number" | "language"> | null | undefined;
  readingId: string;
  onGenerate: (language: Language) => Promise<void>;
  onLanguageChange: (language: Language) => Promise<void>;
  onSent: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [switchingLang, setSwitchingLang] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const addToast = useDashboardStore((s) => s.addToast);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await onGenerate((farmer?.language as Language) ?? "en");
    } catch (e) {
      addToast({ variant: "error", title: "Could not generate recommendation", description: e instanceof Error ? e.message : undefined });
    } finally {
      setGenerating(false);
    }
  }

  async function handleLanguageChange(lang: Language) {
    if (!recommendation || lang === recommendation.language) return;
    setSwitchingLang(true);
    try {
      await onLanguageChange(lang);
    } catch (e) {
      addToast({ variant: "error", title: "Could not translate recommendation", description: e instanceof Error ? e.message : undefined });
    } finally {
      setSwitchingLang(false);
    }
  }

  async function handleSendWhatsApp() {
    if (!recommendation || !farmer) return;
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_id: farmer.id,
          message_body: recommendation.recommendation_text,
          reading_id: readingId,
          recommendation_id: recommendation.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to send WhatsApp message");
      addToast({ variant: "success", title: "Sent via WhatsApp", description: `Message delivered to ${farmer.full_name}` });
      setConfirmOpen(false);
      onSent();
    } catch (e) {
      addToast({ variant: "error", title: "WhatsApp send failed", description: e instanceof Error ? e.message : undefined });
    } finally {
      setSending(false);
    }
  }

  if (!recommendation) {
    return (
      <div className="text-center py-8">
        <Sparkles className="h-8 w-8 text-accent-gold mx-auto mb-3" />
        <p className="text-sm text-ink-grey mb-4">No AI recommendation has been generated for this reading yet.</p>
        <Button onClick={handleGenerate} loading={generating}>
          <Sparkles className="h-4 w-4" />
          Generate Recommendation
        </Button>
      </div>
    );
  }

  const actionItems = (recommendation.action_items as unknown as ActionItem[]) ?? [];
  const alerts = (recommendation.alerts as unknown as RecommendationAlert[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-gold" />
          <div>
            <p className="font-semibold text-ink-dark text-sm">Claude AI Recommendation</p>
            <p className="text-xs text-ink-grey">{recommendation.model_used ?? "claude-sonnet-4-20250514"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-grey">Language</span>
          <Select
            value={recommendation.language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            disabled={switchingLang}
            options={[
              { value: "en", label: "EN" },
              { value: "sn", label: "SN" },
              { value: "nd", label: "ND" },
            ]}
            className="w-20"
          />
        </div>
      </div>

      {switchingLang ? (
        <LoadingSpinner label={`Translating to ${LANGUAGE_NAMES[(["en", "sn", "nd"].includes(recommendation.language) ? recommendation.language : "en") as Language]}…`} />
      ) : (
        <p className="text-sm text-ink-dark leading-relaxed bg-surface-bg rounded-lg p-4 border border-gray-100">
          {recommendation.recommendation_text}
        </p>
      )}

      {actionItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ink-grey uppercase tracking-wide">Action Items</p>
          {actionItems.map((item, i) => (
            <div key={i} className={cn("rounded-lg border px-3 py-2.5 flex items-start gap-2.5", URGENCY_TONE[item.urgency])}>
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.action}</p>
                <p className="text-xs opacity-80 mt-0.5">
                  {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)} &middot; {item.timing}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="rounded-lg border border-red-100 overflow-hidden">
          <button
            onClick={() => setAlertsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-red-50 text-alert-red text-sm font-medium"
          >
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts ({alerts.length})
            </span>
            {alertsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {alertsOpen && (
            <div className="divide-y divide-red-50">
              {alerts.map((alert, i) => (
                <div key={i} className="px-3 py-2.5 text-sm">
                  <p className="font-medium text-alert-red">
                    {alert.parameter} &middot; {alert.level}
                  </p>
                  <p className="text-ink-grey text-xs mt-0.5">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-gray-100">
        <p className="text-xs text-ink-grey">
          {recommendation.tokens_used != null && <>Tokens used: {recommendation.tokens_used} &middot; </>}
          Generated {formatDateTime(recommendation.created_at)}
        </p>

        {recommendation.delivered_via_whatsapp ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Sent via WhatsApp{recommendation.whatsapp_sent_at ? ` · ${formatDateTime(recommendation.whatsapp_sent_at)}` : ""}
          </span>
        ) : (
          <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={!farmer}>
            <Send className="h-4 w-4" />
            Send via WhatsApp
          </Button>
        )}
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Send via WhatsApp">
        {farmer && (
          <div className="space-y-3">
            <div className="text-sm space-y-1">
              <p>
                <span className="text-ink-grey">To:</span> <span className="font-medium">{farmer.full_name}</span> ({farmer.phone_number})
              </p>
              <p>
                <span className="text-ink-grey">Language:</span>{" "}
                <span className="font-medium">{LANGUAGE_NAMES[(["en", "sn", "nd"].includes(farmer.language) ? farmer.language : "en") as Language]}</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-grey uppercase tracking-wide mb-1.5">Message Preview</p>
              <p className="text-sm bg-surface-bg rounded-lg p-3 border border-gray-100">{recommendation.recommendation_text}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendWhatsApp} loading={sending}>
                <Send className="h-4 w-4" />
                Confirm & Send
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
