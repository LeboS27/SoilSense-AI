-- SoilSense AI initial schema
create extension if not exists "pgcrypto";

-- ═══════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════

create table if not exists farmers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text not null unique,
  language text not null default 'en',
  district text not null default 'Imbizo',
  province text not null default 'Bulawayo Metropolitan',
  gender text,
  cooperative text,
  is_active boolean default true,
  subscription_status text default 'active',
  subscription_start_date date,
  monthly_fee_usd numeric(6,2) default 5.00,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint farmers_language_check check (language in ('en', 'sn', 'nd')),
  constraint farmers_gender_check check (gender is null or gender in ('male', 'female', 'other')),
  constraint farmers_subscription_status_check check (subscription_status in ('active', 'paused', 'cancelled'))
);

create table if not exists plots (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id) on delete cascade,
  plot_name text not null,
  crop text not null,
  crop_other text,
  growth_stage text,
  size_hectares numeric(8,4),
  latitude numeric(10,7),
  longitude numeric(10,7),
  location_description text,
  created_at timestamptz default now(),
  constraint plots_crop_check check (crop in ('maize', 'tomatoes', 'sweet_potatoes', 'beetroot', 'cabbage', 'other')),
  constraint plots_growth_stage_check check (growth_stage is null or growth_stage in ('germination', 'vegetative', 'flowering', 'fruiting', 'harvest'))
);

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  serial_number text not null unique,
  firmware_version text,
  status text default 'available',
  farmer_id uuid references farmers(id),
  deployed_at timestamptz,
  last_sync_at timestamptz,
  battery_level integer,
  signal_strength integer,
  offline_readings_count integer default 0,
  notes text,
  created_at timestamptz default now(),
  constraint devices_status_check check (status in ('available', 'deployed', 'maintenance', 'retired')),
  constraint devices_battery_check check (battery_level is null or (battery_level >= 0 and battery_level <= 100))
);

create table if not exists soil_readings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references devices(id),
  farmer_id uuid references farmers(id),
  plot_id uuid references plots(id),
  nitrogen_mg_kg numeric(8,2),
  phosphorus_mg_kg numeric(8,2),
  potassium_mg_kg numeric(8,2),
  ph numeric(4,2),
  electrical_conductivity_ds_m numeric(8,4),
  moisture_percent numeric(5,2),
  temperature_celsius numeric(5,2),
  raw_payload jsonb,
  was_offline_sync boolean default false,
  reading_taken_at timestamptz not null,
  synced_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid references soil_readings(id),
  farmer_id uuid references farmers(id),
  plot_id uuid references plots(id),
  crop text not null,
  language text not null default 'en',
  recommendation_text text not null,
  action_items jsonb,
  alerts jsonb,
  tokens_used integer,
  model_used text,
  delivered_via_whatsapp boolean default false,
  whatsapp_message_sid text,
  whatsapp_sent_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists revenue_records (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id),
  device_id uuid references devices(id),
  record_type text not null,
  amount_usd numeric(8,2) not null,
  period_month integer,
  period_year integer,
  status text default 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  constraint revenue_records_type_check check (record_type in ('rental', 'irrigation_kit', 'data_insights')),
  constraint revenue_records_status_check check (status in ('pending', 'paid', 'overdue', 'waived')),
  constraint revenue_records_month_check check (period_month is null or (period_month >= 1 and period_month <= 12))
);

create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references farmers(id),
  direction text not null,
  message_body text not null,
  language text,
  twilio_sid text,
  status text,
  related_reading_id uuid references soil_readings(id),
  created_at timestamptz default now(),
  constraint whatsapp_messages_direction_check check (direction in ('inbound', 'outbound')),
  constraint whatsapp_messages_status_check check (status is null or status in ('sent', 'delivered', 'read', 'failed'))
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

create index if not exists idx_plots_farmer_id on plots(farmer_id);

create index if not exists idx_devices_farmer_id on devices(farmer_id);

create index if not exists idx_soil_readings_farmer_id on soil_readings(farmer_id);
create index if not exists idx_soil_readings_device_id on soil_readings(device_id);
create index if not exists idx_soil_readings_plot_id on soil_readings(plot_id);
create index if not exists idx_soil_readings_reading_taken_at on soil_readings(reading_taken_at);
create index if not exists idx_soil_readings_created_at on soil_readings(created_at);

create index if not exists idx_ai_recommendations_farmer_id on ai_recommendations(farmer_id);
create index if not exists idx_ai_recommendations_reading_id on ai_recommendations(reading_id);
create index if not exists idx_ai_recommendations_plot_id on ai_recommendations(plot_id);
create index if not exists idx_ai_recommendations_created_at on ai_recommendations(created_at);

create index if not exists idx_revenue_records_farmer_id on revenue_records(farmer_id);
create index if not exists idx_revenue_records_device_id on revenue_records(device_id);
create index if not exists idx_revenue_records_created_at on revenue_records(created_at);

create index if not exists idx_whatsapp_messages_farmer_id on whatsapp_messages(farmer_id);
create index if not exists idx_whatsapp_messages_created_at on whatsapp_messages(created_at);

-- ═══════════════════════════════════════════════════════════════
-- updated_at trigger for farmers
-- ═══════════════════════════════════════════════════════════════

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_farmers_updated_at on farmers;
create trigger trg_farmers_updated_at
  before update on farmers
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- REALTIME
-- ═══════════════════════════════════════════════════════════════

alter publication supabase_realtime add table soil_readings;
alter publication supabase_realtime add table devices;
alter publication supabase_realtime add table ai_recommendations;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- service_role (used by API routes via the server client) bypasses RLS
-- automatically; these policies grant authenticated dashboard users
-- (the admin) full read/write access.
-- ═══════════════════════════════════════════════════════════════

alter table farmers enable row level security;
alter table plots enable row level security;
alter table devices enable row level security;
alter table soil_readings enable row level security;
alter table ai_recommendations enable row level security;
alter table revenue_records enable row level security;
alter table whatsapp_messages enable row level security;

create policy "Authenticated users can manage farmers" on farmers
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage plots" on plots
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage devices" on devices
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage soil_readings" on soil_readings
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage ai_recommendations" on ai_recommendations
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage revenue_records" on revenue_records
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage whatsapp_messages" on whatsapp_messages
  for all to authenticated using (true) with check (true);
