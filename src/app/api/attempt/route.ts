import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasSupabase } from "@/lib/env";
import { scoreAttempt } from "@/lib/game";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const attemptSchema = z.object({
  userId: z.string().min(1),
  verseId: z.string().min(1),
  correctCount: z.number().int().nonnegative(),
  totalBlanks: z.number().int().positive(),
  attemptIndex: z.number().int().positive(),
  elapsedMs: z.number().int().nonnegative(),
  points: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = attemptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const points = payload.points ?? scoreAttempt(payload.correctCount, payload.totalBlanks, payload.attemptIndex);

  if (!hasSupabase) {
    return NextResponse.json({ saved: false, mode: "local", points });
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { error: attemptError } = await supabase.from("attempts").insert({
      user_id: payload.userId,
      verse_id: payload.verseId,
      correct_count: payload.correctCount,
      total_blanks: payload.totalBlanks,
      attempt_index: payload.attemptIndex,
      elapsed_ms: payload.elapsedMs,
      points,
    });

    if (attemptError) {
      return NextResponse.json({ saved: false, mode: "supabase", error: attemptError.message, points }, { status: 500 });
    }

    const { data: existing } = await supabase
      .from("scores")
      .select("total_points, best_session")
      .eq("user_id", payload.userId)
      .maybeSingle();

    const nextTotal = (existing?.total_points ?? 0) + points;
    const nextBest = Math.max(existing?.best_session ?? 0, points);

    await supabase.from("scores").upsert({
      user_id: payload.userId,
      total_points: nextTotal,
      best_session: nextBest,
      display_name: payload.userId.slice(0, 8),
    });

    return NextResponse.json({ saved: true, mode: "supabase", points });
  } catch (error) {
    return NextResponse.json(
      { saved: false, mode: "supabase", points, error: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
