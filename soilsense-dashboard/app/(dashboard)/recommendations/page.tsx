"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ChevronDown, ChevronUp, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";
import { SkeletonBlock } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/DataTable";
import { useDashboardStore } from "@/store/dashboard";
import { LANGUAGE_NAMES, cropLabel, type ActionItem, type RecommendationAlert, type Language } from "@/types";
import { formatDateTime, cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const URGENCY_TONE: Record<ActionItem["urgency"], "red" | "orange" | "green"> = {
  immediate: "red",
  soon: "orange",
  monitor: "green",
};

const FILTER_CHIPS = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "not_sent", label: "Not Sent" },
];

export interface RecommendationRow {
  id: string;
  created_at: string;
  crop: string;
  language: string;
  recommendation_text: string;
  action_items: ActionItem[] | null;
  alerts: RecommendationAlert[] | null;
  delivered_via_whatsapp: boolean;
  farmer: { id: string; full_name: string; phone_number: string; language: string } | null;
  plot: { id: string; plot_name: string; crop_other: string | null } | null;
}

async function fetchRecommendations(): Promise<RecommendationRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_recommendations")
    .select("id, created_at, crop, language, recommendation_text, action_items, alerts, delivered_via_whatsapp, farmer:farmers(id, full_name, phone_number, language), plot:plots(id, plot_name, crop_other)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as RecommendationRow[];
}

export default function RecommendationsPage() {
  const addToast = useDashboardStore((s) => s.addToast);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);

  const { data, error, isLoading, mutate } = useSWR("recommendations-list", fetchRecommendations);

  const filtered = useMemo(() => {
    let result = data ?? [];
    if (filter === "sent") result = result.filter((r) => r.delivered_via_whatsapp);
    if (filter === "not_sent") result = result.filter((r) => !r.delivered_via_whatsapp);
    return result;
  }, [data, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([id]) => id);
  const selectableRows = pageData.filter((r) => !r.delivered_via_whatsapp && r.farmer);

  function toggleExpand(id: string) {
    setExpanded((s) => ({ ...s, [id]: !s[id] }));
  }

  function toggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function toggleSelectAll() {
    const allSelected = selectableRows.length > 0 && selectableRows.every((r) => selected[r.id]);
    setSelected((s) => {
      const next = { ...s };
      selectableRows.forEach((r) => { next[r.id] = !allSelected; });
      return next;
    });
  }

  async function handleBulkSend() {
    setBulkSending(true);
    try {
      const targets = filtered.filter((r) => selected[r.id] && r.farmer);
      let successCount = 0;
      for (const rec of targets) {
        const res = await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ farmer_id: rec.farmer!.id, recommendation_id: rec.id }),
        });
        if (res.ok) successCount++;
      }
      addToast({
        variant: successCount === targets.length ? "success" : "info",
        title: "Bulk send complete",
        description: `${successCount} of ${targets.length} messages sent successfully.`,
      });
      setSelected({});
      setBulkOpen(false);
      mutate();
    } catch (e) {
      addToast({ variant: "error", title: "Bulk send failed", description: e instanceof Error ? e.message : "An unexpected error occurred" });
    } finally {
      setBulkSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-ink-dark">Recommendations</h2>
        <Button onClick={() => setBulkOpen(true)} disabled={selectedIds.length === 0}>
          <Send className="h-4 w-4" />
          Bulk Send WhatsApp ({selectedIds.length})
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => { setFilter(chip.value); setPage(1); }}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
              filter === chip.value ? "bg-primary text-white border-primary" : "bg-white text-ink-grey border-gray-300 hover:bg-gray-50"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-20 w-full" />)}
        </div>
      ) : error ? (
        <ErrorCard message={error.message} onRetry={() => mutate()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No recommendations found" description="AI-generated recommendations will appear here once readings are analysed." />
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-ink-grey px-1">
            <input
              type="checkbox"
              className="accent-primary"
              checked={selectableRows.length > 0 && selectableRows.every((r) => selected[r.id])}
              onChange={toggleSelectAll}
            />
            Select all sendable on this page
          </div>

          <div className="space-y-3">
            {pageData.map((rec) => (
              <Card key={rec.id} className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="accent-primary mt-1.5"
                    disabled={rec.delivered_via_whatsapp || !rec.farmer}
                    checked={!!selected[rec.id]}
                    onChange={() => toggleSelect(rec.id)}
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        {rec.farmer ? (
                          <Link href={`/farmers/${rec.farmer.id}`} className="font-medium text-ink-dark hover:underline">{rec.farmer.full_name}</Link>
                        ) : (
                          <span className="font-medium text-ink-dark">Unknown farmer</span>
                        )}
                        <span className="text-ink-grey">·</span>
                        <span className="text-ink-grey">{cropLabel(rec.crop, rec.plot?.crop_other)}</span>
                        {rec.plot && <><span className="text-ink-grey">·</span><span className="text-ink-grey">{rec.plot.plot_name}</span></>}
                        <Badge tone="grey">{LANGUAGE_NAMES[(rec.language as Language) ?? "en"] ?? rec.language}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-grey">{formatDateTime(rec.created_at)}</span>
                        {rec.delivered_via_whatsapp ? (
                          <Badge tone="green"><CheckCircle2 className="h-3 w-3" />Sent</Badge>
                        ) : (
                          <Badge tone="grey">Not sent</Badge>
                        )}
                      </div>
                    </div>

                    <p className={cn("text-sm text-ink-dark", !expanded[rec.id] && "line-clamp-2")}>{rec.recommendation_text}</p>

                    {expanded[rec.id] && (
                      <div className="space-y-3 pt-1">
                        {rec.action_items && rec.action_items.length > 0 && (
                          <div className="space-y-1.5">
                            {rec.action_items.map((item, i) => (
                              <div key={i} className={cn("flex items-center justify-between text-xs border rounded-lg px-3 py-1.5", URGENCY_TONE[item.urgency] === "red" ? "bg-red-50 border-red-200" : URGENCY_TONE[item.urgency] === "orange" ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200")}>
                                <span className="text-ink-dark">{item.action}</span>
                                <span className="text-ink-grey">{item.timing}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {rec.alerts && rec.alerts.length > 0 && (
                          <div className="space-y-1.5">
                            {rec.alerts.map((alert, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-alert-orange">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                <span>{alert.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button onClick={() => toggleExpand(rec.id)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      {expanded[rec.id] ? <>Show less <ChevronUp className="h-3.5 w-3.5" /></> : <>Show more <ChevronDown className="h-3.5 w-3.5" /></>}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Send WhatsApp">
        <div className="space-y-4">
          <p className="text-sm text-ink-dark">
            You are about to send {selectedIds.length} recommendation{selectedIds.length === 1 ? "" : "s"} to farmers via WhatsApp. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkSend} loading={bulkSending}>
              <Send className="h-4 w-4" />
              Send {selectedIds.length} Message{selectedIds.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
