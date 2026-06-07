"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { FarmerForm, type FarmerFormValues } from "@/components/farmers/FarmerForm";
import { useDashboardStore } from "@/store/dashboard";

export default function NewFarmerPage() {
  const router = useRouter();
  const addToast = useDashboardStore((s) => s.addToast);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: FarmerFormValues) {
    setSubmitting(true);
    try {
      const supabase = createClient();

      const { data: farmer, error: farmerError } = await supabase
        .from("farmers")
        .insert({
          full_name: values.full_name,
          phone_number: values.phone_number,
          language: values.language,
          gender: values.gender || null,
          cooperative: values.cooperative || null,
          province: values.province,
          district: values.district,
          subscription_start_date: values.subscription_start_date,
          monthly_fee_usd: values.discounted_first_month ? Number(values.monthly_fee_usd) / 2 : Number(values.monthly_fee_usd),
          notes: values.notes || null,
        })
        .select()
        .single();

      if (farmerError || !farmer) throw farmerError ?? new Error("Could not create farmer");

      if (values.add_plot && values.plot_name && values.crop) {
        const { error: plotError } = await supabase.from("plots").insert({
          farmer_id: farmer.id,
          plot_name: values.plot_name,
          crop: values.crop,
          crop_other: values.crop === "other" ? values.crop_other || null : null,
          growth_stage: values.growth_stage || null,
          size_hectares: values.size_hectares === "" || values.size_hectares == null ? null : Number(values.size_hectares),
          location_description: values.location_description || null,
          latitude: values.latitude === "" || values.latitude == null ? null : Number(values.latitude),
          longitude: values.longitude === "" || values.longitude == null ? null : Number(values.longitude),
        });
        if (plotError) throw plotError;
      }

      addToast({ variant: "success", title: "Farmer registered", description: `${farmer.full_name} has been added to the network.` });
      router.push(`/farmers/${farmer.id}`);
    } catch (e) {
      addToast({
        variant: "error",
        title: "Could not register farmer",
        description: e instanceof Error ? e.message : "An unexpected error occurred",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <button onClick={() => router.push("/farmers")} className="inline-flex items-center gap-1.5 text-sm text-ink-grey hover:text-ink-dark">
        <ArrowLeft className="h-4 w-4" />
        Back to Farmers
      </button>

      <h2 className="text-lg font-semibold text-ink-dark">Register New Farmer</h2>

      <Card>
        <FarmerForm onSubmit={handleSubmit} submitting={submitting} />
      </Card>
    </div>
  );
}
