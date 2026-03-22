"use client";

import { useTranslation } from "@/lib/translation-context";

export function SiteHeader() {
  const { translationKey, switchTranslation } = useTranslation();

  return (
    <header className="topbar" role="banner">
      <div className="translation-toggle" role="radiogroup" aria-label="Bible translation">
        <button
          type="button"
          role="radio"
          aria-checked={translationKey === "niv"}
          aria-label="New International Version"
          onClick={() => switchTranslation("niv")}
        >
          NIV
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={translationKey === "kjv"}
          aria-label="King James Version"
          onClick={() => switchTranslation("kjv")}
        >
          KJV
        </button>
      </div>
    </header>
  );
}