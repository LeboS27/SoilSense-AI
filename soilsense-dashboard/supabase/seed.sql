-- ═══════════════════════════════════════════════════════════════
-- SoilSense AI demo seed data
-- 5 farmers · 10 plots · 3 devices · 15 readings · 10 recommendations
-- ═══════════════════════════════════════════════════════════════

do $$
declare
  f1 uuid; f2 uuid; f3 uuid; f4 uuid; f5 uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid; p7 uuid; p8 uuid; p9 uuid; p10 uuid;
  d1 uuid; d2 uuid; d3 uuid;
  r1 uuid; r2 uuid; r3 uuid; r4 uuid; r5 uuid; r6 uuid; r7 uuid; r8 uuid; r9 uuid; r10 uuid;
  r11 uuid; r12 uuid; r13 uuid; r14 uuid; r15 uuid;
begin
  -- ── Farmers ──────────────────────────────────────────────────
  insert into farmers (full_name, phone_number, language, district, province, gender, cooperative, subscription_status, subscription_start_date, monthly_fee_usd, notes)
  values ('Thandiwe Ncube', '+263771234001', 'nd', 'Imbizo', 'Bulawayo Metropolitan', 'female', 'Imbizo Women Farmers Club', 'active', current_date - interval '120 days', 5.00, 'Reliable payer, very engaged with WhatsApp tips.')
  returning id into f1;

  insert into farmers (full_name, phone_number, language, district, province, gender, cooperative, subscription_status, subscription_start_date, monthly_fee_usd, notes)
  values ('Tendai Moyo', '+263772345002', 'sn', 'Nkulumane', 'Bulawayo Metropolitan', 'male', null, 'active', current_date - interval '95 days', 5.00, null)
  returning id into f2;

  insert into farmers (full_name, phone_number, language, district, province, gender, cooperative, subscription_status, subscription_start_date, monthly_fee_usd, notes)
  values ('Sipho Dube', '+263773456003', 'en', 'Lobengula', 'Bulawayo Metropolitan', 'male', 'Lobengula Cooperative', 'active', current_date - interval '70 days', 2.50, 'Discounted first month applied at signup.')
  returning id into f3;

  insert into farmers (full_name, phone_number, language, district, province, gender, cooperative, subscription_status, subscription_start_date, monthly_fee_usd, notes)
  values ('Nomvula Sibanda', '+263774567004', 'nd', 'Pumula', 'Bulawayo Metropolitan', 'female', 'Pumula Savings Club', 'paused', current_date - interval '200 days', 5.00, 'Paused subscription during off-season.')
  returning id into f4;

  insert into farmers (full_name, phone_number, language, district, province, gender, cooperative, subscription_status, subscription_start_date, monthly_fee_usd, notes)
  values ('Farai Chikomo', '+263775678005', 'sn', 'Entumbane', 'Matabeleland North', 'male', null, 'cancelled', current_date - interval '300 days', 5.00, 'Relocated outside coverage area; subscription cancelled.')
  returning id into f5;

  -- ── Plots ────────────────────────────────────────────────────
  insert into plots (farmer_id, plot_name, crop, growth_stage, size_hectares, latitude, longitude, location_description)
  values (f1, 'North Plot', 'maize', 'vegetative', 1.20, -20.1325, 28.6022, 'Behind the homestead, near the borehole')
  returning id into p1;
  insert into plots (farmer_id, plot_name, crop, growth_stage, size_hectares, latitude, longitude, location_description)
  values (f1, 'River Field', 'tomatoes', 'flowering', 0.40, -20.1352, 28.6051, 'Along the seasonal river bank')
  returning id into p2;

  insert into plots (farmer_id, plot_name, crop, growth_stage, size_hectares, latitude, longitude, location_description)
  values (f2, 'Home Garden', 'cabbage', 'fruiting', 0.25, -20.1180, 28.5640, 'Fenced garden behind the house')
  returning id into p3;
  insert into plots (farmer_id, plot_name, crop, growth_stage, size_hectares, latitude, longitude, location_description)
  values (f2, 'East Maize Field', 'maize', 'germination', 2.00, -20.1199, 28.5688, 'Large field shared with neighbour')
  returning id into p4;

  insert into plots (farmer_id, plot_name, crop, growth_stage, size_hectares, latitude, longitude, location_description)
  values (f3, 'Sweet Potato Patch', 'sweet_potatoes', 'vegetative', 0.60, -20.1622, 28.5450, 'Near the cattle kraal')
  returning id into p5;
  insert into plots (farmer_id, plot_name, crop, growth_stage, size_hectares, latitude, longitude, location_description)
  values (f3, 'Beetroot Bed', 'beetroot', 'germination', 0.15, -20.1640, 28.5478, 'Raised beds next to the well')
  returning id into p6;

  insert into plots (farmer_id, plot_name, crop, growth_stage, size_hectares, latitude, longitude, location_description)
  values (f4, 'Tomato Greenhouse', 'tomatoes', 'flowering', 0.10, -20.0950, 28.6210, 'Small shade-net structure')
  returning id into p7;
  insert into plots (farmer_id, plot_name, crop, growth_stage, size_hectares, latitude, longitude, location_description)
  values (f4, 'Maize Outfield', 'maize', 'harvest', 1.80, -20.0978, 28.6255, 'Communal land plot, eastern boundary')
  returning id into p8;

  insert into plots (farmer_id, plot_name, crop, growth_stage, size_hectares, latitude, longitude, location_description)
  values (f5, 'Cabbage Rows', 'cabbage', 'vegetative', 0.30, -19.9810, 28.7340, 'Terraced rows on the hillside')
  returning id into p9;
  insert into plots (farmer_id, plot_name, crop, crop_other, growth_stage, size_hectares, latitude, longitude, location_description)
  values (f5, 'Groundnut Trial', 'other', 'Groundnuts', 'flowering', 0.50, -19.9845, 28.7390, 'Experimental intercropping plot')
  returning id into p10;

  -- ── Devices ──────────────────────────────────────────────────
  insert into devices (serial_number, firmware_version, status, farmer_id, deployed_at, last_sync_at, battery_level, signal_strength, offline_readings_count, notes)
  values ('SSA-001', '1.4.2', 'deployed', f1, current_date - interval '110 days', now() - interval '2 hours', 78, 84, 0, null)
  returning id into d1;

  insert into devices (serial_number, firmware_version, status, farmer_id, deployed_at, last_sync_at, battery_level, signal_strength, offline_readings_count, notes)
  values ('SSA-002', '1.4.2', 'deployed', f2, current_date - interval '90 days', now() - interval '18 hours', 34, 61, 3, 'Battery running low; flagged for replacement on next visit.')
  returning id into d2;

  insert into devices (serial_number, firmware_version, status, farmer_id, deployed_at, last_sync_at, battery_level, signal_strength, offline_readings_count, notes)
  values ('SSA-003', '1.3.8', 'deployed', f3, current_date - interval '65 days', now() - interval '4 days', 56, 42, 7, 'Intermittent connectivity in this area; syncs in batches.')
  returning id into d3;

  insert into devices (serial_number, firmware_version, status, farmer_id, deployed_at, last_sync_at, battery_level, signal_strength, offline_readings_count, notes)
  values ('SSA-004', '1.4.2', 'available', null, null, null, 100, null, 0, 'Newly provisioned, awaiting deployment.');

  insert into devices (serial_number, firmware_version, status, farmer_id, deployed_at, last_sync_at, battery_level, signal_strength, offline_readings_count, notes)
  values ('SSA-005', '1.2.1', 'maintenance', null, current_date - interval '180 days', now() - interval '40 days', 12, 0, 0, 'Returned for sensor recalibration.');

  -- ── Soil readings (15 total, spread over the last ~25 days) ──
  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d1, f1, p1, 112, 28, 118, 6.3, 0.45, 68, 24.5, false, now() - interval '1 day')
  returning id into r1;
  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d1, f1, p1, 95, 24, 102, 6.0, 0.40, 64, 23.8, false, now() - interval '4 days')
  returning id into r2;
  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d1, f1, p2, 145, 42, 210, 6.5, 0.55, 71, 26.1, false, now() - interval '2 days')
  returning id into r3;
  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d1, f1, p2, 60, 18, 130, 5.4, 1.9, 50, 29.4, false, now() - interval '8 days')
  returning id into r4;

  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d2, f2, p3, 130, 38, 150, 6.4, 0.6, 76, 21.0, false, now() - interval '1 day')
  returning id into r5;
  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d2, f2, p4, 40, 12, 60, 5.1, 0.15, 38, 31.2, true, now() - interval '6 days')
  returning id into r6;
  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d2, f2, p4, 88, 22, 95, 6.1, 0.5, 65, 25.0, false, now() - interval '12 days')
  returning id into r7;
  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d2, f2, p3, 105, 32, 140, 6.2, 0.55, 72, 22.4, false, now() - interval '3 days')
  returning id into r8;

  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d3, f3, p5, 70, 28, 145, 5.9, 0.35, 66, 23.5, true, now() - interval '5 days')
  returning id into r9;
  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d3, f3, p6, 110, 35, 130, 6.3, 0.45, 70, 22.1, false, now() - interval '2 days')
  returning id into r10;
  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d3, f3, p5, 30, 10, 70, 5.0, 1.7, 42, 32.5, true, now() - interval '14 days')
  returning id into r11;
  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d3, f3, p6, 95, 30, 120, 6.1, 0.4, 73, 21.6, false, now() - interval '9 days')
  returning id into r12;

  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d1, f1, p1, 120, 30, 122, 6.2, 0.48, 67, 24.0, false, now() - interval '11 days')
  returning id into r13;
  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d2, f2, p3, 60, 15, 80, 5.3, 1.6, 45, 30.8, false, now() - interval '16 days')
  returning id into r14;
  insert into soil_readings (device_id, farmer_id, plot_id, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, ph, electrical_conductivity_ds_m, moisture_percent, temperature_celsius, was_offline_sync, reading_taken_at)
  values (d3, f3, p5, 102, 33, 138, 6.0, 0.42, 68, 23.0, false, now() - interval '20 days')
  returning id into r15;

  -- ── AI recommendations (10 total) ────────────────────────────
  insert into ai_recommendations (reading_id, farmer_id, plot_id, crop, language, recommendation_text, action_items, alerts, tokens_used, model_used, delivered_via_whatsapp, whatsapp_sent_at)
  values (r1, f1, p1, 'maize', 'nd',
    'Imisoka yenu yomumba imi kahle khathesi. Qhubekani lokunisela okufaneleyo kwezinsuku ezizayo ukuze izithelo zibe ngcono.',
    '[{"action":"Maintain current irrigation schedule","urgency":"monitor","timing":"Ongoing"},{"action":"Apply a light topdressing of nitrogen before tasseling","urgency":"soon","timing":"Within 7 days"}]'::jsonb,
    '[]'::jsonb,
    642, 'claude-sonnet-4-20250514', true, now() - interval '20 hours');

  insert into ai_recommendations (reading_id, farmer_id, plot_id, crop, language, recommendation_text, action_items, alerts, tokens_used, model_used, delivered_via_whatsapp, whatsapp_sent_at)
  values (r4, f1, p2, 'tomatoes', 'nd',
    'Umhlabathi wenu uleSalt ephezulu njalo ulamanzi amancane. Faka amanzi khathesi nje futhi ungafaki umanyolo olamasawodo okwesikhatshana.',
    '[{"action":"Increase irrigation frequency immediately","urgency":"immediate","timing":"Today"},{"action":"Flush soil with clean water to reduce salinity","urgency":"immediate","timing":"Within 24 hours"},{"action":"Avoid additional fertiliser until EC normalises","urgency":"soon","timing":"Next 2 weeks"}]'::jsonb,
    '[{"parameter":"electrical_conductivity_ds_m","level":"critical","message":"Salt levels are dangerously high for tomatoes"},{"parameter":"moisture_percent","level":"warning","message":"Soil moisture is below the optimal range"}]'::jsonb,
    781, 'claude-sonnet-4-20250514', true, now() - interval '7 days');

  insert into ai_recommendations (reading_id, farmer_id, plot_id, crop, language, recommendation_text, action_items, alerts, tokens_used, model_used, delivered_via_whatsapp, whatsapp_sent_at)
  values (r5, f2, p3, 'cabbage', 'sn',
    'Mavhu enyu ari panhanho yakanaka kuderera kwezvisikwa. Rambai muchidiridza zvakafanana uye ongororai mashizha emasabhaga emasvondo ari kutevera.',
    '[{"action":"Continue current watering routine","urgency":"monitor","timing":"Ongoing"},{"action":"Inspect for pests on outer leaves","urgency":"soon","timing":"This week"}]'::jsonb,
    '[]'::jsonb,
    598, 'claude-sonnet-4-20250514', true, now() - interval '22 hours');

  insert into ai_recommendations (reading_id, farmer_id, plot_id, crop, language, recommendation_text, action_items, alerts, tokens_used, model_used, delivered_via_whatsapp, whatsapp_sent_at)
  values (r6, f2, p4, 'maize', 'sn',
    'Nitrogen ne pH yenyu zviri pasi pezvinodiwa. Isai manyowa nguva nguva uye diridzai zvakawanda kuti mbeu dzimere zvakanaka.',
    '[{"action":"Apply nitrogen-rich fertiliser (e.g. urea or compost)","urgency":"immediate","timing":"Within 2 days"},{"action":"Increase irrigation to support germination","urgency":"immediate","timing":"Today"},{"action":"Re-test soil pH after two weeks of treatment","urgency":"soon","timing":"In 14 days"}]'::jsonb,
    '[{"parameter":"nitrogen_mg_kg","level":"critical","message":"Nitrogen is far below the level maize needs to establish"},{"parameter":"ph","level":"warning","message":"Soil is more acidic than ideal for maize"},{"parameter":"moisture_percent","level":"critical","message":"Soil moisture is critically low for germination"}]'::jsonb,
    832, 'claude-sonnet-4-20250514', false, null);

  insert into ai_recommendations (reading_id, farmer_id, plot_id, crop, language, recommendation_text, action_items, alerts, tokens_used, model_used, delivered_via_whatsapp, whatsapp_sent_at)
  values (r9, f3, p5, 'sweet_potatoes', 'en',
    'Your sweet potato plot is showing slightly low nitrogen levels. A small application of organic compost in the next week should help vines fill out before the next reading.',
    '[{"action":"Apply organic compost or manure around the base of plants","urgency":"soon","timing":"Within 7 days"},{"action":"Continue regular watering","urgency":"monitor","timing":"Ongoing"}]'::jsonb,
    '[{"parameter":"nitrogen_mg_kg","level":"warning","message":"Nitrogen is a little below the optimal range for sweet potatoes"}]'::jsonb,
    615, 'claude-sonnet-4-20250514', true, now() - interval '4 days');

  insert into ai_recommendations (reading_id, farmer_id, plot_id, crop, language, recommendation_text, action_items, alerts, tokens_used, model_used, delivered_via_whatsapp, whatsapp_sent_at)
  values (r11, f3, p5, 'sweet_potatoes', 'en',
    'Soil conditions on this plot need urgent attention — nitrogen, moisture and salinity are all outside the safe range for sweet potatoes. Please water deeply today and avoid adding any more fertiliser until levels recover.',
    '[{"action":"Water deeply and immediately","urgency":"immediate","timing":"Today"},{"action":"Stop fertiliser application until EC drops","urgency":"immediate","timing":"Until next reading"},{"action":"Add compost once moisture stabilises","urgency":"soon","timing":"In about a week"}]'::jsonb,
    '[{"parameter":"nitrogen_mg_kg","level":"critical","message":"Nitrogen is critically low for sweet potatoes"},{"parameter":"electrical_conductivity_ds_m","level":"critical","message":"Salinity is dangerously high"},{"parameter":"moisture_percent","level":"critical","message":"Soil is far too dry"}]'::jsonb,
    901, 'claude-sonnet-4-20250514', true, now() - interval '13 days');

  insert into ai_recommendations (reading_id, farmer_id, plot_id, crop, language, recommendation_text, action_items, alerts, tokens_used, model_used, delivered_via_whatsapp, whatsapp_sent_at)
  values (r10, f3, p6, 'beetroot', 'en',
    'Your beetroot bed is in great shape — nutrients and moisture are well balanced for the germination stage. Keep up the current routine and check again in a week.',
    '[{"action":"Maintain current watering and care routine","urgency":"monitor","timing":"Ongoing"}]'::jsonb,
    '[]'::jsonb,
    540, 'claude-sonnet-4-20250514', false, null);

  insert into ai_recommendations (reading_id, farmer_id, plot_id, crop, language, recommendation_text, action_items, alerts, tokens_used, model_used, delivered_via_whatsapp, whatsapp_sent_at)
  values (r3, f1, p2, 'tomatoes', 'nd',
    'Izithelo zenu zikahle kakhulu khathesi futhi yonke into isemazingeni afaneleyo. Qhubekani ngendlela elifaka ngayo amanzi.',
    '[{"action":"Continue current irrigation and feeding schedule","urgency":"monitor","timing":"Ongoing"},{"action":"Support heavier branches as fruit develops","urgency":"soon","timing":"In the coming weeks"}]'::jsonb,
    '[]'::jsonb,
    577, 'claude-sonnet-4-20250514', true, now() - interval '46 hours');

  insert into ai_recommendations (reading_id, farmer_id, plot_id, crop, language, recommendation_text, action_items, alerts, tokens_used, model_used, delivered_via_whatsapp, whatsapp_sent_at)
  values (r2, f1, p1, 'maize', 'nd',
    'Imibhalo yenu iqondile kepha amafutha, i-pH lamanzi kuseduze lomngcele ongaphansi. Nika imbewu umanyolo omncane lamanzi angeziwe ngalesi sikhathi.',
    '[{"action":"Apply a light nitrogen topdressing","urgency":"soon","timing":"This week"},{"action":"Slightly increase irrigation frequency","urgency":"soon","timing":"Next 5 days"}]'::jsonb,
    '[{"parameter":"moisture_percent","level":"warning","message":"Moisture is on the low edge of the optimal range"}]'::jsonb,
    603, 'claude-sonnet-4-20250514', true, now() - interval '4 days');

  insert into ai_recommendations (reading_id, farmer_id, plot_id, crop, language, recommendation_text, action_items, alerts, tokens_used, model_used, delivered_via_whatsapp, whatsapp_sent_at)
  values (r8, f2, p3, 'cabbage', 'sn',
    'Mavhu emasabhaga enyu ari kufambira mberi zvakanaka. Sononoka kushandisa manyowa kusvika pawanyatso ona kuti mashizha okumusoro asimba.',
    '[{"action":"Hold off on additional fertiliser for now","urgency":"monitor","timing":"Until next reading"},{"action":"Inspect outer leaves for early pest signs","urgency":"soon","timing":"This week"}]'::jsonb,
    '[]'::jsonb,
    566, 'claude-sonnet-4-20250514', false, null);

  -- ── Revenue records ──────────────────────────────────────────
  insert into revenue_records (farmer_id, device_id, record_type, amount_usd, period_month, period_year, status, paid_at)
  values
    (f1, d1, 'rental', 5.00, extract(month from current_date - interval '1 month')::int, extract(year from current_date - interval '1 month')::int, 'paid', now() - interval '25 days'),
    (f1, d1, 'rental', 5.00, extract(month from current_date)::int, extract(year from current_date)::int, 'pending', null),
    (f2, d2, 'rental', 5.00, extract(month from current_date - interval '1 month')::int, extract(year from current_date - interval '1 month')::int, 'paid', now() - interval '28 days'),
    (f2, d2, 'rental', 5.00, extract(month from current_date)::int, extract(year from current_date)::int, 'overdue', null),
    (f3, d3, 'rental', 2.50, extract(month from current_date - interval '1 month')::int, extract(year from current_date - interval '1 month')::int, 'paid', now() - interval '20 days'),
    (f3, d3, 'rental', 2.50, extract(month from current_date)::int, extract(year from current_date)::int, 'pending', null),
    (f1, d1, 'data_insights', 1.50, extract(month from current_date - interval '1 month')::int, extract(year from current_date - interval '1 month')::int, 'paid', now() - interval '25 days'),
    (f4, null, 'irrigation_kit', 18.00, extract(month from current_date - interval '3 months')::int, extract(year from current_date - interval '3 months')::int, 'paid', now() - interval '90 days'),
    (f5, null, 'rental', 5.00, extract(month from current_date - interval '4 months')::int, extract(year from current_date - interval '4 months')::int, 'waived', null),
    (f2, d2, 'data_insights', 1.50, extract(month from current_date)::int, extract(year from current_date)::int, 'pending', null);

  -- ── WhatsApp messages ────────────────────────────────────────
  insert into whatsapp_messages (farmer_id, direction, message_body, language, status, related_reading_id, created_at)
  values
    (f1, 'outbound', 'Imisoka yenu yomumba imi kahle khathesi. Qhubekani lokunisela okufaneleyo kwezinsuku ezizayo ukuze izithelo zibe ngcono.', 'nd', 'delivered', r1, now() - interval '20 hours'),
    (f1, 'inbound', 'Ngiyabonga kakhulu! Sengizakwenza njalo.', 'nd', null, now() - interval '19 hours'),
    (f1, 'outbound', 'Siyabonga Thandiwe. Umlayezo wakho usufikile kwiqembu le-SoilSense AI.', 'nd', 'sent', null, now() - interval '19 hours'),
    (f1, 'outbound', 'Umhlabathi wenu uleSalt ephezulu njalo ulamanzi amancane. Faka amanzi khathesi nje futhi ungafaki umanyolo olamasawodo okwesikhatshana.', 'nd', 'read', r4, now() - interval '7 days'),
    (f2, 'outbound', 'Mavhu enyu ari panhanho yakanaka kuderera kwezvisikwa. Rambai muchidiridza zvakafanana uye ongororai mashizha emasabhaga emasvondo ari kutevera.', 'sn', 'delivered', r5, now() - interval '22 hours'),
    (f2, 'inbound', 'Ndatenda nemashoko enyu, ndichaita sezvamataura.', 'sn', null, now() - interval '21 hours'),
    (f2, 'outbound', 'Tatenda Tendai. Meseji yenyu yagamuchirwa neSoilSense AI team.', 'sn', 'sent', null, now() - interval '21 hours'),
    (f3, 'outbound', 'Your sweet potato plot is showing slightly low nitrogen levels. A small application of organic compost in the next week should help vines fill out before the next reading.', 'en', 'delivered', r9, now() - interval '4 days'),
    (f3, 'inbound', 'Thanks, I will get compost from the cooperative this weekend.', 'en', null, now() - interval '4 days' + interval '40 minutes'),
    (f3, 'outbound', 'Soil conditions on this plot need urgent attention — nitrogen, moisture and salinity are all outside the safe range for sweet potatoes. Please water deeply today and avoid adding any more fertiliser until levels recover.', 'en', 'failed', r11, now() - interval '13 days');

end $$;
