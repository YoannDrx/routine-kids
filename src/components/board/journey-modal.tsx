"use client";

import {
  Circle,
  CircleDot,
  Cloud,
  Moon,
  Rocket,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import type { BoardMode, BoardProfile } from "@/lib/data/prototype-seed";
import {
  JOURNEY_PLANETS,
  getJourneyPlanetById,
  type JourneyPlanet,
} from "@/lib/journey";
import { cn } from "@/lib/utils";
import { OverlayModalShell } from "@/components/settings/overlay-modal-shell";
import { ProfileAvatar } from "@/components/shared/profile-avatar";

type JourneyModalProps = {
  open: boolean;
  profiles: BoardProfile[];
  mode: BoardMode;
  locale: "fr" | "en";
  completedTaskIdsByProfile: Record<string, Record<BoardMode, Set<string>>>;
  onClose: () => void;
};

export function JourneyModal({
  open,
  profiles,
  mode,
  locale,
  completedTaskIdsByProfile,
  onClose,
}: JourneyModalProps) {
  const messages = useAppMessages();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    profiles[0]?.id ?? null,
  );

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0],
    [profiles, selectedProfileId],
  );

  if (!open || !selectedProfile) {
    return null;
  }

  const tasks = selectedProfile.tasksByMode[mode];
  const completedSet =
    completedTaskIdsByProfile[selectedProfile.id]?.[mode] ?? new Set<string>();
  const completedCount = tasks.filter((task) => completedSet.has(task.id)).length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  const currentPlanet = getJourneyPlanetById(selectedProfile.journey.currentPlanetId);
  const nextPlanet = selectedProfile.journey.nextPlanetId
    ? getJourneyPlanetById(selectedProfile.journey.nextPlanetId)
    : null;

  const remainingDays = nextPlanet
    ? Math.max(0, nextPlanet.streakNeeded - selectedProfile.streak)
    : 0;

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      showCloseButton={false}
      overlayClassName="bg-black/80"
      panelClassName="space-bg-deep relative flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-20 text-white/50 transition hover:text-white"
        aria-label={messages.common.close}
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-3 overflow-x-auto border-b border-white/10 bg-black/30 p-4 shrink-0 no-scrollbar">
        <span className="shrink-0 text-xs font-bold uppercase tracking-[0.22em] text-white/40">
          {messages.journey.title}
        </span>
        <div className="ml-auto flex gap-2">
          {profiles.map((profile) => {
            const isActive = profile.id === selectedProfile.id;

            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => setSelectedProfileId(profile.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition",
                  isActive
                    ? "bg-[#ec4899] text-white shadow-lg"
                    : "bg-white/5 text-white/50 hover:bg-white/10",
                )}
              >
                <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs">
                  <ProfileAvatar
                    avatar={profile.avatar}
                    photoUrl={profile.photoUrl}
                    alt={profile.name}
                    emojiClassName="text-xs"
                  />
                </div>
                <span>{profile.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/40">
              {messages.journey.progress}
            </p>
            <h3 className="mb-2 text-3xl font-bold">{selectedProfile.name}</h3>
            <p className="text-sm text-white/60">{selectedProfile.headline}</p>
            <div className="mt-5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-3 rounded-full bg-[linear-gradient(90deg,#ec4899,#f97316)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-white/70">
              <span>{messages.journey.completedMissions(completedCount)}</span>
              <span>{progress}%</span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/40">
              {messages.journey.streak}
            </p>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-300/15 text-amber-300">
                <Trophy className="h-7 w-7" />
              </div>
              <div>
                <div className="text-3xl font-bold">{selectedProfile.streak}</div>
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  {messages.journey.momentumDays}
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/65">
              {selectedProfile.streak > 0
                ? messages.journey.unlockedMilestones(
                    selectedProfile.journey.unlockedPlanetCount,
                  )
                : messages.journey.startJourney}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-black/25 p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-white/40">
                {messages.journey.currentPlanet}
              </p>
              <div className="text-lg font-bold text-white">
                {planetLabel(currentPlanet, locale)}
              </div>
              <div className="text-sm text-white/55">
                {messages.journey.unlockedMilestones(
                  selectedProfile.journey.unlockedPlanetCount,
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs uppercase tracking-[0.22em] text-white/40">
                {nextPlanet ? messages.journey.nextPlanet : messages.journey.journeyComplete}
              </div>
              <div className="mt-1 text-sm font-bold text-white">
                {nextPlanet ? planetLabel(nextPlanet, locale) : planetLabel(currentPlanet, locale)}
              </div>
              <div className="mt-1 text-xs text-white/45">
                {nextPlanet
                  ? `${remainingDays} ${messages.journey.momentumDays}`
                  : messages.journey.accomplished}
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto pb-3 no-scrollbar">
            <div className="absolute left-8 right-8 top-7 h-px bg-white/10" />
            <div className="relative flex min-w-max items-start justify-between gap-6">
              {JOURNEY_PLANETS.map((planet) => {
                const isReached =
                  selectedProfile.streak >= planet.streakNeeded;
                const isCurrent = planet.id === currentPlanet.id;

                return (
                  <div
                    key={planet.id}
                    className="flex w-16 flex-col items-center text-center"
                  >
                    <div
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-full border text-white shadow-lg transition",
                        isCurrent
                          ? "scale-110 border-white/70 bg-white/10"
                          : isReached
                            ? "border-white/20 bg-white/5"
                            : "border-white/10 bg-black/30 text-white/25",
                      )}
                      style={{
                        color: isReached || isCurrent ? planet.color : undefined,
                        boxShadow: isCurrent
                          ? `0 0 18px ${planet.color}55`
                          : undefined,
                      }}
                    >
                      <JourneyPlanetIcon planet={planet} muted={!isReached && !isCurrent} />
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-[10px] font-bold leading-tight",
                        isReached ? "text-white/80" : "text-white/30",
                      )}
                    >
                      {planet.name}
                    </span>
                    <span
                      className={cn(
                        "mt-1 text-[9px]",
                        isReached ? "text-white/45" : "text-white/20",
                      )}
                    >
                      {planet.streakNeeded}j
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {tasks.map((task, index) => {
            const done = completedSet.has(task.id);

            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-4 transition",
                  done
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-white/10 bg-white/5",
                )}
              >
                <div>
                  <div className="text-sm font-bold">{task.label}</div>
                  <div className="text-xs text-white/45">{messages.journey.step(index + 1)}</div>
                </div>
                <div className={cn("text-sm font-bold", done ? "text-emerald-300" : "text-white/35")}>
                  {done ? messages.journey.accomplished : messages.journey.pending}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </OverlayModalShell>
  );
}

function JourneyPlanetIcon({
  planet,
  muted,
}: {
  planet: JourneyPlanet;
  muted: boolean;
}) {
  const className = cn("h-6 w-6", muted && "opacity-60");

  if (planet.icon === "rocket") {
    return <Rocket className={className} />;
  }

  if (planet.icon === "moon") {
    return <Moon className={className} />;
  }

  if (planet.icon === "circle-dot") {
    return <CircleDot className={className} />;
  }

  if (planet.icon === "star") {
    return <Star className={className} />;
  }

  if (planet.icon === "cloud") {
    return <Cloud className={className} />;
  }

  return <Circle className={className} />;
}

function planetLabel(planet: JourneyPlanet, locale: "fr" | "en") {
  return locale === "en" ? planet.nameEn : planet.name;
}
