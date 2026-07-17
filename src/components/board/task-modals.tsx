"use client";

import { CalendarDays, Camera, Check, ChevronDown, Minus, Moon, Pencil, Plus, Search, Sparkles, Sun, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { ConfirmModal } from "@/components/board/feedback-modals";
import {
  ProfilePhotoCropperModal,
  readImageFileAsDataUrl,
} from "@/components/board/profile-photo-cropper-modal";
import { OverlayModalShell } from "@/components/settings/overlay-modal-shell";
import { TaskIcon } from "@/components/board/task-icon";
import { ProfileAvatar } from "@/components/shared/profile-avatar";
import {
  boardTaskColorOptions,
  boardTaskIconOptions,
  resolveBoardTaskColor,
} from "@/lib/data/board-library";
import type { BoardMode, BoardProfile, BoardTask, TaskIconName } from "@/lib/data/prototype-seed";
import { resolveMediaUrl } from "@/lib/private-media";
import { cn } from "@/lib/utils";

const maxTaskImageBytes = 25 * 1024 * 1024;

export type LibraryContext = {
  mode: "assign" | "manage" | "scheduler_quick";
  profileId?: string;
  profileName?: string;
  defaultMode?: BoardMode;
  scheduleDays?: number[];
};

type BoardAssignPeriod = BoardMode | "both";

type TaskLibraryModalProps = {
  open: boolean;
  context: LibraryContext | null;
  tasks: BoardTask[];
  isPending?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSaveTask: (task: BoardTask) => Promise<boolean> | boolean;
  onDeleteTask?: (task: BoardTask) => Promise<boolean> | boolean;
  onAssignTask: (task: BoardTask, period: BoardAssignPeriod) => Promise<boolean> | boolean;
};

type SchedulerModalProps = {
  open: boolean;
  profiles: BoardProfile[];
  tasks: BoardTask[];
  isPending?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onRequestAutoAssign: (profileId: string | null) => void;
  onRequestQuickAdd: (input: {
    profileId: string | null;
    period: BoardMode;
    day: number;
  }) => void;
  onApply: (input: {
    profileId: string;
    taskIds: string[];
    period: BoardAssignPeriod;
    scheduleDays?: number[];
  }) => Promise<boolean> | boolean;
  onRemoveScheduledDay: (input: {
    profileId: string;
    routineTaskId: string;
    day: number;
  }) => Promise<boolean> | boolean;
};

export function TaskLibraryModal({
  open,
  context,
  tasks,
  isPending = false,
  errorMessage,
  onClose,
  onSaveTask,
  onDeleteTask,
  onAssignTask,
}: TaskLibraryModalProps) {
  const messages = useAppMessages();
  const [query, setQuery] = useState("");
  const [pendingTask, setPendingTask] = useState<BoardTask | null>(null);
  const [editorTask, setEditorTask] = useState<BoardTask | null>(null);
  const assignPeriodDefault = context?.defaultMode ?? "morning";

  const filteredTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return tasks;
    }

    return tasks.filter((task) =>
      `${task.label} ${task.shortLabel}`.toLowerCase().includes(normalized),
    );
  }, [query, tasks]);

  return (
    <>
      <OverlayModalShell
        open={open && pendingTask === null && editorTask === null}
        onClose={onClose}
        overlayClassName={context?.mode === "scheduler_quick" ? "z-[130]" : undefined}
        panelClassName="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl p-5 sm:p-6"
        showCloseButton={false}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
              {messages.library.taskLibraryTitle}
            </p>
            <h3 className="mt-2 text-xl font-bold">{messages.library.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/65 transition hover:bg-white/15 hover:text-white"
            aria-label={messages.common.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Search className="h-4 w-4 flex-shrink-0 text-white/35" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={messages.library.searchPlaceholder}
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-white/25"
            />
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              setEditorTask({
                id: `custom-${Date.now()}`,
                label: "",
                shortLabel: "",
                icon: "sparkles",
                durationMinutes: 3,
              })
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold transition hover:border-[#ec4899] hover:bg-[#ec4899] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={messages.library.addTask}
          >
            <Plus className="h-4 w-4" />
            <span>{messages.library.addTask}</span>
          </button>
        </div>

        {errorMessage ? (
          <p className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {errorMessage}
          </p>
        ) : null}

        <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-1 pr-2 md:grid-cols-2">
          {filteredTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              disabled={isPending}
              onClick={() => {
                if (context?.mode === "manage") {
                  setEditorTask(task);
                  return;
                }

                if (context?.mode === "scheduler_quick") {
                  void onAssignTask(task, assignPeriodDefault);
                  return;
                }

                setPendingTask(task);
              }}
              className="flex items-center gap-3 rounded-xl border border-transparent bg-white/5 p-3 text-left transition hover:border-[#ec4899] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#120d2b] text-white"
                style={
                  resolveBoardTaskColor(task.color)
                    ? { backgroundColor: resolveBoardTaskColor(task.color) ?? undefined }
                    : undefined
                }
              >
                {task.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveMediaUrl(task.imageUrl) ?? task.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <TaskIcon icon={task.icon} className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{task.label}</div>
              </div>
              <div className="text-white/30">
                {context?.mode === "manage" ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </div>
            </button>
          ))}
        </div>
      </OverlayModalShell>

      <AssignPeriodModal
        key={pendingTask ? `${pendingTask.id}-${context?.defaultMode ?? "morning"}` : "assign-period"}
        open={pendingTask !== null && context?.mode !== "scheduler_quick"}
        task={pendingTask}
        defaultMode={assignPeriodDefault}
        onClose={() => {
          setPendingTask(null);
          onClose();
        }}
        onConfirm={async (period) => {
          if (pendingTask) {
            const success = await onAssignTask(pendingTask, period);

            if (!success) {
              return false;
            }
          }

          setPendingTask(null);
          return true;
        }}
      />

      <TaskEditorModal
        key={editorTask?.id ?? "task-editor"}
        open={editorTask !== null}
        task={editorTask}
        isPending={isPending}
        onClose={() => {
          setEditorTask(null);
          onClose();
        }}
        onSave={async (task) => {
          const success = await onSaveTask(task);

          if (success) {
            setEditorTask(null);
          }

          return success;
        }}
        onDelete={
          onDeleteTask
            ? async (task) => {
                const success = await onDeleteTask(task);

                if (success) {
                  setEditorTask(null);
                }

                return success;
              }
            : undefined
        }
      />
    </>
  );
}

export function SchedulerModal({
  open,
  profiles,
  tasks,
  isPending = false,
  errorMessage,
  onClose,
  onRequestAutoAssign,
  onRequestQuickAdd,
  onApply,
  onRemoveScheduledDay,
}: SchedulerModalProps) {
  const messages = useAppMessages();
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedTab, setSelectedTab] = useState<"week" | "bulk">("week");
  const [selectedPeriod, setSelectedPeriod] = useState<BoardAssignPeriod | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([new Date().getDay()]);
  const [expandedDays, setExpandedDays] = useState<number[]>([]);
  const [pendingRemove, setPendingRemove] = useState<{
    task: BoardTask;
    day: number;
    period: BoardMode;
  } | null>(null);

  const filteredTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return tasks;
    }

    return tasks.filter((task) =>
      `${task.label} ${task.shortLabel}`.toLowerCase().includes(normalized),
    );
  }, [query, tasks]);

  const selectedProfile =
    profiles.find((profile) => profile.id === selectedProfileId) ?? null;
  const orderedDays = [1, 2, 3, 4, 5, 6, 0] as const;

  const getTasksForDay = (period: BoardMode, day: number) =>
    (selectedProfile?.tasksByMode[period] ?? []).filter((task) =>
      !task.scheduleDays || task.scheduleDays.length === 0
        ? true
        : task.scheduleDays.includes(day),
    );

  return (
    <>
      <OverlayModalShell
        open={open}
        onClose={onClose}
        showCloseButton={false}
        panelClassName="h-[85vh] w-full max-w-5xl overflow-hidden rounded-3xl p-0"
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-[#120d2b]/50 p-4">
          <h3 className="text-xl font-bold">{messages.library.schedulerTitle}</h3>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={messages.common.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex h-[calc(85vh-65px)] overflow-hidden">
          <div className="flex w-24 shrink-0 flex-col items-center gap-4 overflow-y-auto border-r border-white/10 bg-white/5 px-2 py-4">
            <p className="mb-2 w-full text-center text-[10px] font-bold uppercase text-white/30">
              {messages.library.schedulerWho}
            </p>
            <div className="flex w-full flex-col items-center gap-3">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={cn(
                    "w-full rounded-xl border border-transparent p-2 opacity-60 transition hover:bg-white/5 hover:opacity-100",
                    selectedProfileId === profile.id
                      ? "bg-white/10 opacity-100"
                      : "",
                  )}
                >
                  <div
                    className={cn(
                      "mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-transparent bg-[#1e163d] text-lg shadow-md transition-all",
                      selectedProfileId === profile.id && "scale-110 border-[#ec4899]",
                    )}
                  >
                    <ProfileAvatar
                      avatar={profile.avatar}
                      photoUrl={profile.photoUrl}
                      alt={profile.name}
                      emojiClassName="text-lg"
                    />
                  </div>
                  <span className="mt-1 block truncate text-center text-[9px] font-bold">
                    {profile.name}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={() => onRequestAutoAssign(selectedProfile?.id ?? null)}
              className="mb-2 mt-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#ec4899]/30 bg-[#ec4899]/20 text-[#ec4899] transition hover:bg-[#ec4899]/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={messages.library.magicAuto}
              title={messages.library.magicAuto}
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-4">
            <div className="mx-auto mb-4 flex w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-1">
              <div className="toggle-container flex w-full rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setSelectedTab("week")}
                  className={cn("toggle-btn flex-1 rounded-lg px-4 py-2 text-xs font-bold", selectedTab === "week" && "active")}
                >
                  {messages.library.weekView}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab("bulk")}
                  className={cn("toggle-btn flex-1 rounded-lg px-4 py-2 text-xs font-bold", selectedTab === "bulk" && "active")}
                >
                  {messages.library.bulkAdd}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <p className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {errorMessage}
              </p>
            ) : null}

            {selectedTab === "week" ? (
              selectedProfile ? (
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {orderedDays.map((day, index) => (
                    (() => {
                      const dayName = messages.library.weekDayNames[index];
                      const morningTasks = getTasksForDay("morning", day);
                      const eveningTasks = getTasksForDay("evening", day);
                      const count = morningTasks.length + eveningTasks.length;
                      const expanded = expandedDays.includes(day);

                      return (
                        <section
                          key={`${day}-${index}`}
                          className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDays((current) =>
                                current.includes(day)
                                  ? current.filter((entry) => entry !== day)
                                  : [...current, day],
                              )
                            }
                            className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/5 bg-white/10 text-xs font-bold">
                                {dayName.slice(0, 3)}
                              </div>
                              <span className="text-sm font-bold text-white/90">{dayName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {count > 0 ? (
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">
                                  {count}
                                </span>
                              ) : null}
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 text-white/30 transition-transform duration-300",
                                  expanded && "rotate-180",
                                )}
                              />
                            </div>
                          </button>

                          {expanded ? (
                            <div className="border-t border-white/5 bg-[#0f0b24]/30">
                              {([
                                { period: "morning" as const, tasks: morningTasks, icon: Sun, tone: "text-yellow-400" },
                                { period: "evening" as const, tasks: eveningTasks, icon: Moon, tone: "text-violet-400" },
                              ]).map(({ period, tasks: periodTasks, icon: PeriodIcon, tone }) => (
                                <div
                                  key={`${day}-${period}`}
                                  className={cn(
                                    "flex items-start gap-3 p-3",
                                    period === "morning" && "border-b border-white/5",
                                  )}
                                >
                                  <div className="mt-1.5 flex items-center gap-1 opacity-80">
                                    <PeriodIcon className={cn("h-3.5 w-3.5", tone)} />
                                    <span className="text-xs font-semibold text-white/60">
                                      {period === "morning" ? messages.board.morning : messages.board.evening}
                                    </span>
                                  </div>
                                  <div className="flex flex-1 flex-wrap gap-2">
                                    {periodTasks.map((task) => (
                                      <button
                                        key={`${task.id}-${day}`}
                                        type="button"
                                        onClick={() => setPendingRemove({ task, day, period })}
                                        className="group relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg shadow-sm transition hover:scale-110"
                                        title={task.label}
                                        style={
                                          resolveBoardTaskColor(task.color)
                                            ? { backgroundColor: resolveBoardTaskColor(task.color) ?? undefined }
                                            : undefined
                                        }
                                      >
                                        {task.imageUrl ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={resolveMediaUrl(task.imageUrl) ?? task.imageUrl} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                          <TaskIcon icon={task.icon} className="h-4 w-4" />
                                        )}
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onRequestQuickAdd({
                                          profileId: selectedProfile.id,
                                          period,
                                          day,
                                        })
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-white/10 text-white/30 transition hover:border-white hover:bg-white/5 hover:text-white"
                                      aria-label={`${messages.library.add} ${period === "morning" ? messages.board.morning : messages.board.evening}`}
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </section>
                      );
                    })()
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-black/10 px-6 text-center text-sm italic text-white/35">
                  {messages.library.selectCrewMember}
                </div>
              )
            ) : (
              <>
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="space-y-6">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="mb-2 text-xs font-bold uppercase text-white/50">
                        {messages.library.schedulerWhat}
                      </p>
                      <div className="mb-2 flex items-center rounded-xl border border-white/10 bg-[#120d2b] px-3">
                        <Search className="h-4 w-4 text-white/35" />
                        <input
                          type="text"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder={messages.library.addTasksPlaceholder}
                          className="w-full bg-transparent p-2 text-sm outline-none placeholder:text-white/25"
                        />
                      </div>

                      <div className="grid h-48 grid-cols-2 gap-2 overflow-y-auto rounded-xl bg-[#120d2b] p-2">
                        {filteredTasks.map((task) => {
                          const selected = selectedTaskIds.includes(task.id);

                          return (
                            <button
                              key={task.id}
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                setSelectedTaskIds((current) =>
                                  current.includes(task.id)
                                    ? current.filter((id) => id !== task.id)
                                    : [...current, task.id],
                                )
                              }
                              className={cn(
                                "flex items-center gap-2 rounded-lg border p-2 text-left transition disabled:cursor-not-allowed disabled:opacity-40",
                                selected
                                  ? "border-[#ec4899] bg-white/20"
                                  : "border-transparent hover:border-[#ec4899] hover:bg-white/5",
                              )}
                            >
                              <div
                                className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[#120d2b] text-white"
                                style={
                                  resolveBoardTaskColor(task.color)
                                    ? { backgroundColor: resolveBoardTaskColor(task.color) ?? undefined }
                                    : undefined
                                }
                              >
                                {task.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={resolveMediaUrl(task.imageUrl) ?? task.imageUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <TaskIcon icon={task.icon} className="h-3.5 w-3.5" />
                                )}
                              </div>
                              <span className="min-w-0 flex-1 truncate text-sm font-bold">
                                {task.label}
                              </span>
                              {selected ? <Check className="h-4 w-4 text-emerald-300" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-bold uppercase text-white/50">
                        {messages.library.schedulerWhen}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedPeriod("morning")}
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/10 p-3 transition",
                            selectedPeriod === "morning"
                              ? "border-yellow-400 opacity-100"
                              : "opacity-50",
                          )}
                        >
                          <Sun className="h-4 w-4 text-yellow-400" />
                          <span>{messages.board.morning}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPeriod("evening")}
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/10 p-3 transition",
                            selectedPeriod === "evening"
                              ? "border-violet-400 opacity-100"
                              : "opacity-50",
                          )}
                        >
                          <Moon className="h-4 w-4 text-violet-400" />
                          <span>{messages.board.evening}</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPeriod("both")}
                        className={cn(
                          "mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/10 p-3 transition",
                          selectedPeriod === "both"
                            ? "border-[#ec4899] opacity-100"
                            : "opacity-50",
                        )}
                      >
                        <CalendarDays className="h-4 w-4" />
                        <span>{messages.library.bothPeriods}</span>
                      </button>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-bold uppercase text-white/50">
                        {messages.library.schedulerDays}
                      </p>
                      <div className="flex justify-between gap-1" id="scheduler-day-buttons">
                        {orderedDays.map((day, index) => {
                          const active = selectedDays.includes(day);

                          return (
                            <button
                              key={`${day}-select`}
                              type="button"
                              onClick={() =>
                                setSelectedDays((current) =>
                                  current.includes(day)
                                    ? current.filter((entry) => entry !== day)
                                    : [...current, day].sort((left, right) => left - right),
                                )
                              }
                              className={cn(
                                "day-btn flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold",
                                active
                                  ? "border-[#ec4899] bg-[#ec4899] text-white"
                                  : "border-white/20 bg-white/5 text-white/70",
                              )}
                            >
                              {messages.library.weekDays[index]}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedDays([...orderedDays])}
                          className="text-xs text-[#ec4899]"
                        >
                          {messages.library.allDays}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                  <div className="text-sm text-white/60">
                    {selectedProfile
                      ? messages.library.selectedProfileMissions(selectedProfile.name, selectedTaskIds.length)
                      : messages.library.selectCrewMember}
                  </div>
                  <button
                    type="button"
                    disabled={
                      isPending
                      || !selectedProfile
                      || !selectedPeriod
                      || selectedDays.length === 0
                      || selectedTaskIds.length === 0
                    }
                    onClick={async () => {
                      if (
                        !selectedProfile
                        || !selectedPeriod
                        || selectedTaskIds.length === 0
                        || selectedDays.length === 0
                      ) {
                        return;
                      }

                      const success = await onApply({
                        profileId: selectedProfile.id,
                        taskIds: selectedTaskIds,
                        period: selectedPeriod,
                        scheduleDays: selectedDays,
                      });

                      if (success) {
                        setSelectedTaskIds([]);
                      }
                    }}
                    className="rounded-xl bg-[linear-gradient(90deg,#ec4899,#f97316)] px-5 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? messages.common.saving : messages.library.confirm}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </OverlayModalShell>
      {pendingRemove && selectedProfile ? (
        <ConfirmModal
          open
          title={messages.common.warning}
          message={messages.board.removeTaskConfirm(
            pendingRemove.task.label,
            pendingRemove.period === "morning" ? messages.board.morning : messages.board.evening,
          )}
          confirmLabel={messages.common.yes}
          onCancel={() => setPendingRemove(null)}
          onConfirm={async () => {
            const success = await onRemoveScheduledDay({
              profileId: selectedProfile.id,
              routineTaskId: pendingRemove.task.id,
              day: pendingRemove.day,
            });

            if (success) {
              setPendingRemove(null);
            }
          }}
        />
      ) : null}
    </>
  );
}

export function AutoAssignOfferModal({
  open,
  pending = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => boolean | Promise<boolean>;
}) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="w-full max-w-sm rounded-3xl border border-[#ec4899]/40 p-8 text-center shadow-2xl"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ec4899]/20 text-[#ec4899]">
        <Sparkles className="h-8 w-8" />
      </div>
      <h3 className="mb-2 text-xl font-bold">{messages.library.magicSetupTitle}</h3>
      <p className="mb-6 text-sm text-white/60">
        {messages.library.magicSetupDescription}
      </p>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="w-full rounded-xl bg-[linear-gradient(90deg,#ec4899,#f97316)] py-3 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {messages.library.yesMagic}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className="w-full rounded-xl bg-white/10 py-3 font-bold text-white/75 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {messages.library.noThanks}
        </button>
      </div>
    </OverlayModalShell>
  );
}

export function AutoAssignConfirmModal({
  open,
  profileName,
  tasks,
  pending = false,
  errorMessage,
  onClose,
  onConfirm,
}: {
  open: boolean;
  profileName?: string | null;
  tasks: BoardTask[];
  pending?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (selectedTaskIds: string[]) => boolean | Promise<boolean>;
}) {
  const messages = useAppMessages();
  const [disabledTaskIds, setDisabledTaskIds] = useState<string[]>([]);
  const selectedTasks = useMemo(
    () => tasks.filter((task) => !disabledTaskIds.includes(task.id)),
    [disabledTaskIds, tasks],
  );

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="flex max-h-[80vh] w-full max-w-md flex-col rounded-3xl p-6"
    >
      <h3 className="mb-4 text-center text-xl font-bold">
        {messages.library.magicTasksTitle}
      </h3>
      <p className="mb-4 text-center text-xs text-white/50">
        {profileName
          ? `${profileName} · ${messages.library.magicTasksDescription}`
          : messages.library.magicTasksDescription}
      </p>
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
          {messages.library.magicTasksSelectedCount(selectedTasks.length, tasks.length)}
        </p>
        <p className="mt-1 text-xs text-white/55">
          {messages.library.magicTasksSelectionHint}
        </p>
      </div>
      {errorMessage ? (
        <p className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {errorMessage}
        </p>
      ) : null}
      <div className="mb-4 flex-1 space-y-2 overflow-y-auto rounded-xl bg-white/5 p-2 pr-2">
        {tasks.map((task) => (
          (() => {
            const isEnabled = !disabledTaskIds.includes(task.id);

            return (
              <div
                key={`${task.id}-${task.recommendedPeriod ?? "both"}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-2 transition",
                  isEnabled
                    ? "border-white/10 bg-white/10"
                    : "border-white/5 bg-black/10 opacity-45",
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div
                  className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#120d2b] text-white"
                  style={
                    resolveBoardTaskColor(task.color)
                      ? { backgroundColor: resolveBoardTaskColor(task.color) ?? undefined }
                      : undefined
                  }
                >
                  {task.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveMediaUrl(task.imageUrl) ?? task.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <TaskIcon icon={task.icon} className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{task.label}</div>
                  <div className="text-[10px] text-white/50">
                    {task.recommendedPeriod === "both"
                      ? messages.library.bothPeriods
                      : task.recommendedPeriod === "morning"
                        ? messages.board.morning
                        : messages.board.evening}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    setDisabledTaskIds((current) =>
                      current.includes(task.id)
                        ? current.filter((id) => id !== task.id)
                        : [...current, task.id],
                    )
                  }
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50",
                    isEnabled
                      ? "border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                      : "border-emerald-400/20 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white",
                  )}
                  aria-label={
                    isEnabled
                      ? messages.library.disableSuggestion(task.label)
                      : messages.library.enableSuggestion(task.label)
                  }
                  title={
                    isEnabled
                      ? messages.library.disableSuggestion(task.label)
                      : messages.library.enableSuggestion(task.label)
                  }
                >
                  {isEnabled ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })()
        ))}
      </div>
      {selectedTasks.length === 0 ? (
        <p className="mb-4 text-center text-xs text-white/45">
          {messages.library.magicTasksEmptySelection}
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending || selectedTasks.length === 0}
        onClick={() => onConfirm(selectedTasks.map((task) => task.id))}
        className="w-full rounded-xl bg-[linear-gradient(90deg,#ec4899,#f97316)] py-3 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? messages.common.saving : messages.library.addAll}
      </button>
    </OverlayModalShell>
  );
}

function AssignPeriodModal({
  open,
  task,
  defaultMode,
  onClose,
  onConfirm,
}: {
  open: boolean;
  task: BoardTask | null;
  defaultMode: BoardMode;
  onClose: () => void;
  onConfirm: (period: BoardAssignPeriod) => boolean | Promise<boolean>;
}) {
  const messages = useAppMessages();
  const [period, setPeriod] = useState<BoardAssignPeriod>(defaultMode);

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="w-full max-w-sm rounded-3xl border border-white/10 p-6 text-center"
    >
      <div className="mb-2 flex justify-center text-[#ec4899]">
        <CalendarDays className="h-8 w-8" />
      </div>
      <h3 className="mb-4 text-xl font-bold">{messages.library.assignTask}</h3>
      <div className="mb-6 flex justify-center">
        <div className="flex flex-col items-center">
          <div
            className="mb-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#120d2b] text-white shadow-lg"
            style={
              resolveBoardTaskColor(task?.color)
                ? { backgroundColor: resolveBoardTaskColor(task?.color) ?? undefined }
                : undefined
            }
          >
            {task?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveMediaUrl(task.imageUrl) ?? task.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : task ? (
              <TaskIcon icon={task.icon} className="h-7 w-7" />
            ) : null}
          </div>
          <span className="text-sm font-bold text-white">{task?.label}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setPeriod("morning")}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border bg-black/10 p-4 text-sm font-bold transition",
            period === "morning"
              ? "border-yellow-400 text-white"
              : "border-white/10 text-white/65 hover:border-yellow-400/60",
          )}
        >
          <Sun className="h-6 w-6 text-yellow-400" />
          <span>{messages.board.morning}</span>
        </button>
        <button
          type="button"
          onClick={() => setPeriod("evening")}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border bg-black/10 p-4 text-sm font-bold transition",
            period === "evening"
              ? "border-violet-400 text-white"
              : "border-white/10 text-white/65 hover:border-violet-400/60",
          )}
        >
          <Moon className="h-6 w-6 text-violet-400" />
          <span>{messages.board.evening}</span>
        </button>
      </div>
      <button
        type="button"
        onClick={() => setPeriod("both")}
        className={cn(
          "mt-4 w-full rounded-xl border bg-black/10 px-4 py-4 text-sm font-bold transition",
          period === "both"
            ? "border-[#ec4899] text-white"
            : "border-white/10 text-white/65 hover:border-[#ec4899]/60",
        )}
      >
        {messages.library.bothPeriods}
      </button>
      <button
        type="button"
        onClick={async () => {
          const success = await onConfirm(period);

          if (success) {
            onClose();
          }
        }}
        className="mt-4 w-full rounded-xl bg-[linear-gradient(90deg,#ec4899,#f97316)] py-3 font-bold text-white shadow-lg"
      >
        {messages.library.add}
      </button>
    </OverlayModalShell>
  );
}

function TaskEditorModal({
  open,
  task,
  isPending = false,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  task: BoardTask | null;
  isPending?: boolean;
  onClose: () => void;
  onSave: (task: BoardTask) => boolean | Promise<boolean>;
  onDelete?: (task: BoardTask) => boolean | Promise<boolean>;
}) {
  const messages = useAppMessages();
  const [label, setLabel] = useState(task?.label ?? "");
  const [icon, setIcon] = useState<TaskIconName>(task?.icon ?? "sparkles");
  const [imageUrl, setImageUrl] = useState<string | null>(task?.imageUrl ?? null);
  const [color, setColor] = useState<string>(resolveBoardTaskColor(task?.color) ?? boardTaskColorOptions[0]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const durationMinutes = task?.durationMinutes ?? 3;

  return (
    <>
      {cropSource === null ? (
        <OverlayModalShell
          open={open}
          onClose={onClose}
          panelClassName="w-full max-w-3xl overflow-hidden rounded-3xl"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";

              if (!file) {
                return;
              }

              if (!file.type.startsWith("image/")) {
                setImageError(messages.profile.imageInvalid);
                return;
              }

              if (file.size > maxTaskImageBytes) {
                setImageError(messages.profile.imageTooLarge);
                return;
              }

              setCropSource(await readImageFileAsDataUrl(file));
              setImageError(null);
            }}
          />

          <div className="flex max-h-[84vh] flex-col lg:flex-row">
            <div className="flex shrink-0 flex-col border-b border-white/10 bg-white/5 p-6 lg:w-[260px] lg:border-b-0 lg:border-r">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                {messages.library.missionLabel}
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">
                {label.trim() || messages.library.addMission}
              </h3>
              <p className="mt-1 text-sm text-white/50">
                {imageUrl ? messages.profile.replacePhoto : messages.profile.photoButton}
              </p>

              <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-4">
                <div
                  className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/10 text-4xl shadow-lg"
                  style={{ backgroundColor: color }}
                >
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveMediaUrl(imageUrl) ?? imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <TaskIcon icon={icon} className="h-11 w-11 text-white" />
                  )}
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{messages.profile.photoButton}</span>
                </button>
              </div>
            </div>

            <div className="min-w-0 flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                      {messages.library.titleLabel}
                    </span>
                    <input
                      type="text"
                      value={label}
                      onChange={(event) => setLabel(event.target.value)}
                      placeholder={messages.profile.namePlaceholder}
                      className="w-full rounded-xl border border-white/10 bg-white/10 p-4 font-bold text-white outline-none transition focus:border-[#ec4899]"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                    {messages.library.colorLabel}
                  </p>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                    {boardTaskColorOptions.map((option, index) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setColor(option)}
                        className={cn(
                          "h-10 w-full rounded-full ring-2 ring-transparent transition",
                          color === option && "ring-white",
                        )}
                        style={{ backgroundColor: option }}
                        aria-label={`${messages.library.colorLabel} ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                      {messages.library.icon}
                    </p>
                    {imageUrl ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setImageUrl(null)}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold text-white/70 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {messages.profile.removePhoto}
                      </button>
                    ) : null}
                  </div>
                  <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto rounded-xl bg-white/5 p-2 sm:grid-cols-5 md:grid-cols-6">
                    {boardTaskIconOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          setIcon(option);
                          setImageUrl(null);
                        }}
                        className={cn(
                          "flex h-11 items-center justify-center rounded-xl border border-transparent bg-white/5 text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40",
                          icon === option && imageUrl === null && "border-white/20 bg-white/[0.12] text-white",
                        )}
                      >
                        <TaskIcon icon={option} className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {imageError ? (
                  <p className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {imageError}
                  </p>
                ) : null}

                <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row">
                  {task && !task.isBuiltIn && onDelete ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-500/20 px-4 py-3 text-red-400 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={messages.common.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{messages.common.delete}</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={async () => {
                      const normalizedLabel = label.trim() || messages.library.addMission;

                      await onSave({
                        id: task?.id ?? `custom-${Date.now()}`,
                        label: normalizedLabel,
                        shortLabel: normalizedLabel.slice(0, 20),
                        icon,
                        imageUrl,
                        color,
                        durationMinutes,
                        isBuiltIn: task?.isBuiltIn,
                      });
                    }}
                    className="flex-1 rounded-xl bg-[linear-gradient(90deg,#ec4899,#f97316)] py-3 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? messages.common.saving : messages.common.save}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </OverlayModalShell>
      ) : null}
      {task && !task.isBuiltIn && onDelete ? (
        <ConfirmModal
          open={deleteConfirmOpen}
          title={messages.common.warning}
          message={messages.library.deleteTaskConfirm(task.label)}
          confirmLabel={messages.common.yes}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={async () => {
            const success = await onDelete(task);

            if (success) {
              setDeleteConfirmOpen(false);
            }
          }}
        />
      ) : null}
      <ProfilePhotoCropperModal
        key={cropSource ?? "task-editor-photo"}
        open={cropSource !== null}
        sourceUrl={cropSource}
        pending={isPending}
        onClose={() => setCropSource(null)}
        onConfirm={async (nextPhotoUrl) => {
          setImageUrl(nextPhotoUrl);
          setCropSource(null);
        }}
      />
    </>
  );
}
