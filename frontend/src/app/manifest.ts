import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chamkani Gathering Hall",
    short_name: "Chamkani Hall",
    description: "Private marriage hall booking management system",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbf9",
    theme_color: "#e60023",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
