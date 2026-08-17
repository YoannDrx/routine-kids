"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { ConfirmModal } from "@/components/board/feedback-modals";
import { TaskIcon } from "@/components/board/task-icon";
import { type ParentWorkbenchMutationResult } from "@/components/parent/workbench-types";
import { boardTaskIconOptions } from "@/lib/data/board-library";
import { type TaskIconName } from "@/lib/data/prototype-seed";
import { cn } from "@/lib/utils";

type TaskTemplateRecord = {
  id: string;
  title: string;
  shortLabel: string | null;
  icon: string | null;
  durationMinutes: number | null;
  isBuiltIn: boolean;
};

type TaskTemplateWorkbenchProps = {
  templates: TaskTemplateRecord[];
  onSaveAction: (input: {
    templateId?: string;
    title: string;
    shortLabel: string;
    icon: string;
    durationMinutes: number;
  }) => Promise<ParentWorkbenchMutationResult>;
  onDeleteAction: (input: {
    templateId: string;
  }) => Promise<ParentWorkbenchMutationResult>;
};

type TaskTemplateDraft = {
  title: string;
  shortLabel: string;
  icon: TaskIconName;
  durationMinutes: number;
};

const emptyDraft = {
  title: "",
  shortLabel: "",
  icon: "sparkles",
  durationMinutes: 3,
} satisfies TaskTemplateDraft;

