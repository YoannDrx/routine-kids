import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="starfield flex min-h-screen items-center justify-center px-5 py-10">
      <section className="surface-panel relative z-10 max-w-lg rounded-[32px] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8fd8ff]">
          RoutineKids
        </p>
        <h1 className="mt-3 font-display text-4xl">Connexion indisponible</h1>
        <p className="mt-4 leading-7 text-white/70">
          La board familiale n&apos;est pas mise en cache afin de protéger les
          données des enfants sur un appareil partagé. Reconnectez cet appareil
          pour synchroniser les routines.
        </p>
        <p className="mt-3 text-sm text-white/50">
          The family board is not cached on shared devices. Reconnect to safely
          sync routines.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#ff6fb5] px-6 font-semibold"
        >
          Réessayer · Try again
        </Link>
      </section>
    </main>
  );
}
