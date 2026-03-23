"use client";

import Link from "next/link";
import { useState } from "react";

import { useAudience } from "@/lib/audience-context";
import { useTranslation } from "@/lib/translation-context";

export function SiteHeader() {
  const { translationKey, switchTranslation } = useTranslation();
  const { audienceMode, switchAudience } = useAudience();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar" role="banner">
      <div className="brand-row">
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
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

          <div className="translation-toggle" role="radiogroup" aria-label="Audience mode">
            <button
              type="button"
              role="radio"
              aria-checked={audienceMode === "adults"}
              onClick={() => switchAudience("adults")}
            >
              Adults
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={audienceMode === "kids"}
              onClick={() => switchAudience("kids")}
            >
              Kids
            </button>
          </div>
        </div>

        <button
          className={`menu-toggle ${menuOpen ? "open" : ""}`}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="menu-toggle-icon">
            <span className="menu-toggle-bar" />
            <span className="menu-toggle-bar" />
            <span className="menu-toggle-bar" />
          </span>
        </button>
      </div>

      <nav id="main-nav" className={`nav ${menuOpen ? "open" : ""}`} aria-label="Main navigation">
        <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link href="/play" onClick={() => setMenuOpen(false)}>Journey</Link>
        <Link href="/practice" onClick={() => setMenuOpen(false)}>Practice</Link>
        <Link href="/why" onClick={() => setMenuOpen(false)}>Why memorize?</Link>
      </nav>
    </header>
  );
}