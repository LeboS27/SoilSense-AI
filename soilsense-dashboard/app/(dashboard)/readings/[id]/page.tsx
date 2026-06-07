"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, WifiOff, Wifi } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorCard } from "@/components/ui/StateViews";
import { SoilParameterGauge, HealthScoreGauge } from "@/components/dashboard/SoilParameterGauge";
import { ParameterTrendChart } from "@/components/readings/ParameterTrendChart";
import { RecommendationCard } from "@/components/readings/RecommendationCard";
import { formatDateTime, cn } from "@/lib/utils";
import { GROWTH_STAGE_OPTIONS, cropLabel, type Language, type ReadingWithRelations } from "@/types";
import { getHealthScore, PARAMETER_LABELS, type SoilParameter } from "@/lib/soil-thresholds";
import type { AIRecommendation, SoilReading } from "@/types";

const PARAMETER_FIELDS: { param: SoilParameter; field: keyof SoilReading }[] = [
  { param: "nitrogen", field: "nitrogen_mg_kg" },
  { param: "phosphorus", field: "phosphorus_mg_kg" },
  { param: "potassium", field: "potassium_mg_kg" },
  { param: "ph", field: "ph" },
  { param: "ec", field: "electrical_conductivity_ds_m" },
  { param: "moisture", field: "moisture_percent" },
];

async function fetchReadingDetail(id: string) {
  const supabase = createClient();
  const { data: reading, error } = await supabase
    .from("soil_readings")
    .select(
      "*, farmer:farmers(id, full_name, phone_number, language), plot:plots(id, plot_name, crop, crop_other, growth_stage), device:devices(id, serial_number)"
    )
    .eq("id", id)
    .single();
  if (error || !reading) throw error ?? new Error("Reading not found");

  const typedReading = reading as unknown as ReadingWithRelations;

  const { data: recommendation } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("reading_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let plotHistory: SoilReading[] = [];
  if (typedReading.plot_id) {
    const { data } = await supabase
      .from("soil_readings")
      .select("*")
      .eq("plot_id", typedReading.plot_id)
      .order("reading_taken_at", { ascending: false })
      .limit(10);
    plotHistory = data ?? [];
  }

  return { reading: typedReading, recommendation: recommendation as AIRecommendation | null, plotHistory };
}

export default function ReadingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data, error, isLoading, mutate } = useSWR(["reading-detail", id], () => fetchReadingDetail(id));

  const handleGenerate = useCallback(
    async (language: Language) => {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reading_id: id, language }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate recommendation");
      await mutate();
    },
    [id, mutate]
  );

  const handleLanguageChange = useCallback(
    async (language: Language) => {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reading_id: id, language }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to translate recommendation");
      await mutate();
    },
    [id, mutate]
  );

  if (isLoading) {
    return <LoadingSpinner label="Loading reading…" />;
  }

  if (error || !data) {
    return <ErrorCard message={error?.message ?? "Reading not found"} onRetry={() => mutate()} />;
  }

  const { reading, recommendation, plotHistory } = data;
  const crop = reading.plot?.crop ?? "maize";
  const healthScore = getHealthScore(reading, crop);
  const growthStage = GROWTH_STAGE_OPTIONS.find((g) => g.value === reading.plot?.growth_stage)?.label ?? "—";

  return (
    <div className="space-y-5">
      <button onClick={() => router.push("/readings")} className="inline-flex items-center gap-1.5 text-sm text-ink-grey hover:text-ink-dark">
        <ArrowLeft className="h-4 w-4" />
        Back to Readings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          <Card title="Soil Parameters">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PARAMETER_FIELDS.map(({ param, field }) => (
                <SoilParameterGauge
                  key={param}
                  parameter={param}
                  label={PARAMETER_LABELS[param].label}
                  unit={PARAMETER_LABELS[param].unit}
                  value={(reading[field] as number | null) ?? null}
                  crop={crop}
                />
              ))}
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs font-medium text-ink-grey uppercase tracking-wide">Temperature</p>
                <p className="text-2xl font-bold text-ink-dark mt-1">
                  {reading.temperature_celsius ?? "—"}
                  <span className="text-sm font-normal text-ink-grey ml-1">°C</span>
                </p>
                <p className="text-xs text-ink-grey mt-3">Soil temperature at time of reading</p>
              </div>
              <HealthScoreGauge score={healthScore} />
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-ink-grey">Device</p>
                <p className="font-medium text-ink-dark font-mono">{reading.device?.serial_number ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-ink-grey">Sync Type</p>
                <p className="font-medium text-ink-dark inline-flex items-center gap-1.5">
                  {reading.was_offline_sync ? <WifiOff className="h-3.5 w-3.5 text-alert-orange" /> : <Wifi className="h-3.5 w-3.5 text-primary" />}
                  {reading.was_offline_sync ? "Offline" : "Live"}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-grey">Taken At</p>
                <p className="font-medium text-ink-dark">{formatDateTime(reading.reading_taken_at)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-grey">Synced At</p>
                <p className="font-medium text-ink-dark">{formatDateTime(reading.synced_at)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-grey">Farmer</p>
                <p className="font-medium text-ink-dark">{reading.farmer?.full_name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-ink-grey">Plot</p>
                <p className="font-medium text-ink-dark">{reading.plot?.plot_name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-ink-grey">Crop</p>
                <p className="font-medium text-ink-dark">{cropLabel(crop, reading.plot?.crop_other)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-grey">Growth Stage</p>
                <p className={cn("font-medium text-ink-dark")}>{growthStage}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Card title="AI Recommendation">
            <RecommendationCard
              recommendation={recommendation}
              farmer={reading.farmer}
              readingId={id}
              onGenerate={handleGenerate}
              onLanguageChange={handleLanguageChange}
              onSent={() => mutate()}
            />
          </Card>

          <Card title="Plot History">
            <ParameterTrendChart readings={plotHistory} title="" />
          </Card>
        </div>
      </div>
    </div>
  );
}
