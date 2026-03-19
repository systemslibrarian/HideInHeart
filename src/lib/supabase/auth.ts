import { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

function bearerToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function authenticatedUserFromRequest(request: NextRequest): Promise<User | null> {
  const token = bearerToken(request);
  if (!token) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function isAdminUser(user: User): boolean {
  const role = user.app_metadata?.role;
  const roles = user.app_metadata?.roles;

  if (role === "admin") return true;
  if (Array.isArray(roles) && roles.includes("admin")) return true;
  return false;
}
