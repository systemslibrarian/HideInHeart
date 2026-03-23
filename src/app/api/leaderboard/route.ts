import { NextResponse } from "next/server";

import { hasSupabase } from "@/lib/env";

export const dynamic = "force-static";
import { applyRateLimit, clientAddress } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const fallback = [
  { user_id: "demo-1", display_name: "FaithfulFox", total_points: 82, best_session: 63 },
  { user_id: "demo-2", display_name: "PsalmRunner", total_points: 76, best_session: 58 },
  { user_id: "demo-3", display_name: "GraceLearner", total_points: 65, best_session: 47 },
];

export async function GET(request: Request) {
  const limit = applyRateLimit(
    `leaderboard:${clientAddress(request.headers)}`,
    Number(process.env.RATE_LIMIT_LEADERBOARD_PER_MIN ?? 90),
    60_000,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many leaderboard requests.", retryAfter: limit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  if (!hasSupabase) {
    return NextResponse.json({ source: "local", rows: fallback });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("scores")
      .select("user_id, display_name, total_points, best_session")
      .order("total_points", { ascending: false })
      .limit(25);

    if (error) {
      return NextResponse.json({ source: "local-fallback", rows: fallback, error: error.message });
    }

    return NextResponse.json({ source: "supabase", rows: data ?? [] });
  } catch {
    return NextResponse.json({ source: "local-fallback", rows: fallback });
  }
}
