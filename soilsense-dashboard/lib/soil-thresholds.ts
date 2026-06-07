export type CropType = "maize" | "tomatoes" | "sweet_potatoes" | "beetroot" | "cabbage";

export type SoilParameter =
  | "nitrogen"
  | "phosphorus"
  | "potassium"
  | "ph"
  | "ec"
  | "moisture";

export type ParameterStatus =
  | "optimal"
  | "low_warning"
  | "high_warning"
  | "low_critical"
  | "high_critical";

export interface ParameterRange {
  min: number;
  max: number;
}

export interface CropThresholds {
  nitrogen: ParameterRange; // mg/kg
  phosphorus: ParameterRange; // mg/kg
  potassium: ParameterRange; // mg/kg
  ph: ParameterRange;
  ec: ParameterRange; // dS/m
  moisture: ParameterRange; // %
  temp: ParameterRange; // °C
}

export const SOIL_THRESHOLDS: Record<CropType, CropThresholds> = {
  maize: {
    nitrogen: { min: 80, max: 150 },
    phosphorus: { min: 20, max: 40 },
    potassium: { min: 80, max: 150 },
    ph: { min: 5.8, max: 7.0 },
    ec: { min: 0.2, max: 0.8 },
    moisture: { min: 60, max: 80 },
    temp: { min: 15, max: 32 },
  },
  tomatoes: {
    nitrogen: { min: 100, max: 200 },
    phosphorus: { min: 30, max: 60 },
    potassium: { min: 150, max: 300 },
    ph: { min: 6.0, max: 6.8 },
    ec: { min: 0.3, max: 1.5 },
    moisture: { min: 65, max: 80 },
    temp: { min: 18, max: 30 },
  },
  sweet_potatoes: {
    nitrogen: { min: 50, max: 100 },
    phosphorus: { min: 20, max: 40 },
    potassium: { min: 100, max: 200 },
    ph: { min: 5.5, max: 6.5 },
    ec: { min: 0.2, max: 0.6 },
    moisture: { min: 60, max: 75 },
    temp: { min: 20, max: 30 },
  },
  beetroot: {
    nitrogen: { min: 80, max: 150 },
    phosphorus: { min: 25, max: 50 },
    potassium: { min: 100, max: 180 },
    ph: { min: 6.0, max: 7.0 },
    ec: { min: 0.3, max: 0.8 },
    moisture: { min: 65, max: 80 },
    temp: { min: 15, max: 25 },
  },
  cabbage: {
    nitrogen: { min: 100, max: 180 },
    phosphorus: { min: 30, max: 60 },
    potassium: { min: 120, max: 200 },
    ph: { min: 6.0, max: 7.0 },
    ec: { min: 0.3, max: 1.0 },
    moisture: { min: 70, max: 85 },
    temp: { min: 15, max: 25 },
  },
};

export const PARAMETER_LABELS: Record<SoilParameter, { label: string; unit: string }> = {
  nitrogen: { label: "Nitrogen", unit: "mg/kg" },
  phosphorus: { label: "Phosphorus", unit: "mg/kg" },
  potassium: { label: "Potassium", unit: "mg/kg" },
  ph: { label: "pH", unit: "" },
  ec: { label: "Electrical Conductivity", unit: "dS/m" },
  moisture: { label: "Moisture", unit: "%" },
};

/**
 * Normalises a crop string from the database (which may include 'other'
 * or unrecognised values) to a known threshold key, defaulting to maize.
 */
export function resolveCropKey(crop: string | null | undefined): CropType {
  if (crop && crop in SOIL_THRESHOLDS) return crop as CropType;
  return "maize";
}

/**
 * Returns the optimal range for a parameter for a given crop.
 * Falls back to maize thresholds for unrecognised crops.
 */
export function getOptimalRange(parameter: SoilParameter, crop: string): ParameterRange {
  return SOIL_THRESHOLDS[resolveCropKey(crop)][parameter];
}

/**
 * Determines the status of a single parameter reading relative to a crop's
 * optimal range.
 *
 * Warning band: value is outside [min, max] by up to 20% of the range width.
 * Critical band: value is outside [min, max] by more than 40% of the range width.
 */
export function getParameterStatus(
  parameter: SoilParameter,
  value: number | null | undefined,
  crop: string
): ParameterStatus {
  if (value === null || value === undefined || Number.isNaN(value)) return "optimal";

  const { min, max } = getOptimalRange(parameter, crop);
  const width = max - min;
  const warningMargin = width * 0.2;
  const criticalMargin = width * 0.4;

  if (value >= min && value <= max) return "optimal";

  if (value < min) {
    if (value < min - criticalMargin) return "low_critical";
    if (value < min - warningMargin) return "low_warning";
    return "optimal"; // within the small buffer just below min — treat as optimal edge
  }

  // value > max
  if (value > max + criticalMargin) return "high_critical";
  if (value > max + warningMargin) return "high_warning";
  return "optimal";
}

export type OverallStatus = "good" | "warning" | "critical";

export interface ReadingLike {
  nitrogen_mg_kg?: number | null;
  phosphorus_mg_kg?: number | null;
  potassium_mg_kg?: number | null;
  ph?: number | null;
  electrical_conductivity_ds_m?: number | null;
  moisture_percent?: number | null;
}

const READING_FIELD_TO_PARAM: Record<keyof ReadingLike, SoilParameter> = {
  nitrogen_mg_kg: "nitrogen",
  phosphorus_mg_kg: "phosphorus",
  potassium_mg_kg: "potassium",
  ph: "ph",
  electrical_conductivity_ds_m: "ec",
  moisture_percent: "moisture",
};

/**
 * Aggregates the status of every measured parameter on a reading into a
 * single overall status used for table pills and map markers.
 */
export function getOverallStatus(reading: ReadingLike, crop: string): OverallStatus {
  let hasWarning = false;

  for (const field of Object.keys(READING_FIELD_TO_PARAM) as (keyof ReadingLike)[]) {
    const value = reading[field];
    if (value === null || value === undefined) continue;

    const status = getParameterStatus(READING_FIELD_TO_PARAM[field], value, crop);
    if (status === "low_critical" || status === "high_critical") return "critical";
    if (status === "low_warning" || status === "high_warning") hasWarning = true;
  }

  return hasWarning ? "warning" : "good";
}

/**
 * Calculates the percentage of measured parameters that fall within the
 * optimal range — used for the reading-detail "overall health score".
 */
export function getHealthScore(reading: ReadingLike, crop: string): number {
  let total = 0;
  let optimal = 0;

  for (const field of Object.keys(READING_FIELD_TO_PARAM) as (keyof ReadingLike)[]) {
    const value = reading[field];
    if (value === null || value === undefined) continue;

    total += 1;
    if (getParameterStatus(READING_FIELD_TO_PARAM[field], value, crop) === "optimal") {
      optimal += 1;
    }
  }

  if (total === 0) return 0;
  return Math.round((optimal / total) * 100);
}

export const STATUS_LABELS: Record<ParameterStatus, string> = {
  optimal: "Optimal",
  low_warning: "Low",
  high_warning: "High",
  low_critical: "Critical Low",
  high_critical: "Critical High",
};
