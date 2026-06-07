"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label, FieldError, HelperText } from "@/components/ui/Select";
import { CROP_OPTIONS, GROWTH_STAGE_OPTIONS } from "@/types";

const plotSchema = z
  .object({
    plot_name: z.string().min(1, "Plot name is required"),
    crop: z.string().min(1, "Crop is required"),
    crop_other: z.string().optional(),
    growth_stage: z.string().optional(),
    size_hectares: z.union([z.coerce.number(), z.literal("")]).optional(),
    location_description: z.string().optional(),
    latitude: z.union([z.coerce.number(), z.literal("")]).optional(),
    longitude: z.union([z.coerce.number(), z.literal("")]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.crop === "other" && (!data.crop_other || data.crop_other.trim().length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["crop_other"], message: "Please specify the crop" });
    }
  });

export type PlotFormValues = z.infer<typeof plotSchema>;

export function PlotFormModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PlotFormValues) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PlotFormValues>({
    resolver: zodResolver(plotSchema),
    defaultValues: { growth_stage: "germination" },
  });

  const crop = watch("crop");

  async function submit(values: PlotFormValues) {
    setSubmitting(true);
    try {
      await onSubmit(values);
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Plot">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
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
            <Input id="crop_other" {...register("crop_other")} />
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input id="latitude" type="number" step="0.0000001" {...register("latitude")} />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input id="longitude" type="number" step="0.0000001" {...register("longitude")} />
          </div>
        </div>
        <HelperText>Optional — enter manually or we will set this on first reading</HelperText>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Add Plot
          </Button>
        </div>
      </form>
    </Modal>
  );
}
