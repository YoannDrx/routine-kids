type SetupNeededCardProps = {
  missingEnv: string[];
};

export function SetupNeededCard({ missingEnv }: SetupNeededCardProps) {
  return (
    <section className="rounded-[28px] border border-amber-300/20 bg-amber-500/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/80">
        Setup required
      </p>
      <h3 className="mt-2 font-display text-2xl text-amber-50">
        Neon et auth ne sont pas encore branches
      </h3>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-amber-50/80">
        Le shell admin est pret, mais les lectures et ecritures reelles ne
        demarreront qu&apos;une fois les variables d&apos;environnement renseignees dans
        `.env.local`.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {missingEnv.map((item) => (
          <span
            key={item}
            className="rounded-full border border-amber-100/20 bg-black/20 px-3 py-2 text-xs font-semibold text-amber-50"
          >
            Missing {item}
          </span>
        ))}
      </div>
    </section>
  );
}
