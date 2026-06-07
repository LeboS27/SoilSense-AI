import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { createMockClient, isSupabaseConfigured } from "./mock-client";

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

/**
 * Falls back to an in-memory mock client when no Supabase project is
 * configured, so the dashboard runs as a browsable prototype out of the box.
 */
export function createClient(): BrowserClient {
  if (!isSupabaseConfigured()) {
    return createMockClient() as unknown as BrowserClient;
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
