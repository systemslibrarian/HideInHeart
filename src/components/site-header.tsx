"use client";

import Link from "next/link";
import { useState } from "react";

import { useAudience } from "@/lib/audience-context";
import { useTheme } from "@/lib/theme-context";
import { useTranslation } from "@/lib/translation-context";
import type { TranslationKey } from "@/types/domain";

const TRANSLATION_OPTIONS: TranslationKey[] = ["niv", "kjv", "nkjv", "esv"];

export function SiteHeader() {
  const { audienceMode, switchAudience } = useAudience();
  const { themeMode, toggleTheme } = useTheme();
  const { translationKey, switchTranslation } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar" role="banner">
      <div className="brand-row">
        <Link href="/" className="brand-name" onClick={() => setMenuOpen(false)}>
          Hidden in Heart
        </Link>

        <div className="header-controls">
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
          <div className="translation-toggle" role="radiogroup" aria-label="Bible translation">
            {TRANSLATION_OPTIONS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={translationKey === key}
                onClick={() => switchTranslation(key)}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="theme-toggle"
            aria-pressed={themeMode === "dark"}
            onClick={toggleTheme}
          >
            {themeMode === "dark" ? "Light mode" : "Dark mode"}
          </button>
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
        <div className="mobile-controls">
          <div className="translation-toggle" role="radiogroup" aria-label="Audience mode">
            <button type="button" role="radio" aria-checked={audienceMode === "adults"} onClick={() => switchAudience("adults")}>Adults</button>
            <button type="button" role="radio" aria-checked={audienceMode === "kids"} onClick={() => switchAudience("kids")}>Kids</button>
          </div>
          <div className="translation-toggle" role="radiogroup" aria-label="Bible translation">
            {TRANSLATION_OPTIONS.map((key) => (
              <button key={key} type="button" role="radio" aria-checked={translationKey === key} onClick={() => switchTranslation(key)}>
                {key.toUpperCase()}
              </button>
            ))}
          </div>
          <button type="button" className="theme-toggle" aria-pressed={themeMode === "dark"} onClick={toggleTheme}>
            {themeMode === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
        <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link href="/browse/topic" onClick={() => setMenuOpen(false)}>By topic</Link>
        <Link href="/browse/book" onClick={() => setMenuOpen(false)}>By book</Link>
        <Link href="/verses" onClick={() => setMenuOpen(false)}>My memorized</Link>
        <Link href="/profile/reflections" onClick={() => setMenuOpen(false)}>My reflections</Link>
      </nav>
    </header>
  );
}