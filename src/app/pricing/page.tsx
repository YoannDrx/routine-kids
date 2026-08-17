import Link from "next/link";

import { isCommercialSalesEnabled } from "@/lib/config";
import { billingPlans } from "@/lib/data/billing-plans";
import { getCurrentAppMessages } from "@/lib/i18n.server";

export default async function PricingPage() {
  const messages = await getCurrentAppMessages();
  const commercialSalesEnabled = isCommercialSalesEnabled();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-6">
      <header className="surface-panel rounded-[32px] px-6 py-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
          {messages.pricing.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-5xl text-white">
          {messages.pricing.title}
        </h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-white/65">
          {messages.pricing.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
          >
            {messages.pricing.backToBoard}
          </Link>
          <Link
            href="/sign-up?callbackUrl=/settings"
            className="rounded-full border border-white/15 bg-white/6 px-4 py-2 text-sm font-semibold text-white"
          >
            {messages.pricing.createParentAccount}
          </Link>
        </div>
      </header>

      {!commercialSalesEnabled ? (
        <section
          aria-live="polite"
          className="mx-auto w-full max-w-4xl rounded-[28px] border border-amber-300/30 bg-amber-300/10 px-5 py-4 text-amber-50"
        >
          <h2 className="font-display text-2xl">
            {messages.pricing.salesPausedTitle}
          </h2>
          <p className="mt-1 text-sm leading-6 text-amber-50/75">
            {messages.pricing.salesPausedDescription}
          </p>
        </section>
      ) : null}

      <section className="mx-auto grid w-full max-w-4xl gap-4 md:grid-cols-2">
        {billingPlans.map((plan) => {
          const copy =
            plan.id === "free"
              ? messages.pricing.plans.free
              : messages.pricing.plans.familyPlus;

          return (
            <article
              key={plan.id}
              className="surface-panel rounded-[32px] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-3xl text-white">{copy.name}</h2>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                {plan.monthlyPrice}€/mois · {plan.yearlyPrice}€/an
              </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/65">
                {copy.description}
              </p>
              {plan.id === "free" ? (
                <div className="mt-5 rounded-[24px] border border-white/10 bg-black/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    {messages.pricing.limits}
                  </p>
                  <ul className="mt-3 flex flex-col gap-2 text-sm text-white/72">
                    <li>{messages.pricing.childProfiles(plan.limits.childProfiles)}</li>
                    <li>{messages.pricing.tasksPerRoutine(plan.limits.tasksPerRoutine)}</li>
                  </ul>
                </div>
              ) : null}
              <ul className="mt-5 flex flex-col gap-2 text-sm text-white/72">
                {copy.features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={
                  plan.id === "free"
                    ? "/sign-up?callbackUrl=/settings"
                    : "/settings"
                }
                className="mt-5 block rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
              >
                {plan.id === "free"
                  ? messages.pricing.createParentAccount
                  : messages.pricing.openPlans}
              </Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}
