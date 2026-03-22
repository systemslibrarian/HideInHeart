import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasSupabase } from "@/lib/env";
import { LOCAL_VERSES } from "@/lib/verses-local";
import { authenticatedUserFromRequest } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

async function verseExists(verseId: string): Promise<boolean> {
  if (LOCAL_VERSES.some((v) => v.id === verseId)) return true;
  if (!hasSupabase) return false;
  const supabase = createSupabaseAdminClient();
  const { count } = await supabase
    .from("verses")
    .select("id", { count: "exact", head: true })
    .eq("id", verseId);
  return (count ?? 0) > 0;
}

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

  if (!(await verseExists(payload.verseId))) {
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