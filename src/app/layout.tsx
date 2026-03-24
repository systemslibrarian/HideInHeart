import type { Metadata, Viewport } from "next";
import { Crimson_Text } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { AudienceProvider } from "@/lib/audience-context";
import { getAppUrl } from "@/lib/env";
import { ThemeProvider } from "@/lib/theme-context";
import { TranslationProvider } from "@/lib/translation-context";

import "./globals.css";

const appUrl = getAppUrl();

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-crimson",
});

export const metadata: Metadata = {
  title: "Scripture Journey",
  description: "A calm daily Scripture journey for reading, reflecting, memorizing, and living God's Word.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(appUrl),
  openGraph: {
    title: "Scripture Journey",
    description: "A calm daily Scripture journey for reading, reflecting, memorizing, and living God's Word.",
    type: "website",
    url: appUrl,
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Scripture Journey" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scripture Journey",
    description: "A calm daily Scripture journey for reading, reflecting, memorizing, and living God's Word.",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={crimsonText.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("sg_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches)){document.documentElement.setAttribute("data-theme","dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <TranslationProvider>
            <AudienceProvider>
            <a className="skip-link" href="#main-content">
              Skip to content
            </a>
            <div className="shell">
              <SiteHeader />
              <main id="main-content">
                {children}
              </main>
            </div>

            </AudienceProvider>
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
