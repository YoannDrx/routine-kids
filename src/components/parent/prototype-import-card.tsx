"use client";

import { DatabaseZap, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import {
  buildPrototypeImportPreview,
  parsePrototypeRoutineKidsData,
} from "@/lib/prototype/import";

type PrototypeImportCardProps = {
  onImportAction?: (input: {
    snapshot: string;
  }) => Promise<{
    status: "success" | "error";
    message: string;
  }>;
};

export function PrototypeImportCard({ onImportAction }: PrototypeImportCardProps) {
  const messages = useAppMessages();
  const router = useRouter();
  const storageSnapshot = useSyncExternalStore(
    subscribeToPrototypeStorage,
    getPrototypeStorageSnapshot,
    getPrototypeStorageServerSnapshot,
  );
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  const { preview, status } = useMemo(() => {
    if (storageSnapshot === "__idle__") {
      return {
        preview: null,
        status: "idle" as const,
      };
    }

    if (storageSnapshot === "__empty__") {
      return {
        preview: null,
        status: "empty" as const,
      };
    }

    if (storageSnapshot === "__error__") {
      return {
        preview: null,
        status: "error" as const,
      };
    }

    try {
      return {
        preview: buildPrototypeImportPreview(
          parsePrototypeRoutineKidsData(JSON.parse(storageSnapshot)),
        ),
        status: "ready" as const,
      };
    } catch {
      return {
        preview: null,
        status: "error" as const,
      };
    }
  }, [storageSnapshot]);

  const importDisabled =
    pending || status !== "ready" || preview === null || !onImportAction;

  const handleImport = async () => {
    if (status !== "ready" || preview === null || !onImportAction) {
      setFeedback({
        status: "error",
        message: messages.settings.connectParentSpace,
      });
      return;
    }

    setPending(true);
    setFeedback(null);

    try {
      const result = await onImportAction({
        snapshot: storageSnapshot,
      });

      setFeedback(result);

      if (result.status === "success") {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="surface-panel rounded-[32px] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#69d6ff]/14 text-[#69d6ff]">
          <DatabaseZap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
            {messages.forms.prototypeImport}
          </p>
          <h2 className="font-display text-2xl text-white">
            {messages.forms.prototypeSnapshot}
          </h2>
        </div>
      </div>

      {status === "idle" ? (
        <p className="mt-4 text-sm leading-7 text-white/62">
          {messages.forms.analyzingLocalStorage}
        </p>
      ) : null}

      {status === "empty" ? (
        <p className="mt-4 text-sm leading-7 text-white/62">
          {messages.forms.noPrototypeSnapshot}
        </p>
      ) : null}

      {status === "error" ? (
        <div className="mt-4 rounded-[24px] border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex items-center gap-2 font-semibold">
            <TriangleAlert className="h-4 w-4" />
            {messages.forms.snapshotUnreadable}
          </div>
          <p className="mt-2 leading-6 text-amber-50/80">
            {messages.forms.snapshotNeedsCleanup}
          </p>
        </div>
      ) : null}

      {status === "ready" && preview ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label={messages.forms.profiles} value={String(preview.profileCount)} />
            <Metric label={messages.forms.templates} value={String(preview.templateCount)} />
            <Metric label={messages.forms.assignments} value={String(preview.assignmentCount)} />
            <Metric label={messages.forms.completions} value={String(preview.completionCount)} />
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-black/15 p-4 text-sm text-white/72">
            <p>
              {messages.forms.language}: <strong>{preview.language}</strong>
            </p>
            <p className="mt-2">
              {messages.forms.localPremium}:{" "}
              <strong>
                {preview.premiumEnabled ? messages.forms.active : messages.forms.inactive}
              </strong>
            </p>
          </div>

          <div className="mt-4 rounded-[24px] border border-amber-300/18 bg-amber-500/10 p-4 text-sm leading-6 text-amber-50/88">
            {messages.forms.importReplaceNotice}
          </div>

          {feedback ? (
            <div
              className={
                feedback.status === "success"
                  ? "mt-4 rounded-[24px] border border-emerald-300/18 bg-emerald-500/10 p-4 text-sm text-emerald-50"
                  : "mt-4 rounded-[24px] border border-rose-300/18 bg-rose-500/10 p-4 text-sm text-rose-50"
              }
            >
              {feedback.message}
            </div>
          ) : null}

          <button
            type="button"
            disabled={importDisabled}
            onClick={() => {
              void handleImport();
            }}
            className="mt-4 w-full rounded-2xl bg-[linear-gradient(90deg,#69d6ff,#7dd3fc,#8b5cf6)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {pending ? messages.forms.importing : messages.forms.importNow}
          </button>
        </>
      ) : null}

      {status !== "ready" && feedback ? (
        <div
          className={
            feedback.status === "success"
              ? "mt-4 rounded-[24px] border border-emerald-300/18 bg-emerald-500/10 p-4 text-sm text-emerald-50"
              : "mt-4 rounded-[24px] border border-rose-300/18 bg-rose-500/10 p-4 text-sm text-rose-50"
          }
        >
          {feedback.message}
        </div>
      ) : null}
    </section>
  );
}

function subscribeToPrototypeStorage(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === "routineKidsData") {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}

function getPrototypeStorageSnapshot() {
  try {
    return window.localStorage.getItem("routineKidsData") ?? "__empty__";
  } catch {
    return "__error__";
  }
}

function getPrototypeStorageServerSnapshot() {
  return "__idle__";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl text-white">{value}</div>
    </div>
  );
}
