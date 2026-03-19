import * as Sentry from "@sentry/nextjs";
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  Sentry.addBreadcrumb({
    category: "navigation",
    message: `Request: ${request.nextUrl.pathname}`,
    level: "info",
  });

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
