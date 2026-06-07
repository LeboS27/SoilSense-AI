export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: string;
  };
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Tables: {
      farmers: {
        Row: {
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
        };
        Insert: Partial<Database["public"]["Tables"]["farmers"]["Row"]> & {
          full_name: string;
          phone_number: string;
        };
        Update: Partial<Database["public"]["Tables"]["farmers"]["Row"]>;
        Relationships: [];
      };
      plots: {
        Row: {
          id: string;
          farmer_id: string | null;
          plot_name: string;
          crop: string;
          crop_other: string | null;
          growth_stage: string | null;
          size_hectares: number | null;
          latitude: number | null;
          longitude: number | null;
          location_description: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plots"]["Row"]> & {
          plot_name: string;
          crop: string;
        };
        Update: Partial<Database["public"]["Tables"]["plots"]["Row"]>;
        Relationships: [];
      };
      devices: {
        Row: {
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
        };
        Insert: Partial<Database["public"]["Tables"]["devices"]["Row"]> & {
          serial_number: string;
        };
        Update: Partial<Database["public"]["Tables"]["devices"]["Row"]>;
        Relationships: [];
      };
      soil_readings: {
        Row: {
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
          raw_payload: Json | null;
          was_offline_sync: boolean;
          reading_taken_at: string;
          synced_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["soil_readings"]["Row"]> & {
          reading_taken_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["soil_readings"]["Row"]>;
        Relationships: [];
      };
      ai_recommendations: {
        Row: {
          id: string;
          reading_id: string | null;
          farmer_id: string | null;
          plot_id: string | null;
          crop: string;
          language: string;
          recommendation_text: string;
          action_items: Json | null;
          alerts: Json | null;
          tokens_used: number | null;
          model_used: string | null;
          delivered_via_whatsapp: boolean;
          whatsapp_message_sid: string | null;
          whatsapp_sent_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_recommendations"]["Row"]> & {
          crop: string;
          recommendation_text: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_recommendations"]["Row"]>;
        Relationships: [];
      };
      revenue_records: {
        Row: {
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
        };
        Insert: Partial<Database["public"]["Tables"]["revenue_records"]["Row"]> & {
          record_type: string;
          amount_usd: number;
        };
        Update: Partial<Database["public"]["Tables"]["revenue_records"]["Row"]>;
        Relationships: [];
      };
      whatsapp_messages: {
        Row: {
          id: string;
          farmer_id: string | null;
          direction: string;
          message_body: string;
          language: string | null;
          twilio_sid: string | null;
          status: string | null;
          related_reading_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["whatsapp_messages"]["Row"]> & {
          direction: string;
          message_body: string;
        };
        Update: Partial<Database["public"]["Tables"]["whatsapp_messages"]["Row"]>;
        Relationships: [];
      };
    };
  };
}
