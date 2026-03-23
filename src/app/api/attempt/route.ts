import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { validateAndScoreAttempt } from "@/lib/attempt-security";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-static";
import { getBlankCountForSkillLevel } from "@/lib/journey";
import { LOCAL_VERSES } from "@/lib/verses-local";
import { applyRateLimit, clientAddress } from "@/lib/rate-limit";
import { authenticatedUserFromRequest } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function dateDiffInDays(currentIso: string | null, nextIso: string): number | null {
  if (!currentIso) return null;
  const current = new Date(`${currentIso}T00:00:00.000Z`).getTime();
  const next = new Date(`${nextIso}T00:00:00.000Z`).getTime();
  return Math.floor((next - current) / (1000 * 60 * 60 * 24));
}

const attemptSchema = z.object({
  userId: z.string().min(1),
  verseId: z.string().min(1),
  correctCount: z.number().int().nonnegative(),
  totalBlanks: z.number().int().positive(),
  attemptIndex: z.number().int().positive(),
  elapsedMs: z.number().int().nonnegative(),
  points: z.number().int().optional(),
  skillLevel: z.enum(["beginner", "intermediate", "expert"]).optional(),
});

export async function POST(request: NextRequest) {
  const ip = clientAddress(request.headers);

  const body = await request.json();
  const parsed = attemptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  const attemptLimit = applyRateLimit(`attempt:ip:${ip}`, Number(process.env.RATE_LIMIT_ATTEMPT_PER_MIN ?? 45), 60_000);
  if (!attemptLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please slow down.", retryAfter: attemptLimit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(attemptLimit.retryAfterSeconds) } },
    );
  }

  const localVerse = LOCAL_VERSES.find((item) => item.id === payload.verseId);

  let userId = payload.userId;
  let displayName = payload.userId.slice(0, 8);
  const skillLevel = payload.skillLevel ?? "expert";
  let expectedTotalBlanks = localVerse ? getBlankCountForSkillLevel(skillLevel, localVerse.answers.length) : undefined;

  if (!hasSupabase) {
    if (!expectedTotalBlanks) {
      return NextResponse.json({ error: "Unknown verseId." }, { status: 400 });
    }

    const evaluated = validateAndScoreAttempt({
      reportedCorrectCount: payload.correctCount,
      reportedTotalBlanks: payload.totalBlanks,
      expectedTotalBlanks,
      attemptIndex: payload.attemptIndex,
      elapsedMs: payload.elapsedMs,
    });

    return NextResponse.json({ saved: false, mode: "local", points: evaluated.points, remaining: attemptLimit.remaining });
  }

  try {
    const user = await authenticatedUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    userId = user.id;
        const userLimit = applyRateLimit(
          `attempt:user:${userId}`,
          Number(process.env.RATE_LIMIT_ATTEMPT_PER_MIN ?? 45),
          60_000,
        );
        if (!userLimit.allowed) {
          return NextResponse.json(
            { error: "Too many attempts. Please slow down.", retryAfter: userLimit.retryAfterSeconds },
            { status: 429, headers: { "Retry-After": String(userLimit.retryAfterSeconds) } },
          );
        }

    displayName =
      (user.user_metadata?.display_name as string | undefined) ??
      (user.email ? user.email.split("@")[0] : user.id.slice(0, 8));

    const supabase = createSupabaseAdminClient();

    const { data: verseRow } = await supabase
      .from("verses")
      .select("answers")
      .eq("id", payload.verseId)
      .maybeSingle();

    expectedTotalBlanks = verseRow?.answers?.length
      ? getBlankCountForSkillLevel(skillLevel, verseRow.answers.length)
      : undefined;
    if (!expectedTotalBlanks) {
      return NextResponse.json({ error: "Unknown verseId." }, { status: 400 });
    }

    const evaluated = validateAndScoreAttempt({
      reportedCorrectCount: payload.correctCount,
      reportedTotalBlanks: payload.totalBlanks,
      expectedTotalBlanks,
      attemptIndex: payload.attemptIndex,
      elapsedMs: payload.elapsedMs,
    });

    const points = evaluated.points;

    const { error: attemptError } = await supabase.from("attempts").insert({
      user_id: userId,
      verse_id: payload.verseId,
      correct_count: evaluated.correctCount,
      total_blanks: evaluated.totalBlanks,
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
      .eq("user_id", userId)
      .maybeSingle();

    const nextTotal = (existing?.total_points ?? 0) + points;
    const nextBest = Math.max(existing?.best_session ?? 0, points);

    await supabase.from("scores").upsert({
      user_id: userId,
      total_points: nextTotal,
      best_session: nextBest,
      display_name: displayName,
    });

    const today = new Date().toISOString().slice(0, 10);
    const { data: streakRow } = await supabase
      .from("streaks")
      .select("current_streak, longest_streak, last_played_on")
      .eq("user_id", userId)
      .maybeSingle();

    const dayDelta = dateDiffInDays(streakRow?.last_played_on ?? null, today);
    const currentStreak =
      dayDelta === null ? 1 : dayDelta <= 0 ? streakRow?.current_streak ?? 1 : dayDelta === 1 ? (streakRow?.current_streak ?? 0) + 1 : 1;
    const longestStreak = Math.max(streakRow?.longest_streak ?? 0, currentStreak);

    await supabase.from("streaks").upsert({
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_played_on: today,
    });

    return NextResponse.json({
      saved: true,
      mode: "supabase",
      points,
      remaining: Math.min(attemptLimit.remaining, userLimit.remaining),
      currentStreak,
    });
  } catch (error) {
    const points = 0;
    return NextResponse.json(
      { saved: false, mode: "supabase", points, error: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
