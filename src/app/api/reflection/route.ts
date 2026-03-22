import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasSupabase } from "@/lib/env";
import { LOCAL_VERSES } from "@/lib/verses-local";
import { authenticatedUserFromRequest } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const reflectionSchema = z.object({
  verseId: z.string().min(1),
  categoryId: z.string().min(1),
  responseText: z.string().trim().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = reflectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const verse = LOCAL_VERSES.find((item) => item.id === payload.verseId);

  if (!verse) {
    return NextResponse.json({ error: "Unknown verseId." }, { status: 400 });
  }

  if (!hasSupabase) {
    return NextResponse.json({ saved: true, mode: "local" });
  }

  try {
    const user = await authenticatedUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ saved: false, mode: "guest" });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("reflections").insert({
      user_id: user.id,
      verse_id: payload.verseId,
      category_id: payload.categoryId,
      response_text: payload.responseText,
    });

    if (error) {
      return NextResponse.json({ saved: false, mode: "supabase", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ saved: true, mode: "supabase" });
  } catch (error) {
    return NextResponse.json(
      { saved: false, mode: "supabase", error: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}