export function TaskTemplateWorkbench({
  templates,
  onSaveAction,
  onDeleteAction,
}: TaskTemplateWorkbenchProps) {
  const messages = useAppMessages();
  const router = useRouter();
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskTemplateDraft>(emptyDraft);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [templatePendingDelete, setTemplatePendingDelete] =
    useState<TaskTemplateRecord | null>(null);

  const editingTemplate = useMemo(
    () => templates.find((template) => template.id === editingTemplateId) ?? null,
    [editingTemplateId, templates],
  );

  const resetDraft = () => {
    setEditingTemplateId(null);
    setDraft(emptyDraft);
  };

  const submit = () => {
    setIsPending(true);
    setMessage(null);

    startTransition(async () => {
      const result = await onSaveAction({
        templateId: editingTemplateId ?? undefined,
        title: draft.title,
        shortLabel: draft.shortLabel,
        icon: draft.icon,
        durationMinutes: draft.durationMinutes,
      });

      setIsPending(false);
      setMessage(result.message);
      setMessageTone(result.status === "success" ? "success" : "error");

      if (result.status === "success") {
        resetDraft();
        router.refresh();
      }
    });
  };

  const removeTemplate = (template: TaskTemplateRecord) => {
    if (template.isBuiltIn) {
      setMessage(messages.forms.templateDeleteProtected);
      setMessageTone("error");
      return;
    }

    setIsPending(true);
    setMessage(null);

    startTransition(async () => {
      const result = await onDeleteAction({
        templateId: template.id,
      });

      setIsPending(false);
      setMessage(result.message);
      setMessageTone(result.status === "success" ? "success" : "error");

      if (result.status === "success") {
        if (editingTemplateId === template.id) {
          resetDraft();
        }
        router.refresh();
      }
    });
  };

  return (
    <>
      <section className="rounded-[32px] border border-white/10 bg-black/15 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              {messages.forms.taskTemplates}
            </p>
            <h3 className="mt-1 font-display text-2xl text-white">
              {messages.forms.liveLibrary}
            </h3>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setMessage(null);
              resetDraft();
            }}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#ff6fb5,#ff9c4a)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {messages.forms.newTemplate}
          </button>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-3">
            {templates.map((template) => {
              const iconName = boardTaskIconOptions.includes(
                (template.icon ?? "sparkles") as TaskIconName,
              )
                ? ((template.icon ?? "sparkles") as TaskIconName)
                : "sparkles";

              return (
                <article
                  key={template.id}
                  className="flex flex-wrap items-center gap-3 rounded-[24px] border border-white/10 bg-white/6 p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#120d2b] text-white">
                    <TaskIcon icon={iconName} className="h-5 w-5" />
                  </div>
                  <div className="min-w-[180px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-white">
                        {template.title}
                      </h4>
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                          template.isBuiltIn
                            ? "border-cyan-300/20 bg-cyan-500/10 text-cyan-100"
                            : "border-white/10 bg-black/20 text-white/60",
                        )}
                      >
                        {template.isBuiltIn ? messages.forms.system : messages.forms.custom}
                      </span>
                    </div>
                    <p className="text-sm text-white/55">
                      {template.shortLabel ?? template.title} ·{" "}
                      {template.durationMinutes ?? 3} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setMessage(null);
                        setEditingTemplateId(template.id);
                        setDraft({
                          title: template.title,
                          shortLabel: template.shortLabel ?? template.title,
                          icon: boardTaskIconOptions.includes(
                            (template.icon ?? "sparkles") as TaskIconName,
                          )
                            ? ((template.icon ?? "sparkles") as TaskIconName)
                            : "sparkles",
                          durationMinutes: template.durationMinutes ?? 3,
                        });
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white transition hover:border-[#69d6ff] hover:text-[#c8f4ff] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Pencil className="h-4 w-4" />
                      {messages.common.edit}
                    </button>
                    <button
                      type="button"
                      disabled={isPending || template.isBuiltIn}
                      onClick={() => setTemplatePendingDelete(template)}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {messages.common.delete}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              {editingTemplate ? messages.forms.editMode : messages.forms.createMode}
            </p>
            <h4 className="mt-2 font-display text-2xl text-white">
              {editingTemplate ? editingTemplate.title : messages.forms.newTemplate}
            </h4>

            <div className="mt-4 space-y-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-white/80">{messages.forms.title}</span>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder={messages.forms.templateTitlePlaceholder}
                  className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#ff6fb5]"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-white/80">
                    {messages.forms.shortLabel}
                  </span>
                  <input
                    value={draft.shortLabel}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        shortLabel: event.target.value,
                      }))
                    }
                    placeholder={messages.forms.templateShortLabelPlaceholder}
                    className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#69d6ff]"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-white/80">
                    {messages.forms.duration}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={draft.durationMinutes}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        durationMinutes: Number(event.target.value || 0),
                      }))
                    }
                    className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#8cf26b]"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-white/80">{messages.forms.icon}</span>
                <select
                  value={draft.icon}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      icon: event.target.value as TaskIconName,
                    }))
                  }
                  className="h-12 rounded-2xl border border-white/10 bg-white/6 px-4 text-white outline-none transition focus:border-[#ff9c4a]"
                >
                  {boardTaskIconOptions.map((icon) => (
                    <option key={icon} value={icon} className="bg-[#101223]">
                      {icon}
                    </option>
                  ))}
                </select>
              </label>
            </div>

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

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={submit}
                className="h-11 rounded-2xl bg-[linear-gradient(90deg,#69d6ff,#8cf26b)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending
                  ? messages.common.saving
                  : editingTemplate
                    ? messages.common.save
                    : messages.forms.newTemplate}
              </button>
              {editingTemplate ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={resetDraft}
                  className="h-11 rounded-2xl border border-white/10 bg-white/6 px-4 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Annuler
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <ConfirmModal
        open={templatePendingDelete !== null}
        title={messages.common.warning}
        message={
          templatePendingDelete
            ? messages.forms.deleteTemplateConfirm(templatePendingDelete.title)
            : ""
        }
        confirmLabel={messages.common.yes}
        onCancel={() => setTemplatePendingDelete(null)}
        onConfirm={async () => {
          if (!templatePendingDelete) {
            return;
          }

          const target = templatePendingDelete;
          setTemplatePendingDelete(null);
          removeTemplate(target);
        }}
      />
    </>
  );
}
