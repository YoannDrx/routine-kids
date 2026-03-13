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
  };
}
