import { NextResponse } from "next/server";

import { hasSupabase } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const fallback = [
  { user_id: "demo-1", display_name: "FaithfulFox", total_points: 82, best_session: 63 },
  { user_id: "demo-2", display_name: "PsalmRunner", total_points: 76, best_session: 58 },
  { user_id: "demo-3", display_name: "GraceLearner", total_points: 65, best_session: 47 },
];

export async function GET() {
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
