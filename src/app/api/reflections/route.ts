import { NextRequest, NextResponse } from "next/server";

import { hasSupabase } from "@/lib/env";

export const dynamic = "force-static";
import { authenticatedUserFromRequest } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (!hasSupabase) {
    return NextResponse.json({ reflections: [] });
  }

  const user = await authenticatedUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ reflections: [] });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reflections")
    .select("id, verse_id, category_id, response_text, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ reflections: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reflections: data ?? [] });
}
