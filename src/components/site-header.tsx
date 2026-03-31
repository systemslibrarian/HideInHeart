"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAudience } from "@/lib/audience-context";
import { useTheme } from "@/lib/theme-context";
import { useTranslation } from "@/lib/translation-context";
import type { TranslationKey } from "@/types/domain";

const TRANSLATION_OPTIONS: TranslationKey[] = ["niv", "kjv", "nkjv", "esv"];

const NAV_ITEMS = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/browse/topic",
    label: "Topics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
  },
  {
    href: "/browse/book",
    label: "Books",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    href: "/plans",
    label: "Plans",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: "/my-verses",
    label: "My Verses",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: "/profile/reflections",
    label: "Reflections",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
];

export function SiteHeader() {
  const { audienceMode, switchAudience } = useAudience();
  const { themeMode, toggleTheme } = useTheme();
  const { translationKey, switchTranslation } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="topbar" role="banner">
      {/* ---- Top bar: brand left, controls right ---- */}
      <div className="topbar-main">
        <Link href="/" className="brand-name" onClick={() => setMenuOpen(false)}>
          Hide in Heart
        </Link>

        <div className="topbar-controls">
          <div className="translation-toggle" role="radiogroup" aria-label="Audience mode">
            <button type="button" role="radio" aria-checked={audienceMode === "adults"} onClick={() => switchAudience("adults")}>Adults</button>
            <button type="button" role="radio" aria-checked={audienceMode === "kids"} onClick={() => switchAudience("kids")}>Kids</button>
          </div>

          <div className="version-select">
            <select
              aria-label="Bible translation"
              value={translationKey}
              onChange={(e) => switchTranslation(e.target.value as TranslationKey)}
            >
              {TRANSLATION_OPTIONS.map((key) => (
                <option key={key} value={key}>{key.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="theme-toggle"
            aria-label={`Switch to ${themeMode === "light" ? "dark" : "light"} mode`}
            onClick={toggleTheme}
          >
            {themeMode === "light" ? "🌙" : "☀️"}
          </button>

          <button
            className={`menu-toggle ${menuOpen ? "open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="menu-toggle-icon">
              <span className="menu-toggle-bar" />
              <span className="menu-toggle-bar" />
              <span className="menu-toggle-bar" />
            </span>
          </button>
        </div>
      </div>

      {/* ---- Desktop tab bar with icons ---- */}
      <nav className="desktop-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`desktop-nav-item${isActive ? " active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ---- Mobile slide-down nav ---- */}
      <nav id="main-nav" className={`nav ${menuOpen ? "open" : ""}`} aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
        <div className="mobile-controls">
          <div className="translation-toggle" role="radiogroup" aria-label="Audience mode">
            <button type="button" role="radio" aria-checked={audienceMode === "adults"} onClick={() => switchAudience("adults")}>Adults</button>
            <button type="button" role="radio" aria-checked={audienceMode === "kids"} onClick={() => switchAudience("kids")}>Kids</button>
          </div>
        </div>
      </nav>
    </header>
  );
}