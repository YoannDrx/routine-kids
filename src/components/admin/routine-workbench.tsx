"use client";

import { Clock3, Plus, Trash2 } from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { ConfirmModal } from "@/components/board/feedback-modals";
import { TaskIcon } from "@/components/board/task-icon";
import { type AdminWorkbenchMutationResult } from "@/components/admin/workbench-types";
import { boardTaskIconOptions } from "@/lib/data/board-library";
import { type TaskIconName } from "@/lib/data/prototype-seed";
import { cn } from "@/lib/utils";

type RoutineTaskRecord = {
  id: string;
  title: string;
  shortLabel: string | null;
  icon: string | null;
  order: number;
  scheduleDays: number[];
};

type RoutineRecord = {
  id: string;
  title: string;
  period: string;
  tasks: RoutineTaskRecord[];
};

type ChildRoutineRecord = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  routines: RoutineRecord[];
};

type TaskTemplateOption = {
  id: string;
  title: string;
  shortLabel: string | null;
};

type RoutineWorkbenchProps = {
  profiles: ChildRoutineRecord[];
  templates: TaskTemplateOption[];
  onSaveRoutineAction: (input: {
    childProfileId: string;
    period: "morning" | "evening";
    title: string;
  }) => Promise<AdminWorkbenchMutationResult>;
  onAssignTaskAction: (input: {
    childProfileId: string;
    period: "morning" | "evening";
    templateId: string;
  }) => Promise<AdminWorkbenchMutationResult>;
  onDeleteTaskAction: (input: {
    childProfileId: string;
    routineTaskId: string;
  }) => Promise<AdminWorkbenchMutationResult>;
};

type PeriodKey = "morning" | "evening";

function getRoutineForPeriod(
  routines: RoutineRecord[],
  period: PeriodKey,
) {
  const targetPeriod = period === "morning" ? "MORNING" : "EVENING";

  return routines.find((routine) => routine.period === targetPeriod) ?? null;
}

const orderedWeekDays = [1, 2, 3, 4, 5, 6, 0] as const;

function createTitleState(profiles: ChildRoutineRecord[]) {
  return Object.fromEntries(
    profiles.flatMap((profile) => {
      const morningRoutine = getRoutineForPeriod(profile.routines, "morning");
      const eveningRoutine = getRoutineForPeriod(profile.routines, "evening");

      return [
        [`${profile.id}:morning`, morningRoutine?.title ?? `${profile.name} - Morning`],
        [`${profile.id}:evening`, eveningRoutine?.title ?? `${profile.name} - Evening`],
      ];
    }),
  ) as Record<string, string>;
}

function createTemplateSelectionState(
  profiles: ChildRoutineRecord[],
  templates: TaskTemplateOption[],
) {
  const defaultTemplateId = templates[0]?.id ?? "";

  return Object.fromEntries(
    profiles.flatMap((profile) => [
      [`${profile.id}:morning`, defaultTemplateId],
      [`${profile.id}:evening`, defaultTemplateId],
    ]),
  ) as Record<string, string>;
}

