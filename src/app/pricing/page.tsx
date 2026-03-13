import Link from "next/link";

import { billingPlans } from "@/lib/data/billing-plans";
import { getCurrentAppMessages } from "@/lib/i18n.server";

export default async function PricingPage() {
  const messages = await getCurrentAppMessages();

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

      <section className="grid gap-4 lg:grid-cols-3">
        {billingPlans.map((plan) => {
          const copy =
            plan.id === "free"
              ? messages.pricing.plans.free
              : plan.id === "family"
                ? messages.pricing.plans.family
                : messages.pricing.plans.familyPlus;

          return (
            <article
              key={plan.id}
              className="surface-panel rounded-[32px] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-3xl text-white">{copy.name}</h2>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                {plan.monthlyPrice}€/mois
              </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/65">
                {copy.description}
              </p>
              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/15 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  {messages.pricing.limits}
                </p>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-white/72">
                  <li>{messages.pricing.childProfiles(plan.limits.childProfiles)}</li>
                  <li>{messages.pricing.smartPresets(plan.limits.smartPresets)}</li>
                  <li>{messages.pricing.auditDays(plan.limits.auditHistoryDays)}</li>
                </ul>
              </div>
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
            </article>
          );
        })}
      </section>
    </main>
  );
}
