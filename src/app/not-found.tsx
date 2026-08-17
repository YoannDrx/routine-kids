import Link from "next/link";

export default function NotFound() {
  return (
    <main className="starfield flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <section className="surface-panel relative z-10 w-full max-w-lg rounded-[32px] p-8 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8fd8ff]">
          Erreur 404
        </p>
        <h1 className="mt-3 font-display text-4xl">Mission introuvable</h1>
        <p className="mt-4 leading-7 text-white/68">
          Cette page n’existe plus ou son adresse est incorrecte.
        </p>
        <Link
          className="mt-7 inline-flex min-h-12 items-center rounded-full bg-white px-6 py-3 font-semibold text-slate-950"
          href="/"
        >
          Retour à RoutineKids
        </Link>
      </section>
    </main>
  );
}
