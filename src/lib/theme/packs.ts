export type ThemeId = "space-academy" | "ocean-quest" | "jungle-camp";

export type ThemePackPreview = {
  id: ThemeId;
  name: string;
  label: string;
  description: string;
  accent: string;
  accentSoft: string;
  surfaceClass: string;
  ring: string;
  textClass: string;
};

export const themePacks: Record<ThemeId, ThemePackPreview> = {
  "space-academy": {
    id: "space-academy",
    name: "Space Academy",
    label: "4-8 ans",
    description: "Le theme heritage du prototype, avec un ton epique et energique.",
    accent: "#ff6fb5",
    accentSoft: "rgba(255, 111, 181, 0.18)",
    surfaceClass: "from-[#20124a] via-[#140b31] to-[#0b081d]",
    ring: "#ff6fb5",
    textClass: "text-[#ffb5d7]",
  },
  "ocean-quest": {
    id: "ocean-quest",
    name: "Ocean Quest",
    label: "3-6 ans",
    description: "Une ambiance plus calme, parfaite pour les plus petits ou les routines apaisantes.",
    accent: "#69d6ff",
    accentSoft: "rgba(105, 214, 255, 0.18)",
    surfaceClass: "from-[#0f3150] via-[#0d2037] to-[#08131f]",
    ring: "#69d6ff",
    textClass: "text-[#acebff]",
  },
  "jungle-camp": {
    id: "jungle-camp",
    name: "Jungle Camp",
    label: "5-8 ans",
    description: "Une palette plus vive pour l'autonomie, l'exploration et les routines d'action.",
    accent: "#8cf26b",
    accentSoft: "rgba(140, 242, 107, 0.18)",
    surfaceClass: "from-[#193f1f] via-[#122718] to-[#09130c]",
    ring: "#8cf26b",
    textClass: "text-[#c8ffb7]",
  },
};

export const futureThemeBacklog = [
  "Soft Pastel",
  "Camp Astral Premium",
  "Ocean Nights",
  "Seasonal reward packs",
];
