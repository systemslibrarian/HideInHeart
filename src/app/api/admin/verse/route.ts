import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasSupabase } from "@/lib/env";
import { applyRateLimit, clientAddress } from "@/lib/rate-limit";

export const dynamic = "force-static";
import { authenticatedUserFromRequest, isAdminUser } from "@/lib/supabase/auth";
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
  const ip = clientAddress(request.headers);
  const adminLimit = applyRateLimit(`admin:${ip}`, Number(process.env.RATE_LIMIT_ADMIN_PER_MIN ?? 20), 60_000);
  if (!adminLimit.allowed) {
    return NextResponse.json(
      { error: "Too many admin requests.", retryAfter: adminLimit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(adminLimit.retryAfterSeconds) } },
    );
  }

  if (!hasSupabase) {
    if (!authorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    const user = await authenticatedUserFromRequest(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: "Admin role required." }, { status: 403 });
    }
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
