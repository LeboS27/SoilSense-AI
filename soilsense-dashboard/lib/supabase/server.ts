import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { createMockClient, isSupabaseConfigured } from "./mock-client";

type ServerClient = ReturnType<typeof createServerClient<Database>>;
type ServiceClient = ReturnType<typeof createSupabaseClient<Database>>;

/**
 * Falls back to an in-memory mock client when no Supabase project is
 * configured, so the dashboard runs as a browsable prototype out of the box.
 */
export function createClient(): ServerClient {
  if (!isSupabaseConfigured()) {
    return createMockClient() as unknown as ServerClient;
  }

  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component; ignore if middleware refreshes sessions
          }
        },
      },
    }
  );
}

/**
 * Service-role client for API routes that must bypass RLS
 * (device ingestion, Claude recommendations, Twilio webhooks).
 * Never expose this client or its key to the browser.
 */
export function createServiceClient(): ServiceClient {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createMockClient() as unknown as ServiceClient;
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
