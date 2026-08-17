import Link from "next/link";
import type { ReactNode } from "react";

type PublicDocumentProps = {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
};

export function PublicDocument({
  eyebrow,
  title,
  summary,
  children,
}: PublicDocumentProps) {
  return (
    <main className="starfield min-h-screen px-4 py-6 md:px-6">
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-5">
        <header className="surface-panel rounded-[32px] px-6 py-7 md:px-9">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8fd8ff]">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-4xl text-white md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/68">
            {summary}
          </p>
          <nav aria-label="Navigation publique" className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950" href="/">
              RoutineKids
            </Link>
            <Link className="rounded-full border border-white/15 bg-white/6 px-4 py-2 text-sm font-semibold text-white" href="/privacy">
              Confidentialité
            </Link>
            <Link className="rounded-full border border-white/15 bg-white/6 px-4 py-2 text-sm font-semibold text-white" href="/terms">
              Conditions
            </Link>
            <Link className="rounded-full border border-white/15 bg-white/6 px-4 py-2 text-sm font-semibold text-white" href="/support">
              Support
            </Link>
          </nav>
        </header>

        <article className="surface-panel space-y-8 rounded-[32px] px-6 py-8 text-white/72 md:px-9 [&_a]:font-semibold [&_a]:text-[#8fd8ff] [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-white [&_li]:leading-7 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </article>
      </div>
    </main>
  );
}
