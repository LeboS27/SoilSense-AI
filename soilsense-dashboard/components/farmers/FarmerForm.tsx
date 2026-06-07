"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, FieldError, HelperText } from "@/components/ui/Select";
import { CROP_OPTIONS, GROWTH_STAGE_OPTIONS } from "@/types";
import { cn } from "@/lib/utils";

const phoneRegex = /^\+2637\d{8}$/;

const farmerSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone_number: z.string().regex(phoneRegex, "Use E.164 Zimbabwe format, e.g. +263771234567"),
  language: z.enum(["en", "sn", "nd"]),
  gender: z.string().optional(),
  cooperative: z.string().optional(),
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  subscription_start_date: z.string().min(1, "Start date is required"),
  monthly_fee_usd: z.coerce.number().min(0),
  notes: z.string().optional(),
  discounted_first_month: z.boolean().optional(),

  add_plot: z.boolean().optional(),
  plot_name: z.string().optional(),
  crop: z.string().optional(),
  crop_other: z.string().optional(),
  growth_stage: z.string().optional(),
  size_hectares: z.union([z.coerce.number(), z.literal("")]).optional(),
  location_description: z.string().optional(),
  latitude: z.union([z.coerce.number(), z.literal("")]).optional(),
  longitude: z.union([z.coerce.number(), z.literal("")]).optional(),
}).superRefine((data, ctx) => {
  if (data.add_plot) {
    if (!data.plot_name || data.plot_name.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["plot_name"], message: "Plot name is required" });
    }
    if (!data.crop) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["crop"], message: "Crop is required" });
    }
    if (data.crop === "other" && (!data.crop_other || data.crop_other.trim().length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["crop_other"], message: "Please specify the crop" });
    }
  }
});

export type FarmerFormValues = z.infer<typeof farmerSchema>;

const PROVINCE_OPTIONS = [
  { value: "Bulawayo Metropolitan", label: "Bulawayo Metropolitan" },
  { value: "Matabeleland North", label: "Matabeleland North" },
  { value: "Matabeleland South", label: "Matabeleland South" },
  { value: "Midlands", label: "Midlands" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Prefer not to say" },
];

export function FarmerForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: FarmerFormValues) => Promise<void>;
  submitting: boolean;
}) {
  const [plotOpen, setPlotOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FarmerFormValues>({
    resolver: zodResolver(farmerSchema),
    defaultValues: {
      language: "en",
      province: "Bulawayo Metropolitan",
      district: "Imbizo",
      subscription_start_date: new Date().toISOString().slice(0, 10),
      monthly_fee_usd: 5.0,
      add_plot: false,
      growth_stage: "germination",
    },
  });

  const crop = watch("crop");

  async function submit(values: FarmerFormValues) {
    await onSubmit({ ...values, add_plot: plotOpen });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="full_name" required>
              Full Name
            </Label>
            <Input id="full_name" {...register("full_name")} placeholder="e.g. Thandiwe Ncube" />
            <FieldError message={errors.full_name?.message} />
          </div>

          <div>
            <Label htmlFor="phone_number" required>
              Phone Number
            </Label>
            <Input id="phone_number" {...register("phone_number")} placeholder="+263771234567" />
            <HelperText>e.g. +263771234567</HelperText>
            <FieldError message={errors.phone_number?.message} />
          </div>

          <div>
            <Label required>Language</Label>
            <div className="flex gap-4">
              {[
                { value: "en", label: "English" },
                { value: "sn", label: "Shona" },
                { value: "nd", label: "Ndebele" },
              ].map((opt) => (
                <label key={opt.value} className="inline-flex items-center gap-1.5 text-sm text-ink-dark cursor-pointer">
                  <input type="radio" value={opt.value} {...register("language")} className="accent-primary" />
                  {opt.label}
                </label>
              ))}
            </div>
            <FieldError message={errors.language?.message} />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select id="gender" {...register("gender")} placeholder="Select gender" options={GENDER_OPTIONS} />
          </div>

          <div>
            <Label htmlFor="cooperative">Cooperative / Savings Club</Label>
            <Input id="cooperative" {...register("cooperative")} placeholder="e.g. Imbizo Women Farmers Club" />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="province" required>
              Province
            </Label>
            <Select id="province" {...register("province")} options={PROVINCE_OPTIONS} />
          </div>

          <div>
            <Label htmlFor="district" required>
              District
            </Label>
            <Input id="district" {...register("district")} />
            <FieldError message={errors.district?.message} />
          </div>

          <div>
            <Label htmlFor="subscription_start_date" required>
              Subscription Start Date
            </Label>
            <Input id="subscription_start_date" type="date" {...register("subscription_start_date")} />
            <FieldError message={errors.subscription_start_date?.message} />
          </div>

          <div>
            <Label htmlFor="monthly_fee_usd" required>
              Monthly Fee (USD)
            </Label>
            <Input id="monthly_fee_usd" type="number" step="0.01" readOnly {...register("monthly_fee_usd")} />
            <HelperText>Standard rate: $5/month; leave as is unless a discount applies</HelperText>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-ink-dark cursor-pointer">
            <input type="checkbox" {...register("discounted_first_month")} className="accent-primary" />
            Discounted First Month
          </label>
        </div>
      </div>

      {/* Add plot collapsible */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setPlotOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-surface-bg text-sm font-medium text-ink-dark"
        >
          Add Initial Plot
          {plotOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {plotOpen && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plot_name" required>
                Plot Name
              </Label>
              <Input id="plot_name" {...register("plot_name")} placeholder="e.g. North plot" />
              <FieldError message={errors.plot_name?.message} />
            </div>
            <div>
              <Label htmlFor="crop" required>
                Crop
              </Label>
              <Select id="crop" {...register("crop")} placeholder="Select crop" options={CROP_OPTIONS.map((c) => ({ value: c.value, label: c.label }))} />
              <FieldError message={errors.crop?.message} />
            </div>
            {crop === "other" && (
              <div>
                <Label htmlFor="crop_other">Crop Other</Label>
                <Input id="crop_other" {...register("crop_other")} placeholder="Specify crop" />
                <FieldError message={errors.crop_other?.message} />
              </div>
            )}
            <div>
              <Label htmlFor="growth_stage">Growth Stage</Label>
              <Select id="growth_stage" {...register("growth_stage")} options={GROWTH_STAGE_OPTIONS.map((g) => ({ value: g.value, label: g.label }))} />
            </div>
            <div>
              <Label htmlFor="size_hectares">Size (hectares)</Label>
              <Input id="size_hectares" type="number" step="0.01" {...register("size_hectares")} />
            </div>
            <div>
              <Label htmlFor="location_description">Location Description</Label>
              <Input id="location_description" {...register("location_description")} placeholder="e.g. Behind the house, near the borehole" />
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="0.0000001" {...register("latitude")} />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="0.0000001" {...register("longitude")} />
              </div>
              <div className="col-span-2">
                <HelperText>Optional — enter manually or we will set this on first reading</HelperText>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={cn("flex flex-col sm:flex-row gap-3 sm:justify-end")}>
        <Button type="button" variant="secondary" className="sm:w-auto w-full" onClick={() => history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} className="sm:w-auto w-full">
          Register Farmer
        </Button>
      </div>
    </form>
  );
}
