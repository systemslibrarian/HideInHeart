import { NextResponse } from "next/server";

import { hasSupabase } from "@/lib/env";

export const dynamic = "force-static";
import { LOCAL_VERSES } from "@/lib/verses-local";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabase) {
    return NextResponse.json({ source: "local", verses: LOCAL_VERSES });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("verses")
      .select(
        "id, reference, translation, parts, answers, decoys, theme_id, theme_label, devotional, application_prompt, difficulty, is_daily_featured",
      )
      .order("reference", { ascending: true });

    if (error) {
      return NextResponse.json({ source: "local-fallback", verses: LOCAL_VERSES, error: error.message });
    }

    const verses = (data ?? []).map((row) => ({
      id: row.id,
      reference: row.reference,
      translation: row.translation,
      parts: row.parts,
      answers: row.answers,
      decoys: row.decoys,
      themeId: row.theme_id,
      themeLabel: row.theme_label,
      devotional: row.devotional,
      applicationPrompt: row.application_prompt,
      difficulty: row.difficulty ?? undefined,
      isDailyFeatured: row.is_daily_featured ?? false,
    }));

    if (verses.length === 0) {
      return NextResponse.json({ source: "local-fallback", verses: LOCAL_VERSES });
    }

    return NextResponse.json({ source: "supabase", verses });
  } catch {
    return NextResponse.json({ source: "local-fallback", verses: LOCAL_VERSES });
  }
}
