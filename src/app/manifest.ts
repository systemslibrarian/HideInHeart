import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hidden in Heart",
    short_name: "Hidden in Heart",
    description: "A calm daily companion for hiding God's Word in your heart — read, reflect, memorize, and live it.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e4c92",
    theme_color: "#0e4c92",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
