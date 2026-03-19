import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasSupabase } from "@/lib/env";
import { LOCAL_VERSES } from "@/lib/verses-local";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().min(2),
  reference: z.string().min(3),
  translation: z.string().min(2).default("NIV"),
  parts: z.array(z.string()).min(2),
  answers: z.array(z.string()).min(1),
  decoys: z.array(z.string()).min(2),
  themeId: z.string().min(1),
});

function authorized(request: NextRequest): boolean {
  const token = request.headers.get("x-admin-token");
  return Boolean(token && process.env.ADMIN_API_TOKEN && token === process.env.ADMIN_API_TOKEN);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const verse = parsed.data;
  if (verse.parts.length !== verse.answers.length + 1) {
    return NextResponse.json({ error: "parts must be answers.length + 1" }, { status: 400 });
  }

  if (!hasSupabase) {
    const exists = LOCAL_VERSES.some((item) => item.id === verse.id);
    return NextResponse.json({ saved: false, mode: "local", exists });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("verses").upsert({
      id: verse.id,
      reference: verse.reference,
      translation: verse.translation,
      parts: verse.parts,
      answers: verse.answers,
      decoys: verse.decoys,
      theme_id: verse.themeId,
    });

    if (error) {
      return NextResponse.json({ saved: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ saved: true, mode: "supabase" });
  } catch (error) {
    return NextResponse.json(
      { saved: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
