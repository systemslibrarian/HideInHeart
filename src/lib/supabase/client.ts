"use client";

import { createClient } from "@supabase/supabase-js";

let singleton: ReturnType<typeof createClient> | undefined;

export function getSupabaseBrowserClient() {
  if (singleton) return singleton;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase client env vars are missing.");
  }

  singleton = createClient(url, key);
  return singleton;
}
