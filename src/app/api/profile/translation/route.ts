import { NextRequest, NextResponse } from "next/server";

import { hasSupabase } from "@/lib/env";

export const dynamic = "force-static";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  let body: { translation?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const translation = body.translation;
  if (translation !== "niv" && translation !== "kjv") {
    return NextResponse.json({ error: "Invalid translation. Use 'niv' or 'kjv'." }, { status: 400 });
  }

  if (!hasSupabase) {
    return NextResponse.json({ saved: false, reason: "local-only" });
  }

  /* Extract user from cookie-based session */
  const supabase = createSupabaseAdminClient();
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ saved: false, reason: "not-authenticated" });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ saved: false, reason: "not-authenticated" });
  }

  /* Store in user_metadata */
  const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, {
    user_metadata: { preferred_translation: translation },
  });

  if (updateError) {
    return NextResponse.json({ saved: false, reason: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ saved: true, translation });
}
