import { NextResponse } from "next/server";

import { hasSupabase } from "@/lib/env";

export const dynamic = "force-static";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const base = {
    ok: true,
    service: "scripture-memory",
    timestamp: new Date().toISOString(),
    checks: {
      supabaseConfigured: hasSupabase,
      database: "skipped",
    },
  } as const;

  if (!hasSupabase) {
    return NextResponse.json(base);
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("verses").select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          service: "scripture-memory",
          timestamp: new Date().toISOString(),
          checks: {
            supabaseConfigured: true,
            database: error.message,
          },
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      service: "scripture-memory",
      timestamp: new Date().toISOString(),
      checks: {
        supabaseConfigured: true,
        database: "ok",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "scripture-memory",
        timestamp: new Date().toISOString(),
        checks: {
          supabaseConfigured: true,
          database: error instanceof Error ? error.message : "unknown",
        },
      },
      { status: 503 },
    );
  }
}
