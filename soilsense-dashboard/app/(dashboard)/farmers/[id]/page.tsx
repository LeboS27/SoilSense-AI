"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, Plus, MapPin, Phone, Globe, Users, Calendar, DollarSign, Cpu, Send, ChevronDown, ChevronUp, Check, CheckCheck, Clock, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFarmerData } from "@/hooks/useFarmerData";
import { useDashboardStore } from "@/store/dashboard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";
import { SkeletonBlock, SkeletonCard } from "@/components/ui/LoadingSpinner";
import { PlotFormModal, type PlotFormValues } from "@/components/farmers/PlotForm";
import { ParameterTrendChart } from "@/components/readings/ParameterTrendChart";
import { SoilHealthRadar, type RadarAxisValue } from "@/components/charts/SoilHealthRadar";
import { LANGUAGE_FLAGS, cropLabel, type Language, type SoilReading, type Plot, type Device } from "@/types";
import { formatCurrency, formatDate, formatDateTime, timeAgo, cn } from "@/lib/utils";
import { getOptimalRange } from "@/lib/soil-thresholds";

const SUBSCRIPTION_TONE: Record<string, "green" | "grey" | "red"> = {
  active: "green",
  paused: "grey",
  cancelled: "red",
};

const SUBSCRIPTION_LABEL: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
};

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "readings", label: "Readings History" },
  { value: "whatsapp", label: "WhatsApp Log" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

async function fetchFarmerReadings(farmerId: string): Promise<SoilReading[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("soil_readings")
    .select("*")
    .eq("farmer_id", farmerId)
    .order("reading_taken_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return data ?? [];
}

const RADAR_PARAMS: { key: "nitrogen_mg_kg" | "phosphorus_mg_kg" | "potassium_mg_kg" | "ph"; label: string; param: "nitrogen" | "phosphorus" | "potassium" | "ph" }[] = [
  { key: "nitrogen_mg_kg", label: "N", param: "nitrogen" },
  { key: "phosphorus_mg_kg", label: "P", param: "phosphorus" },
  { key: "potassium_mg_kg", label: "K", param: "potassium" },
  { key: "ph", label: "pH", param: "ph" },
];

function buildRadarData(readings: SoilReading[], crop: string): { data: RadarAxisValue[]; averageScore: number } {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = readings.filter((r) => new Date(r.reading_taken_at).getTime() >= cutoff);
  if (recent.length === 0) return { data: [], averageScore: 0 };

  const data: RadarAxisValue[] = RADAR_PARAMS.map(({ key, label, param }) => {
    const values = recent.map((r) => r[key]).filter((v): v is number => v !== null);
    if (values.length === 0) return { parameter: label, pctOfOptimal: 0 };
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const { min, max } = getOptimalRange(param, crop);
    const mid = (min + max) / 2;
    const pct = mid === 0 ? 0 : Math.round((avg / mid) * 100);
    return { parameter: label, pctOfOptimal: pct };
  });

  const averageScore = Math.round(data.reduce((sum, d) => sum + Math.min(d.pctOfOptimal, 100), 0) / data.length);
  return { data, averageScore };
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  sent: <Check className="h-3 w-3" />,
  delivered: <CheckCheck className="h-3 w-3" />,
  read: <CheckCheck className="h-3 w-3 text-blue-500" />,
  failed: <X className="h-3 w-3 text-alert-red" />,
  queued: <Clock className="h-3 w-3" />,
};

export default function FarmerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const addToast = useDashboardStore((s) => s.addToast);
  const farmerId = params.id;

  const [tab, setTab] = useState<TabValue>("overview");
  const [plotModalOpen, setPlotModalOpen] = useState(false);
  const [assignDeviceOpen, setAssignDeviceOpen] = useState(false);
  const [recsOpen, setRecsOpen] = useState(false);
  const [manualMessage, setManualMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const { data, loading, error, mutate } = useFarmerData(farmerId);

  const { data: readings, isLoading: readingsLoading } = useSWR(
    farmerId ? ["farmer-readings", farmerId] : null,
    () => fetchFarmerReadings(farmerId)
  );

  const { data: availableDevices } = useSWR(
    assignDeviceOpen ? "unassigned-devices" : null,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("devices").select("*").is("farmer_id", null);
      if (error) throw error;
      return (data ?? []) as Device[];
    }
  );

  const primaryCrop = data?.plots?.[0]?.crop ?? "maize";
  const radar = useMemo(() => buildRadarData(readings ?? [], primaryCrop), [readings, primaryCrop]);

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonCard className="h-32" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorCard message={error ?? "Farmer not found"} onRetry={() => mutate()} />;
  }

  const { farmer, plots, device, recommendations, messages } = data;
  const lang = (["en", "sn", "nd"].includes(farmer.language) ? farmer.language : "en") as Language;

  async function handleAddPlot(values: PlotFormValues) {
    const supabase = createClient();
    const { error: plotError } = await supabase.from("plots").insert({
      farmer_id: farmerId,
      plot_name: values.plot_name,
      crop: values.crop,
      crop_other: values.crop === "other" ? values.crop_other || null : null,
      growth_stage: values.growth_stage || null,
      size_hectares: values.size_hectares === "" || values.size_hectares == null ? null : Number(values.size_hectares),
      location_description: values.location_description || null,
      latitude: values.latitude === "" || values.latitude == null ? null : Number(values.latitude),
      longitude: values.longitude === "" || values.longitude == null ? null : Number(values.longitude),
    });
    if (plotError) {
      addToast({ variant: "error", title: "Could not add plot", description: plotError.message });
      throw plotError;
    }
    addToast({ variant: "success", title: "Plot added", description: `${values.plot_name} has been added.` });
    mutate();
  }

  async function handleAssignDevice(deviceId: string) {
    const supabase = createClient();
    const { error: assignError } = await supabase.from("devices").update({ farmer_id: farmerId, deployed_at: new Date().toISOString() }).eq("id", deviceId);
    if (assignError) {
      addToast({ variant: "error", title: "Could not assign device", description: assignError.message });
      return;
    }
    addToast({ variant: "success", title: "Device assigned" });
    setAssignDeviceOpen(false);
    mutate();
  }

  async function handleSendManualMessage() {
    if (!manualMessage.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmer_id: farmerId, message: manualMessage.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send message");
      setManualMessage("");
      addToast({ variant: "success", title: "Message sent" });
      mutate();
    } catch (e) {
      addToast({ variant: "error", title: "Could not send message", description: e instanceof Error ? e.message : "An unexpected error occurred" });
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <div className="space-y-5">
      <button onClick={() => router.push("/farmers")} className="inline-flex items-center gap-1.5 text-sm text-ink-grey hover:text-ink-dark">
        <ArrowLeft className="h-4 w-4" />
        Back to Farmers
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("h-14 w-14 rounded-full flex items-center justify-center font-semibold text-lg", "bg-primary-light text-primary")}>
            {farmer.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-ink-dark">{farmer.full_name}</h2>
              <Badge tone={SUBSCRIPTION_TONE[farmer.subscription_status] ?? "grey"} strikethrough={farmer.subscription_status === "cancelled"}>
                {SUBSCRIPTION_LABEL[farmer.subscription_status] ?? farmer.subscription_status}
              </Badge>
            </div>
            <p className="text-sm text-ink-grey">{farmer.district}, {farmer.province}</p>
          </div>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
          <InfoItem icon={<Phone className="h-4 w-4" />} label="Phone" value={farmer.phone_number} />
          <InfoItem icon={<Globe className="h-4 w-4" />} label="Language" value={LANGUAGE_FLAGS[lang]} />
          <InfoItem icon={<MapPin className="h-4 w-4" />} label="District" value={farmer.district} />
          <InfoItem icon={<Users className="h-4 w-4" />} label="Cooperative" value={farmer.cooperative ?? "—"} />
          <InfoItem icon={<Calendar className="h-4 w-4" />} label="Enrolled" value={farmer.subscription_start_date ? formatDate(farmer.subscription_start_date) : "—"} />
          <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Monthly Fee" value={formatCurrency(farmer.monthly_fee_usd)} />
        </div>
      </Card>

      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.value ? "border-primary text-primary" : "border-transparent text-ink-grey hover:text-ink-dark"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Plots" action={<Button size="sm" onClick={() => setPlotModalOpen(true)}><Plus className="h-4 w-4" />Add Plot</Button>}>
            {plots.length === 0 ? (
              <EmptyState title="No plots yet" description="Add a plot to start tracking soil readings." className="h-[160px]" />
            ) : (
              <div className="space-y-3">
                {plots.map((plot: Plot) => (
                  <div key={plot.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-ink-dark text-sm">{plot.plot_name}</p>
                      <p className="text-xs text-ink-grey">{cropLabel(plot.crop, plot.crop_other)} {plot.growth_stage ? `· ${plot.growth_stage}` : ""}{plot.size_hectares ? ` · ${plot.size_hectares} ha` : ""}</p>
                    </div>
                    {plot.location_description && <p className="text-xs text-ink-grey max-w-[40%] text-right truncate">{plot.location_description}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Assigned Device" action={!device && <Button size="sm" onClick={() => setAssignDeviceOpen(true)}><Plus className="h-4 w-4" />Assign Device</Button>}>
            {!device ? (
              <EmptyState title="No device assigned" description="Assign a handheld device to this farmer." className="h-[160px]" />
            ) : (
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0"><Cpu className="h-5 w-5" /></div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-ink-dark">{device.serial_number}</p>
                  <p className="text-xs text-ink-grey">Status: <span className="font-medium text-ink-dark">{device.status}</span></p>
                  <p className="text-xs text-ink-grey">Last sync: {device.last_sync_at ? timeAgo(device.last_sync_at) : "Never"}</p>
                  {device.battery_level != null && <p className="text-xs text-ink-grey">Battery: {device.battery_level}%</p>}
                </div>
              </div>
            )}
          </Card>

          <Card title="Soil Health Summary">
            <SoilHealthRadar data={radar.data} averageScore={radar.averageScore} />
          </Card>

          <Card title="Recent AI Recommendations" action={
            recommendations.length > 0 && (
              <button onClick={() => setRecsOpen((o) => !o)} className="text-ink-grey hover:text-ink-dark">
                {recsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )
          }>
            {recommendations.length === 0 ? (
              <EmptyState title="No recommendations yet" description="AI recommendations will appear here once readings are analysed." className="h-[160px]" />
            ) : (
              <div className="space-y-3">
                {(recsOpen ? recommendations : recommendations.slice(0, 3)).map((rec) => (
                  <div key={rec.id} className="border border-gray-100 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-ink-grey">
                      <span>{formatDateTime(rec.created_at)}</span>
                      <Badge tone={rec.delivered_via_whatsapp ? "green" : "grey"}>{rec.delivered_via_whatsapp ? "Sent via WhatsApp" : "Not sent"}</Badge>
                    </div>
                    <p className="text-sm text-ink-dark line-clamp-3">{rec.recommendation_text}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "readings" && (
        <div className="space-y-4">
          <ParameterTrendChart readings={readings ?? []} loading={readingsLoading} title="Reading History" />
          {!readingsLoading && (readings ?? []).length === 0 && (
            <EmptyState title="No readings yet" description="Soil readings from this farmer's device will appear here." />
          )}
        </div>
      )}

      {tab === "whatsapp" && (
        <Card>
          <div className="space-y-4">
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <EmptyState title="No messages yet" description="WhatsApp conversation history will appear here." className="h-[200px]" />
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.direction === "outbound" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2 text-sm space-y-1",
                        m.direction === "outbound" ? "bg-primary text-white rounded-br-sm" : "bg-gray-100 text-ink-dark rounded-bl-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.message_body}</p>
                      <div className={cn("flex items-center gap-1 text-[10px]", m.direction === "outbound" ? "text-white/70 justify-end" : "text-ink-grey")}>
                        <span>{formatDateTime(m.created_at)}</span>
                        {m.direction === "outbound" && m.status && STATUS_ICON[m.status]}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <Input
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                placeholder={`Send a message to ${farmer.full_name.split(" ")[0]}…`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendManualMessage();
                  }
                }}
              />
              <Button onClick={handleSendManualMessage} loading={sendingMessage}>
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </Card>
      )}

      <PlotFormModal open={plotModalOpen} onClose={() => setPlotModalOpen(false)} onSubmit={handleAddPlot} />

      <Modal open={assignDeviceOpen} onClose={() => setAssignDeviceOpen(false)} title="Assign Device">
        <div className="space-y-4">
          {!availableDevices ? (
            <SkeletonBlock className="h-32" />
          ) : availableDevices.length === 0 ? (
            <EmptyState title="No unassigned devices" description="All devices are currently assigned to farmers." className="h-[140px]" />
          ) : (
            <div className="space-y-2">
              {availableDevices.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleAssignDevice(d.id)}
                  className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3 text-sm hover:border-primary hover:bg-primary-light/40 transition-colors"
                >
                  <span className="font-medium text-ink-dark">{d.serial_number}</span>
                  <Badge tone="grey">{d.status}</Badge>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setAssignDeviceOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-ink-grey mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-ink-grey">{label}</p>
        <p className="font-medium text-ink-dark truncate">{value}</p>
      </div>
    </div>
  );
}
