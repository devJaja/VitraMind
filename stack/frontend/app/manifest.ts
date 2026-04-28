import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VitraMind",
    short_name: "VitraMind",
    description: "Privacy-first personal growth on Bitcoin via Stacks",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#f97316",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    categories: ["health", "lifestyle", "productivity"],
  };
}