export function RoutineWorkbench({
  profiles,
  templates,
  onSaveRoutineAction,
  onAssignTaskAction,
  onDeleteTaskAction,
}: RoutineWorkbenchProps) {
  const messages = useAppMessages();
  const router = useRouter();
  const [titleByKey, setTitleByKey] = useState(() => createTitleState(profiles));
  const [templateByKey, setTemplateByKey] = useState(() =>
    createTemplateSelectionState(profiles, templates),
  );
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [pendingTaskDelete, setPendingTaskDelete] = useState<{
    childProfileId: string;
    routineTaskId: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    setTitleByKey(createTitleState(profiles));
  }, [profiles]);

  useEffect(() => {
    setTemplateByKey(createTemplateSelectionState(profiles, templates));
  }, [profiles, templates]);

  const sortedProfiles = useMemo(
    () => [...profiles].sort((profileA, profileB) => profileA.name.localeCompare(profileB.name, "fr")),
    [profiles],
  );

  const runMutation = (callback: () => Promise<AdminWorkbenchMutationResult>) => {
    setIsPending(true);
    setMessage(null);

    startTransition(async () => {
      const result = await callback();

      setIsPending(false);
      setMessage(result.message);
      setMessageTone(result.status === "success" ? "success" : "error");

      if (result.status === "success") {
        router.refresh();
      }
    });
  };

  return (
    <>
      <section className="rounded-[32px] border border-white/10 bg-black/15 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">{messages.forms.routineCrud}</p>
          <h3 className="mt-1 font-display text-2xl text-white">
            {messages.forms.routineStudio}
          </h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white/60">
          {messages.forms.liveDb}
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-white/68">
        {messages.forms.routineStudioDescription}
      </p>

      {message ? (
        <p
          className={cn(
            "mt-4 rounded-2xl px-4 py-3 text-sm",
            messageTone === "success"
              ? "border border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
              : "border border-rose-300/20 bg-rose-500/10 text-rose-100",
          )}
        >
          {message}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4">
        {sortedProfiles.map((profile) => (
          <article
            key={profile.id}
            className="rounded-[28px] border border-white/10 bg-white/6 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/25 text-2xl text-white">
                  {profile.avatar}
                </div>
                <div>
                  <h4 className="font-display text-2xl text-white">
                    {profile.name}
                  </h4>
                  <p className="text-sm text-white/55">{messages.workspace.ageYears(profile.age)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {(["morning", "evening"] as const).map((period) => {
                const routine = getRoutineForPeriod(profile.routines, period);
                const stateKey = `${profile.id}:${period}`;

                return (
                  <section
                    key={stateKey}
                    className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                          {period === "morning" ? messages.board.morning : messages.board.evening}
                        </p>
                        <h5 className="mt-1 text-lg font-semibold text-white">
                          {routine?.title ?? messages.forms.routineToInitialize}
                        </h5>
                      </div>
                      <Clock3 className="h-4 w-4 text-white/35" />
                    </div>

                    <div className="mt-4 flex flex-wrap items-end gap-3">
                      <label className="flex min-w-[220px] flex-1 flex-col gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                          {messages.forms.title}
                        </span>
                        <input
                          value={titleByKey[stateKey] ?? ""}
                          onChange={(event) =>
                            setTitleByKey((current) => ({
                              ...current,
                              [stateKey]: event.target.value,
                            }))
                          }
                          className="h-11 rounded-2xl border border-white/10 bg-white/6 px-4 text-sm text-white outline-none transition focus:border-[#69d6ff]"
                        />
                      </label>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          runMutation(() =>
                            onSaveRoutineAction({
                              childProfileId: profile.id,
                              period,
                              title: titleByKey[stateKey] ?? "",
                            }),
                          )
                        }
                        className="h-11 rounded-2xl bg-[linear-gradient(90deg,#69d6ff,#8cf26b)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {messages.forms.saveRoutine}
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-end gap-3">
                      <label className="flex min-w-[220px] flex-1 flex-col gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                          {messages.forms.addMission}
                        </span>
                        <select
                          value={templateByKey[stateKey] ?? ""}
                          onChange={(event) =>
                            setTemplateByKey((current) => ({
                              ...current,
                              [stateKey]: event.target.value,
                            }))
                          }
                          className="h-11 rounded-2xl border border-white/10 bg-white/6 px-4 text-sm text-white outline-none transition focus:border-[#ff6fb5]"
                        >
                          {templates.length === 0 ? (
                            <option value="" className="bg-[#101223]">
                              {messages.library.noTemplateAvailable}
                            </option>
                          ) : null}
                          {templates.map((template) => (
                            <option
                              key={template.id}
                              value={template.id}
                              className="bg-[#101223]"
                            >
                              {template.title}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        disabled={isPending || !templateByKey[stateKey]}
                        onClick={() =>
                          runMutation(() =>
                            onAssignTaskAction({
                              childProfileId: profile.id,
                              period,
                              templateId: templateByKey[stateKey] ?? "",
                            }),
                          )
                        }
                        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#ff6fb5,#ff9c4a)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Plus className="h-4 w-4" />
                        {messages.library.add}
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {routine?.tasks.length ? (
                        routine.tasks.map((task) => {
                          const iconName = boardTaskIconOptions.includes(
                            (task.icon ?? "sparkles") as TaskIconName,
                          )
                            ? ((task.icon ?? "sparkles") as TaskIconName)
                            : "sparkles";

                          return (
                            <div
                              key={task.id}
                              className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-3 py-3"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#120d2b] text-white">
                                <TaskIcon icon={iconName} className="h-4 w-4" />
                              </div>
                              <div className="min-w-[120px] flex-1">
                                <p className="text-sm font-semibold text-white">
                                  {task.title}
                                </p>
                                <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                                  {task.shortLabel ?? task.title}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {orderedWeekDays.map((day, index) => {
                                    const active = task.scheduleDays.includes(day);

                                    return (
                                      <span
                                        key={`${task.id}-${day}`}
                                        className={cn(
                                          "flex h-6 min-w-6 items-center justify-center rounded-full border px-1.5 text-[10px] font-bold uppercase",
                                          active
                                            ? "border-[#ec4899]/60 bg-[#ec4899]/18 text-white"
                                            : "border-white/10 bg-white/5 text-white/28",
                                        )}
                                      >
                                        {messages.library.weekDays[index]}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  setPendingTaskDelete({
                                    childProfileId: profile.id,
                                    routineTaskId: task.id,
                                    title: task.title,
                                  })
                                }
                                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Trash2 className="h-4 w-4" />
                                {messages.forms.removeMission}
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 px-4 py-4 text-sm text-white/45">
                          {messages.forms.noRoutineMission}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </article>
        ))}
      </div>
      </section>

      <ConfirmModal
        open={pendingTaskDelete !== null}
        title={messages.common.warning}
        message={
          pendingTaskDelete
            ? messages.forms.deleteTemplateConfirm(pendingTaskDelete.title)
            : ""
        }
        confirmLabel={messages.common.yes}
        onCancel={() => setPendingTaskDelete(null)}
        onConfirm={() => {
          if (!pendingTaskDelete) {
            return;
          }

          const target = pendingTaskDelete;
          setPendingTaskDelete(null);
          runMutation(() =>
            onDeleteTaskAction({
              childProfileId: target.childProfileId,
              routineTaskId: target.routineTaskId,
            }),
          );
        }}
      />
    </>
  );
}
