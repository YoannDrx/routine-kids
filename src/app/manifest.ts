import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RoutineKids",
    short_name: "RoutineKids",
    description:
      "Board paysage pour routines enfants, profils multiples et espace parent securise.",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#120d2b",
    theme_color: "#120d2b",
    categories: ["education", "family", "productivity"],
    icons: [
      {
        src: "/web-app-icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/web-app-icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
