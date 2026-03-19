"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <h2>Something went wrong</h2>
          <p>The error was captured for monitoring.</p>
          <button onClick={() => reset()} type="button">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
