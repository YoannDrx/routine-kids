"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("routinekids_render_error", {
      digest: error.digest ?? null,
      message: error.message,
    });
  }, [error]);

  return (
    <main className="starfield flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <section className="surface-panel relative z-10 w-full max-w-lg rounded-[32px] p-8 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8fd8ff]">
          RoutineKids
        </p>
        <h1 className="mt-3 font-display text-4xl">Un petit imprévu</h1>
        <p className="mt-4 leading-7 text-white/68">
          La page n’a pas pu s’afficher. Vos données enregistrées ne sont pas
          supprimées et vous pouvez réessayer immédiatement.
        </p>
        <button
          className="mt-7 min-h-12 rounded-full bg-white px-6 py-3 font-semibold text-slate-950"
          onClick={reset}
          type="button"
        >
          Réessayer
        </button>
      </section>
    </main>
  );
}
