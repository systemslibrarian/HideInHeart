"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/play", label: "Today's Verse" },
  { href: "/verses", label: "Verse Library" },
  { href: "/profile", label: "Profile" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/auth", label: "Sign In" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 720) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <header className="topbar">
      <div className="brand-row">
        <div className="brand">Scripture Journey</div>
        <button
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          className={`menu-toggle ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <span aria-hidden="true" className="menu-toggle-icon">
            <span className="menu-toggle-bar" />
            <span className="menu-toggle-bar" />
            <span className="menu-toggle-bar" />
          </span>
          <span className="menu-toggle-text">Menu</span>
        </button>
      </div>
      <nav aria-label="Primary" className={`nav ${menuOpen ? "open" : ""}`} id="primary-navigation">
        {NAV_LINKS.filter((link) => !(pathname === "/" && link.href === "/verses")).map((link) => (
          <Link href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}