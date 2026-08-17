"use client";

import {
  Apple,
  Backpack,
  Bath,
  BedSingle,
  BookOpen,
  Brush,
  Droplets,
  Footprints,
  GlassWater,
  Heart,
  MoonStar,
  Rocket,
  Shirt,
  Sparkles,
  Star,
  SunMedium,
} from "lucide-react";
import type { ComponentType, CSSProperties } from "react";

import type { TaskIconName } from "@/lib/data/prototype-seed";

const iconMap: Record<
  TaskIconName,
  ComponentType<{ className?: string; style?: CSSProperties }>
> = {
  shirt: Shirt,
  sparkles: Sparkles,
  footprints: Footprints,
  "glass-water": GlassWater,
  apple: Apple,
  school: Backpack,
  "book-open": BookOpen,
  bath: Bath,
  moon: MoonStar,
  bed: BedSingle,
  heart: Heart,
  rocket: Rocket,
  star: Star,
  sun: SunMedium,
  droplets: Droplets,
  brush: Brush,
};

type TaskIconProps = {
  icon: TaskIconName;
  className?: string;
  style?: CSSProperties;
};

export function TaskIcon({ icon, className, style }: TaskIconProps) {
  const Icon = iconMap[icon];

  return <Icon className={className} style={style} />;
}
