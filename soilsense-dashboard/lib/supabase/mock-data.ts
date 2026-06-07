/**
 * Canned dataset for running SoilSense AI as a browsable prototype without a
 * real Supabase project configured. Timestamps are computed relative to
 * "now" and a few numeric fields are lightly randomised at module load so
 * the UI feels alive across reloads instead of frozen on fixed numbers.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.now();

const ago = (ms: number) => new Date(NOW - ms).toISOString();
const jitter = (base: number, spread: number) => Math.round(base + (Math.random() * 2 - 1) * spread);

function uuid(seed: string): string {
  // deterministic-looking pseudo UUID so links/keys stay stable per row
  const hex = Array.from(seed).reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7).toString(16).padStart(8, "0");
  return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-8${hex.slice(1, 4)}-${hex}0000`;
}

export interface MockFarmer {
  id: string;
  full_name: string;
  phone_number: string;
  language: string;
  district: string;
  province: string;
  gender: string | null;
  cooperative: string | null;
  is_active: boolean;
  subscription_status: string;
  subscription_start_date: string | null;
  monthly_fee_usd: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const mockFarmers: MockFarmer[] = [
  {
    id: uuid("farmer-thandiwe"),
    full_name: "Thandiwe Ncube",
    phone_number: "+263771234001",
    language: "nd",
    district: "Umzingwane",
    province: "Matabeleland South",
    gender: "female",
    cooperative: "Esigodini Smallholders Coop",
    is_active: true,
    subscription_status: "active",
    subscription_start_date: ago(210 * DAY).slice(0, 10),
    monthly_fee_usd: 5,
    notes: null,
    created_at: ago(220 * DAY),
    updated_at: ago(2 * DAY),
  },
  {
    id: uuid("farmer-tendai"),
    full_name: "Tendai Moyo",
    phone_number: "+263771234002",
    language: "sn",
    district: "Goromonzi",
    province: "Mashonaland East",
    gender: "male",
    cooperative: "Goromonzi Growers Union",
    is_active: true,
    subscription_status: "active",
    subscription_start_date: ago(180 * DAY).slice(0, 10),
    monthly_fee_usd: 5,
    notes: null,
    created_at: ago(190 * DAY),
    updated_at: ago(5 * DAY),
  },
  {
    id: uuid("farmer-sipho"),
    full_name: "Sipho Dube",
    phone_number: "+263771234003",
    language: "nd",
    district: "Umzingwane",
    province: "Matabeleland South",
    gender: "male",
    cooperative: null,
    is_active: true,
    subscription_status: "active",
    subscription_start_date: ago(140 * DAY).slice(0, 10),
    monthly_fee_usd: 5,
    notes: "Prefers WhatsApp messages in the evening.",
    created_at: ago(150 * DAY),
    updated_at: ago(1 * DAY),
  },
  {
    id: uuid("farmer-nomvula"),
    full_name: "Nomvula Sibanda",
    phone_number: "+263771234004",
    language: "en",
    district: "Bulilima",
    province: "Matabeleland South",
    gender: "female",
    cooperative: "Bulilima Women in Agriculture",
    is_active: true,
    subscription_status: "paused",
    subscription_start_date: ago(95 * DAY).slice(0, 10),
    monthly_fee_usd: 5,
    notes: null,
    created_at: ago(100 * DAY),
    updated_at: ago(8 * DAY),
  },
  {
    id: uuid("farmer-farai"),
    full_name: "Farai Chikomo",
    phone_number: "+263771234005",
    language: "sn",
    district: "Goromonzi",
    province: "Mashonaland East",
    gender: "male",
    cooperative: "Goromonzi Growers Union",
    is_active: true,
    subscription_status: "active",
    subscription_start_date: ago(60 * DAY).slice(0, 10),
    monthly_fee_usd: 5,
    notes: null,
    created_at: ago(65 * DAY),
    updated_at: ago(12 * HOUR),
  },
];

const farmerRef = (id: string | null, fields: string[] = ["id", "full_name"]) => {
  if (!id) return null;
  const f = mockFarmers.find((x) => x.id === id);
  if (!f) return null;
  const out: Record<string, unknown> = {};
  for (const key of fields) out[key] = (f as unknown as Record<string, unknown>)[key];
  return out;
};

export interface MockPlot {
  id: string;
  farmer_id: string;
  plot_name: string;
  crop: string;
  crop_other: string | null;
  growth_stage: string | null;
  size_hectares: number;
  latitude: number;
  longitude: number;
  location_description: string | null;
  created_at: string;
  farmer?: { id: string; full_name: string };
}

export const mockPlots: MockPlot[] = [
  { id: uuid("plot-1"), farmer_id: mockFarmers[0].id, plot_name: "Field A (riverbank)", crop: "maize", crop_other: null, growth_stage: "vegetative", size_hectares: 1.2, latitude: -20.3211, longitude: 28.9938, location_description: "Behind homestead, near borehole", created_at: ago(200 * DAY) },
  { id: uuid("plot-2"), farmer_id: mockFarmers[0].id, plot_name: "Field B (hillside)", crop: "tomatoes", crop_other: null, growth_stage: "flowering", size_hectares: 0.4, latitude: -20.3258, longitude: 28.9990, location_description: "Terraced slope plot", created_at: ago(190 * DAY) },
  { id: uuid("plot-3"), farmer_id: mockFarmers[1].id, plot_name: "Main maize field", crop: "maize", crop_other: null, growth_stage: "fruiting", size_hectares: 2.5, latitude: -17.7935, longitude: 31.3621, location_description: "Along the Goromonzi road", created_at: ago(180 * DAY) },
  { id: uuid("plot-4"), farmer_id: mockFarmers[1].id, plot_name: "Cabbage patch", crop: "cabbage", crop_other: null, growth_stage: "harvest", size_hectares: 0.3, latitude: -17.7902, longitude: 31.3578, location_description: "Behind the kitchen garden", created_at: ago(150 * DAY) },
  { id: uuid("plot-5"), farmer_id: mockFarmers[2].id, plot_name: "Lower field", crop: "sweet_potatoes", crop_other: null, growth_stage: "vegetative", size_hectares: 0.8, latitude: -20.3070, longitude: 29.0102, location_description: "Near the dam wall", created_at: ago(140 * DAY) },
  { id: uuid("plot-6"), farmer_id: mockFarmers[2].id, plot_name: "Upper field", crop: "maize", crop_other: null, growth_stage: "germination", size_hectares: 1.6, latitude: -20.3022, longitude: 29.0144, location_description: "Adjacent to neighbour's plot", created_at: ago(135 * DAY) },
  { id: uuid("plot-7"), farmer_id: mockFarmers[3].id, plot_name: "Beetroot beds", crop: "beetroot", crop_other: null, growth_stage: "flowering", size_hectares: 0.2, latitude: -20.4325, longitude: 27.7766, location_description: "Drip-irrigated raised beds", created_at: ago(95 * DAY) },
  { id: uuid("plot-8"), farmer_id: mockFarmers[3].id, plot_name: "Groundnut trial plot", crop: "other", crop_other: "Groundnuts", growth_stage: "vegetative", size_hectares: 0.5, latitude: -20.4290, longitude: 27.7820, location_description: "New plot, first season", created_at: ago(40 * DAY) },
  { id: uuid("plot-9"), farmer_id: mockFarmers[4].id, plot_name: "Riverside maize", crop: "maize", crop_other: null, growth_stage: "fruiting", size_hectares: 3.1, latitude: -17.8001, longitude: 31.3505, location_description: "Floodplain field", created_at: ago(60 * DAY) },
  { id: uuid("plot-10"), farmer_id: mockFarmers[4].id, plot_name: "Tomato tunnels", crop: "tomatoes", crop_other: null, growth_stage: "harvest", size_hectares: 0.25, latitude: -17.8049, longitude: 31.3469, location_description: "Shade-net tunnels", created_at: ago(58 * DAY) },
].map((p) => ({ ...p, farmer: farmerRef(p.farmer_id, ["id", "full_name"]) as { id: string; full_name: string } }));

const plotRef = (id: string | null, fields: string[]) => {
  if (!id) return null;
  const p = mockPlots.find((x) => x.id === id);
  if (!p) return null;
  const out: Record<string, unknown> = {};
  for (const key of fields) out[key] = (p as unknown as Record<string, unknown>)[key];
  return out;
};

export interface MockDevice {
  id: string;
  serial_number: string;
  firmware_version: string | null;
  status: string;
  farmer_id: string | null;
  deployed_at: string | null;
  last_sync_at: string | null;
  battery_level: number | null;
  signal_strength: number | null;
  offline_readings_count: number;
  notes: string | null;
  created_at: string;
}

export const mockDevices: MockDevice[] = [
  { id: uuid("device-1"), serial_number: "SSA-001", firmware_version: "1.4.2", status: "deployed", farmer_id: mockFarmers[0].id, deployed_at: ago(200 * DAY), last_sync_at: ago(jitter(2, 1) * HOUR), battery_level: jitter(82, 4), signal_strength: jitter(70, 6), offline_readings_count: 0, notes: null, created_at: ago(210 * DAY) },
  { id: uuid("device-2"), serial_number: "SSA-002", firmware_version: "1.4.2", status: "deployed", farmer_id: mockFarmers[1].id, deployed_at: ago(180 * DAY), last_sync_at: ago(jitter(5, 2) * HOUR), battery_level: jitter(64, 5), signal_strength: jitter(55, 8), offline_readings_count: jitter(3, 2), created_at: ago(190 * DAY), notes: null },
  { id: uuid("device-3"), serial_number: "SSA-003", firmware_version: "1.3.9", status: "deployed", farmer_id: mockFarmers[2].id, deployed_at: ago(150 * DAY), last_sync_at: ago(jitter(26, 4) * HOUR), battery_level: jitter(38, 6), signal_strength: jitter(40, 8), offline_readings_count: jitter(6, 3), created_at: ago(160 * DAY), notes: "Battery replaced last visit" },
  { id: uuid("device-4"), serial_number: "SSA-004", firmware_version: "1.4.2", status: "available", farmer_id: null, deployed_at: null, last_sync_at: null, battery_level: 100, signal_strength: null, offline_readings_count: 0, notes: "In storage at district office", created_at: ago(45 * DAY) },
  { id: uuid("device-5"), serial_number: "SSA-005", firmware_version: "1.2.6", status: "maintenance", farmer_id: mockFarmers[4].id, deployed_at: ago(60 * DAY), last_sync_at: ago(jitter(96, 12) * HOUR), battery_level: jitter(15, 4), signal_strength: jitter(22, 6), offline_readings_count: jitter(11, 3), created_at: ago(70 * DAY), notes: "Sensor probe needs recalibration" },
];

const deviceRef = (id: string | null, fields: string[]) => {
  if (!id) return null;
  const d = mockDevices.find((x) => x.id === id);
  if (!d) return null;
  const out: Record<string, unknown> = {};
  for (const key of fields) out[key] = (d as unknown as Record<string, unknown>)[key];
  return out;
};

export interface MockSoilReading {
  id: string;
  device_id: string | null;
  farmer_id: string | null;
  plot_id: string | null;
  nitrogen_mg_kg: number | null;
  phosphorus_mg_kg: number | null;
  potassium_mg_kg: number | null;
  ph: number | null;
  electrical_conductivity_ds_m: number | null;
  moisture_percent: number | null;
  temperature_celsius: number | null;
  raw_payload: Record<string, unknown> | null;
  was_offline_sync: boolean;
  reading_taken_at: string;
  synced_at: string;
  created_at: string;
  farmer?: ReturnType<typeof farmerRef>;
  plot?: ReturnType<typeof plotRef>;
  device?: ReturnType<typeof deviceRef>;
}

interface ReadingSeed {
  plotIdx: number;
  deviceIdx: number;
  hoursAgo: number;
  n: number; p: number; k: number; ph: number; ec: number; moisture: number; temp: number;
  offline?: boolean;
}

const READING_SEEDS: ReadingSeed[] = [
  { plotIdx: 0, deviceIdx: 0, hoursAgo: 2, n: 38, p: 22, k: 165, ph: 6.1, ec: 0.9, moisture: 28, temp: 24.5 },
  { plotIdx: 0, deviceIdx: 0, hoursAgo: 26, n: 41, p: 24, k: 170, ph: 6.2, ec: 0.85, moisture: 31, temp: 23.8 },
  { plotIdx: 0, deviceIdx: 0, hoursAgo: 50, n: 35, p: 19, k: 158, ph: 5.9, ec: 0.95, moisture: 26, temp: 25.1 },
  { plotIdx: 1, deviceIdx: 0, hoursAgo: 8, n: 18, p: 12, k: 95, ph: 5.4, ec: 1.4, moisture: 19, temp: 27.3 },
  { plotIdx: 1, deviceIdx: 0, hoursAgo: 32, n: 21, p: 14, k: 102, ph: 5.6, ec: 1.3, moisture: 22, temp: 26.6 },
  { plotIdx: 2, deviceIdx: 1, hoursAgo: 5, n: 52, p: 31, k: 188, ph: 6.6, ec: 0.7, moisture: 34, temp: 22.9 },
  { plotIdx: 2, deviceIdx: 1, hoursAgo: 29, n: 49, p: 29, k: 180, ph: 6.5, ec: 0.72, moisture: 33, temp: 23.4 },
  { plotIdx: 3, deviceIdx: 1, hoursAgo: 14, n: 27, p: 16, k: 110, ph: 6.0, ec: 1.1, moisture: 24, temp: 24.0, offline: true },
  { plotIdx: 4, deviceIdx: 2, hoursAgo: 6, n: 15, p: 9, k: 80, ph: 5.1, ec: 1.7, moisture: 14, temp: 29.2 },
  { plotIdx: 4, deviceIdx: 2, hoursAgo: 30, n: 17, p: 10, k: 84, ph: 5.2, ec: 1.6, moisture: 16, temp: 28.7 },
  { plotIdx: 5, deviceIdx: 2, hoursAgo: 54, n: 44, p: 26, k: 172, ph: 6.3, ec: 0.8, moisture: 30, temp: 23.6, offline: true },
  { plotIdx: 6, deviceIdx: 4, hoursAgo: 18, n: 33, p: 20, k: 140, ph: 6.0, ec: 1.0, moisture: 27, temp: 22.2 },
  { plotIdx: 7, deviceIdx: 4, hoursAgo: 42, n: 29, p: 17, k: 125, ph: 5.8, ec: 1.05, moisture: 25, temp: 22.8 },
  { plotIdx: 8, deviceIdx: 1, hoursAgo: 11, n: 47, p: 28, k: 178, ph: 6.4, ec: 0.78, moisture: 32, temp: 23.0 },
  { plotIdx: 9, deviceIdx: 1, hoursAgo: 36, n: 20, p: 13, k: 98, ph: 5.5, ec: 1.35, moisture: 20, temp: 26.9 },
];

export const mockSoilReadings: MockSoilReading[] = READING_SEEDS.map((s, i) => {
  const plot = mockPlots[s.plotIdx];
  const device = mockDevices[s.deviceIdx];
  const takenAt = ago(s.hoursAgo * HOUR);
  return {
    id: uuid(`reading-${i}`),
    device_id: device.id,
    farmer_id: plot.farmer_id,
    plot_id: plot.id,
    nitrogen_mg_kg: s.n,
    phosphorus_mg_kg: s.p,
    potassium_mg_kg: s.k,
    ph: s.ph,
    electrical_conductivity_ds_m: s.ec,
    moisture_percent: s.moisture,
    temperature_celsius: s.temp,
    raw_payload: { source: "mock", sensor_batch: i + 1 },
    was_offline_sync: !!s.offline,
    reading_taken_at: takenAt,
    synced_at: takenAt,
    created_at: takenAt,
    farmer: farmerRef(plot.farmer_id, ["id", "full_name", "phone_number", "language"]),
    plot: plotRef(plot.id, ["id", "plot_name", "crop", "crop_other", "growth_stage"]),
    device: deviceRef(device.id, ["id", "serial_number"]),
  };
});

export interface MockRecommendation {
  id: string;
  reading_id: string | null;
  farmer_id: string | null;
  plot_id: string | null;
  crop: string;
  language: string;
  recommendation_text: string;
  action_items: unknown;
  alerts: unknown;
  tokens_used: number | null;
  model_used: string | null;
  delivered_via_whatsapp: boolean;
  whatsapp_message_sid: string | null;
  whatsapp_sent_at: string | null;
  created_at: string;
  farmer?: { full_name?: string };
  plot?: { crop_other?: string | null };
}

interface RecSeed {
  readingIdx: number;
  hoursAgo: number;
  language: string;
  text: string;
  actionItems: { action: string; urgency: "immediate" | "soon" | "monitor"; timing: string }[];
  alerts: { parameter: string; level: "warning" | "critical"; message: string }[];
  delivered?: boolean;
}

const REC_SEEDS: RecSeed[] = [
  { readingIdx: 3, hoursAgo: 7, language: "nd", delivered: true,
    text: "Umhlabathi wakho usenitrogen kanye lephosphorus okuphansi okukhulu. Faka umanyolo we-compound D masinyane futhi unike amanzi kabili ngosuku.",
    actionItems: [{ action: "Faka i-compound D fertiliser", urgency: "immediate", timing: "Lamuhla noma kusasa" }, { action: "Thelela amanzi kakhulu ekuseni lantambama", urgency: "soon", timing: "Kusukela manje" }],
    alerts: [{ parameter: "nitrogen", level: "critical", message: "Nitrogen is critically low for tomatoes at flowering stage" }, { parameter: "moisture", level: "warning", message: "Soil moisture trending below the 20% target" }] },
  { readingIdx: 7, hoursAgo: 13, language: "sn", delivered: true,
    text: "Mavhu enyu ari kuda kudiridzwa zvakanyanya uye ane phosphorus shoma. Wedzerai mvura uye isai fertiliser ine phosphorus pakukurumidza.",
    actionItems: [{ action: "Wedzera kudiridza pa hectare", urgency: "soon", timing: "Mazuva maviri anotevera" }, { action: "Isa single super phosphate", urgency: "soon", timing: "Vhiki rino" }],
    alerts: [{ parameter: "phosphorus", level: "warning", message: "Phosphorus below recommended range for cabbage at harvest" }] },
  { readingIdx: 8, hoursAgo: 5, language: "nd", delivered: false,
    text: "Umhlabathi wakho usemzantsi okuhle, kodwa ujuba lwendawo ulutshone okuncane. Gcina ukunisela njengoba unjalo, qaphela amanzi.",
    actionItems: [{ action: "Gcina uhlelo lokunisela olukhona", urgency: "monitor", timing: "Qhubeka nsuku zonke" }],
    alerts: [] },
  { readingIdx: 0, hoursAgo: 1, language: "nd", delivered: true,
    text: "Izinga le-nitrogen kanye le-potassium ziphakathi nendawo enhle. Landela uhlelo lwakho lokunisela.",
    actionItems: [{ action: "Hlola umumo wamahlamvu ngeviki", urgency: "monitor", timing: "Maviki amabili azayo" }],
    alerts: [] },
  { readingIdx: 9, hoursAgo: 31, language: "sn", delivered: false,
    text: "Mavhu enyu ane phosphorus uye nitrogen shoma. Tomatoes dzichada kudyiwa fertiliser ine NPK yakaenzana mukati memazuva mashanu.",
    actionItems: [{ action: "Isa NPK 7:14:7 compound fertiliser", urgency: "soon", timing: "Mukati memazuva mashanu" }, { action: "Cherechedza mavara emashizha ekati pasvika fertiliser yaiswa", urgency: "monitor", timing: "Vhiki rino" }],
    alerts: [{ parameter: "nitrogen", level: "warning", message: "Nitrogen trending low for tomatoes" }, { parameter: "phosphorus", level: "warning", message: "Phosphorus below target range" }] },
  { readingIdx: 4, hoursAgo: 33, language: "nd", delivered: true,
    text: "Ama-EC aphezulu kancane kulokho okufanele kube khona kuma-tomatoes. Gezani umhlabathi ngamanzi amanengi okukodwa ngakinye lapho usanisela.",
    actionItems: [{ action: "Hlanza umhlabathi ngamanzi amaningi okukodwa", urgency: "soon", timing: "Kulesi sonto" }],
    alerts: [{ parameter: "electrical_conductivity", level: "warning", message: "EC slightly elevated — risk of salt build-up" }] },
  { readingIdx: 1, hoursAgo: 27, language: "nd", delivered: true,
    text: "Yonke imibalo isezingeni elihle lamabele asesigabeni sokukhula. Qhubeka ngohlelo lwakho.",
    actionItems: [{ action: "Qhubeka ngohlelo lokunisela olukhona", urgency: "monitor", timing: "Maviki amabili" }],
    alerts: [] },
  { readingIdx: 10, hoursAgo: 55, language: "nd", delivered: false,
    text: "Umhlabathi unesimo esihle, kodwa kunokuncipha kancane kwamanzi ngenxa yokuthi izulu beliyekile ukuna. Hlola njalo.",
    actionItems: [{ action: "Hlola ubumanzi bomhlabathi nsuku zonke", urgency: "monitor", timing: "Iviki elizayo" }],
    alerts: [{ parameter: "moisture", level: "warning", message: "Moisture trending downward — monitor closely" }] },
  { readingIdx: 12, hoursAgo: 43, language: "sn", delivered: true,
    text: "Mavhu emunda wenyu ane nitrogen uye phosphorus shoma zvichikanganisa kukura kwemiti. Isai manure kana fertiliser ine NPK pakukurumidza.",
    actionItems: [{ action: "Isa manure yakasiyana", urgency: "soon", timing: "Vhiki rino" }, { action: "Cherechedza marudzi emashizha", urgency: "monitor", timing: "Mazuva gumi" }],
    alerts: [{ parameter: "nitrogen", level: "warning", message: "Nitrogen below target for groundnuts at vegetative stage" }] },
  { readingIdx: 6, hoursAgo: 29, language: "en", delivered: false,
    text: "Soil readings for the maize plot look strong across all key parameters. Moisture and pH are within the optimal band for the fruiting stage — keep up the current watering schedule.",
    actionItems: [{ action: "Maintain current irrigation schedule", urgency: "monitor", timing: "Ongoing" }],
    alerts: [] },
];

export const mockRecommendations: MockRecommendation[] = REC_SEEDS.map((s, i) => {
  const reading = mockSoilReadings[s.readingIdx];
  const plot = mockPlots.find((p) => p.id === reading.plot_id)!;
  const createdAt = ago(s.hoursAgo * HOUR);
  return {
    id: uuid(`rec-${i}`),
    reading_id: reading.id,
    farmer_id: reading.farmer_id,
    plot_id: reading.plot_id,
    crop: plot.crop,
    language: s.language,
    recommendation_text: s.text,
    action_items: s.actionItems,
    alerts: s.alerts,
    tokens_used: jitter(620, 80),
    model_used: "claude-sonnet-4-6",
    delivered_via_whatsapp: !!s.delivered,
    whatsapp_message_sid: s.delivered ? `SM${uuid(`rec-sid-${i}`).replace(/-/g, "").slice(0, 30)}` : null,
    whatsapp_sent_at: s.delivered ? createdAt : null,
    created_at: createdAt,
    farmer: farmerRef(reading.farmer_id, ["full_name"]) as { full_name?: string },
    plot: { crop_other: plot.crop_other },
  };
});

export interface MockRevenueRecord {
  id: string;
  farmer_id: string | null;
  device_id: string | null;
  record_type: string;
  amount_usd: number;
  period_month: number | null;
  period_year: number | null;
  status: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

function monthsAgo(n: number): { month: number; year: number } {
  const d = new Date(NOW);
  d.setMonth(d.getMonth() - n);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

const REVENUE_SEEDS: { farmerIdx: number; type: string; amount: number; monthsBack: number; status: string; paid: boolean }[] = [
  { farmerIdx: 0, type: "rental", amount: 5, monthsBack: 0, status: "paid", paid: true },
  { farmerIdx: 1, type: "rental", amount: 5, monthsBack: 0, status: "pending", paid: false },
  { farmerIdx: 2, type: "rental", amount: 5, monthsBack: 0, status: "paid", paid: true },
  { farmerIdx: 4, type: "rental", amount: 5, monthsBack: 0, status: "overdue", paid: false },
  { farmerIdx: 0, type: "rental", amount: 5, monthsBack: 1, status: "paid", paid: true },
  { farmerIdx: 1, type: "rental", amount: 5, monthsBack: 1, status: "paid", paid: true },
  { farmerIdx: 2, type: "data_insights", amount: 12, monthsBack: 1, status: "paid", paid: true },
  { farmerIdx: 3, type: "rental", amount: 5, monthsBack: 1, status: "waived", paid: false },
  { farmerIdx: 4, type: "irrigation_kit", amount: 45, monthsBack: 2, status: "paid", paid: true },
  { farmerIdx: 0, type: "rental", amount: 5, monthsBack: 2, status: "paid", paid: true },
];

export const mockRevenueRecords: MockRevenueRecord[] = REVENUE_SEEDS.map((s, i) => {
  const { month, year } = monthsAgo(s.monthsBack);
  const farmer = mockFarmers[s.farmerIdx];
  const device = mockDevices.find((d) => d.farmer_id === farmer.id) ?? null;
  return {
    id: uuid(`revenue-${i}`),
    farmer_id: farmer.id,
    device_id: device?.id ?? null,
    record_type: s.type,
    amount_usd: s.amount,
    period_month: month,
    period_year: year,
    status: s.status,
    paid_at: s.paid ? ago((s.monthsBack * 30 + jitter(3, 2)) * DAY) : null,
    notes: null,
    created_at: ago((s.monthsBack * 30 + jitter(5, 2)) * DAY),
  };
});

export interface MockWhatsAppMessage {
  id: string;
  farmer_id: string | null;
  direction: string;
  message_body: string;
  language: string | null;
  twilio_sid: string | null;
  status: string | null;
  related_reading_id: string | null;
  created_at: string;
}

const WA_SEEDS: { farmerIdx: number; direction: "inbound" | "outbound"; body: string; language: string; status: string | null; hoursAgo: number }[] = [
  { farmerIdx: 0, direction: "outbound", body: "Sawubona Thandiwe, nansi imibiko yomhlabathi yakho yanamuhla. Izinga le-nitrogen liphansi — hlola i-app yakho ukuze ubone iziphakamiso.", language: "nd", status: "read", hoursAgo: 26 },
  { farmerIdx: 0, direction: "inbound", body: "Ngiyabonga, ngizokwenza njalo namhlanje.", language: "nd", status: null, hoursAgo: 25 },
  { farmerIdx: 0, direction: "outbound", body: "Siyajabula ukuzwa lokho! Sizoqhubeka sikulandelela.", language: "nd", status: "delivered", hoursAgo: 24 },
  { farmerIdx: 1, direction: "outbound", body: "Mhoro Tendai, mukoko wenyu wakuona zvakanaka mukati memazuva matatu apfuura. Phosphorus iri pasi zvishoma — onai zviratidzo mu-app.", language: "sn", status: "delivered", hoursAgo: 50 },
  { farmerIdx: 1, direction: "inbound", body: "Ndatenda. Ndichaongorora kubindu rangu mangwana.", language: "sn", status: null, hoursAgo: 48 },
  { farmerIdx: 2, direction: "outbound", body: "Sawubona Sipho, idivayisi yakho ayikathumeli imininingwane okwamanje. Sicela uhlole ukuxhumana kwayo.", language: "nd", status: "sent", hoursAgo: 30 },
  { farmerIdx: 2, direction: "inbound", body: "Ngizoyihlola ekuseni, ngiyabonga ngokungazisa.", language: "nd", status: null, hoursAgo: 28 },
  { farmerIdx: 3, direction: "outbound", body: "Hi Nomvula, your subscription is currently paused. Reply RESUME to start receiving readings again.", language: "en", status: "failed", hoursAgo: 70 },
  { farmerIdx: 4, direction: "outbound", body: "Mhoro Farai, mukoko wenyu uri kukura zvakanaka. Hapana zviratidzo zvinotyisa parizvino — rambai muchidiridza sezvamuri kuita.", language: "sn", status: "read", hoursAgo: 6 },
  { farmerIdx: 4, direction: "inbound", body: "Zvakanaka, ndatenda nekutariswa kwenyu kwemazuva ese.", language: "sn", status: null, hoursAgo: 5 },
];

export const mockWhatsAppMessages: MockWhatsAppMessage[] = WA_SEEDS.map((s, i) => ({
  id: uuid(`wa-${i}`),
  farmer_id: mockFarmers[s.farmerIdx].id,
  direction: s.direction,
  message_body: s.body,
  language: s.language,
  twilio_sid: s.direction === "outbound" ? `SM${uuid(`wa-sid-${i}`).replace(/-/g, "").slice(0, 30)}` : `SM${uuid(`wa-sid-in-${i}`).replace(/-/g, "").slice(0, 30)}`,
  status: s.status,
  related_reading_id: null,
  created_at: ago(s.hoursAgo * HOUR),
}));

export const mockTables = {
  farmers: mockFarmers,
  plots: mockPlots,
  devices: mockDevices,
  soil_readings: mockSoilReadings,
  ai_recommendations: mockRecommendations,
  revenue_records: mockRevenueRecords,
  whatsapp_messages: mockWhatsAppMessages,
} as const;

export type MockTableName = keyof typeof mockTables;

export const MOCK_USER = {
  id: uuid("mock-admin-user"),
  email: "admin@soilsense.demo",
  user_metadata: { full_name: "SoilSense Demo Admin" },
  app_metadata: {},
  aud: "authenticated",
  created_at: ago(365 * DAY),
};
