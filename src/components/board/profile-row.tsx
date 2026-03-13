"use client";

import {
  Check,
  Minus,
  Plus,
  Smile,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { TaskIcon } from "@/components/board/task-icon";
import { ProfileAvatar } from "@/components/shared/profile-avatar";
import { resolveBoardTaskColor } from "@/lib/data/board-library";
import type {
  BoardProfile,
  BoardTask,
} from "@/lib/data/prototype-seed";
import { cn } from "@/lib/utils";

type ProfileRowProps = {
  profile: BoardProfile;
  tasks: BoardTask[];
  completedTaskIds: Set<string>;
  completedTaskOrderIds?: string[];
  isDeleteMode: boolean;
  onAvatarClick: () => void;
  onAddTask: () => void;
  onRemoveTask: (taskId: string) => void;
  onReorderTasks: (orderedTaskIds: string[]) => void | Promise<void>;
  onToggleDeleteMode: () => void;
  onToggleTask: (taskId: string) => void;
};

export function ProfileRow(props: ProfileRowProps) {
  const {
    profile,
    tasks,
    completedTaskIds,
    completedTaskOrderIds = [],
    isDeleteMode,
    onAvatarClick,
    onAddTask,
    onRemoveTask,
    onToggleDeleteMode,
    onToggleTask,
  } = props;
  void props.onReorderTasks;

  const messages = useAppMessages();
  const completedCount = tasks.filter((task) => completedTaskIds.has(task.id)).length;
  const progress = tasks.length === 0 ? 0 : completedCount / tasks.length;
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - progress * circumference;
  const taskIds = tasks.map((task) => task.id);
  const orderedTaskIds = useMemo(() => {
    const taskIdSet = new Set(taskIds);
    const orderedCompletedIds = completedTaskOrderIds.filter((taskId) =>
      taskIdSet.has(taskId),
    );
    const orderedCompletedIdSet = new Set(orderedCompletedIds);
    const completedIdsMissingFromOrder = taskIds.filter(
      (taskId) =>
        completedTaskIds.has(taskId) && !orderedCompletedIdSet.has(taskId),
    );
    const completedIds = [...orderedCompletedIds, ...completedIdsMissingFromOrder];
    const completedIdSet = new Set(completedIds);
    const incompleteIds = taskIds.filter((taskId) => !completedIdSet.has(taskId));

    return [...incompleteIds, ...completedIds];
  }, [completedTaskIds, completedTaskOrderIds, taskIds]);
  const tasksById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const orderedTasks = useMemo(
    () =>
      orderedTaskIds
        .map((taskId) => tasksById.get(taskId))
        .filter((task): task is BoardTask => Boolean(task)),
    [orderedTaskIds, tasksById],
  );

  return (
    <article
      className={cn(
        "relative mb-2 flex w-full items-center gap-2 animate-[fadeIn_0.5s]",
        isDeleteMode && "delete-mode-active",
      )}
    >
      <div className="relative z-10 flex w-24 flex-shrink-0 flex-col items-center justify-center">
        <button
          type="button"
          onClick={onAvatarClick}
          className="group relative flex h-20 w-20 cursor-pointer items-center justify-center"
          aria-label={messages.board.editAvatarForProfile(profile.name)}
        >
          <svg className="absolute inset-0 h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
            <circle
              className="text-white/5"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r="36"
              cx="40"
              cy="40"
            />
            <circle
              strokeWidth="4"
              strokeLinecap="round"
              stroke={progress === 1 ? "#10b981" : "#ec4899"}
              fill="transparent"
              r="36"
              cx="40"
              cy="40"
              className={cn("progress-ring__circle", progress === 1 && "ring-victory")}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: dashOffset,
              }}
            />
          </svg>
          <div
            className={cn(
              "absolute inset-[12px] flex items-center justify-center overflow-hidden rounded-full border-2 border-white/10 bg-[#1e163d] text-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
              progress === 1 && "avatar-victory",
            )}
          >
            <ProfileAvatar
              avatar={profile.avatar}
              photoUrl={profile.photoUrl}
              alt={profile.name}
              emojiClassName="text-3xl"
            />
          </div>
          <div className="absolute bottom-0 right-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#120d2b] bg-white text-black opacity-0 shadow-lg transition group-hover:opacity-100">
            <span className="text-[8px]">✎</span>
          </div>
        </button>
        <div className="mt-1 flex flex-col items-center text-center">
          <div className="max-w-full truncate rounded border border-white/5 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-white/80">
            {profile.name}
          </div>
          <div
            className={cn(
              "mt-1 flex h-3 items-center gap-1 text-[9px] font-bold",
              profile.streak > 0 ? "text-orange-300" : "text-transparent",
            )}
            aria-hidden={profile.streak <= 0}
          >
            <span className={cn(profile.streak > 0 ? "text-orange-400" : "text-transparent")}>
              🔥
            </span>
            <span>{profile.streak > 0 ? profile.streak : "0"}</span>
          </div>
        </div>
      </div>

      <div className="flex h-24 min-w-0 flex-1 items-center gap-3 overflow-x-auto rounded-2xl border border-white/5 bg-white/5 p-2 pl-3 task-scroll-container no-scrollbar">
        <div className="w-1 flex-shrink-0" />
        {orderedTasks.length > 0 ? (
          orderedTasks.map((task) => (
            <TaskTile
              key={task.id}
              task={task}
              isCompleted={completedTaskIds.has(task.id)}
              isDeleteMode={isDeleteMode}
              deleteAriaLabel={`${messages.common.delete} ${task.label}`}
              onRemove={() => onRemoveTask(task.id)}
              onClick={() => onToggleTask(task.id)}
            />
          ))
        ) : (
          <div className="flex h-20 w-full flex-col items-center justify-center text-xs italic text-white/20">
            <Smile className="mb-1 h-4 w-4" aria-hidden="true" />
            <span>{messages.board.rest}</span>
          </div>
        )}
        <div className="w-1 flex-shrink-0" />
      </div>

      <div className="flex w-10 flex-shrink-0 flex-col items-center justify-center gap-2">
        <button
          type="button"
          onClick={onAddTask}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ec4899]/30 bg-[#ec4899]/20 text-[#ec4899] shadow-lg transition hover:bg-[#ec4899] hover:text-white"
          aria-label={messages.board.addTaskForProfile(profile.name)}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleDeleteMode}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 transition",
            isDeleteMode
              ? "bg-red-500 text-white"
              : "bg-white/5 text-white/30 hover:bg-red-500/20",
          )}
          aria-label={messages.board.deleteTaskForProfile(profile.name)}
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function TaskTile({
  task,
  isCompleted,
  isDeleteMode,
  deleteAriaLabel,
  onRemove,
  onClick,
}: {
  task: BoardTask;
  isCompleted: boolean;
  isDeleteMode: boolean;
  deleteAriaLabel: string;
  onRemove: () => void;
  onClick: () => void;
}) {
  const taskColor = resolveBoardTaskColor(task.color);

  return (
    <div className="relative flex h-20 w-20 flex-none">
      {isCompleted && !isDeleteMode ? (
        <span className="check-anim pointer-events-none absolute -right-1 -top-1 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/70 bg-[#120d2b] text-emerald-300 shadow-[0_10px_24px_rgba(16,185,129,0.35)]">
          <Check className="h-3.5 w-3.5" />
        </span>
      ) : null}

      <button
        type="button"
        tabIndex={isDeleteMode ? 0 : -1}
        aria-hidden={!isDeleteMode}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove();
        }}
        className="task-trash absolute -right-1 -top-1 z-20 h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition hover:scale-110"
        aria-label={deleteAriaLabel}
      >
        <Trash2 className="h-3 w-3" />
      </button>

      <button
        type="button"
        onClick={onClick}
        title={task.label}
        className={cn(
          "task-card group relative flex h-20 w-20 flex-none flex-col items-center justify-center overflow-hidden rounded-xl border text-left transition-all",
          isCompleted
            ? "task-done"
            : "border-white/10 bg-white/5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]",
        )}
        style={
          !isCompleted && taskColor
            ? {
                backgroundColor: `${taskColor}22`,
                borderColor: `${taskColor}66`,
              }
            : undefined
        }
      >
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg px-2 pb-4 pt-1 text-white drop-shadow-md">
          {task.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={task.imageUrl}
              alt=""
              className="board-task-visual h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <TaskIcon icon={task.icon} className="board-task-visual h-8 w-8" />
          )}
        </div>

        {!isCompleted ? (
          <span className="absolute bottom-1 w-full truncate px-1 text-center text-[8px] font-bold uppercase tracking-[0.12em] text-white/80">
            {task.label}
          </span>
        ) : null}
      </button>
    </div>
  );
}
