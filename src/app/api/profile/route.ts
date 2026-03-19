import { NextRequest, NextResponse } from "next/server";

import { hasSupabase } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  if (!hasSupabase) {
    return NextResponse.json({
      source: "local",
      profile: {
        userId,
        totalPoints: 0,
        bestSession: 0,
        versesCompleted: 0,
        currentStreak: 0,
      },
    });
  }

  try {
    const supabase = createSupabaseAdminClient();

    const [{ data: score }, { count: attemptsCount }, { data: streak }] = await Promise.all([
      supabase.from("scores").select("total_points, best_session").eq("user_id", userId).maybeSingle(),
      supabase.from("attempts").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("streaks").select("current_streak").eq("user_id", userId).maybeSingle(),
    ]);

    return NextResponse.json({
      source: "supabase",
      profile: {
        userId,
        totalPoints: score?.total_points ?? 0,
        bestSession: score?.best_session ?? 0,
        versesCompleted: attemptsCount ?? 0,
        currentStreak: streak?.current_streak ?? 0,
      },
    });
  } catch {
    return NextResponse.json({
      source: "local-fallback",
      profile: {
        userId,
        totalPoints: 0,
        bestSession: 0,
        versesCompleted: 0,
        currentStreak: 0,
      },
    });
  }
}
