"use client";

import { Medal, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";

type DayCompleteCelebrationProps = {
  celebration: {
    key: number;
    profileName: string;
  } | null;
};

const confettiPalette = [
  "#ec4899",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#38bdf8",
  "#a855f7",
];

const confettiPieces = Array.from({ length: 160 }, (_, index) => ({
  id: index,
  left: `${1 + ((index * 37) % 98)}%`,
  startY: `${-24 + ((index * 17) % 62)}vh`,
  delay: `${((index * 13) % 12) * 0.09}s`,
  duration: `${4.1 + (index % 5) * 0.18}s`,
  drift: `${-96 + ((index * 31) % 192)}px`,
  travel: `${84 + ((index * 23) % 34)}vh`,
  spin: `${280 + ((index * 47) % 360)}deg`,
  tilt: `${-28 + ((index * 13) % 56)}deg`,
  width: `${7 + (index % 4) * 3}px`,
  height: `${12 + (index % 5) * 4}px`,
  color: confettiPalette[index % confettiPalette.length],
}));

export function DayCompleteCelebration({
  celebration,
}: DayCompleteCelebrationProps) {
  const messages = useAppMessages();

  if (!celebration) {
    return null;
  }

  return (
    <div
      key={celebration.key}
      className="pointer-events-none fixed inset-0 z-[140] overflow-hidden"
      aria-hidden="true"
    >
      <div className="celebration-glow absolute inset-0" />

      {confettiPieces.map((piece) => (
        <span
          key={`${celebration.key}-${piece.id}`}
          className="confetti-piece"
          style={
            {
              left: piece.left,
              top: piece.startY,
              width: piece.width,
              height: piece.height,
              backgroundColor: piece.color,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
              "--confetti-drift": piece.drift,
              "--confetti-travel": piece.travel,
              "--confetti-spin": piece.spin,
              "--confetti-tilt": piece.tilt,
            } as CSSProperties
          }
        />
      ))}

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="celebration-card flex max-w-sm flex-col items-center rounded-[32px] border border-white/15 px-7 py-6 text-center">
          <div className="celebration-icon-wrap flex h-20 w-20 items-center justify-center rounded-full text-white">
            <Medal className="h-10 w-10" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.26em] text-amber-200/80">
            <Sparkles className="h-4 w-4" />
            <span>{messages.board.dayCompleteEyebrow}</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="mt-3 text-3xl font-bold text-white">
            {messages.board.dayCompleteTitle}
          </h3>
          <p className="mt-3 text-sm leading-6 text-white/80">
            {messages.board.dayCompleteMessage(celebration.profileName)}
          </p>
        </div>
      </div>
    </div>
  );
}
