import type { Metadata } from "next";

import { PublicDocument } from "@/components/public/public-document";

export const metadata: Metadata = {
  title: "Conditions d’utilisation",
  description: "Conditions d’utilisation et d’abonnement de RoutineKids.",
};

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support.routinekids@gmail.com";

export default function TermsPage() {
  return (
    <PublicDocument
      eyebrow="Conditions · Terms"
      title="Conditions d’utilisation"
      summary="Règles d’utilisation de RoutineKids et informations sur l’abonnement Family Plus. Dernière mise à jour : 10 août 2026."
    >
      <section>
        <h2>Compte parent</h2>
        <p className="mt-3">
          L&apos;adulte titulaire du compte est responsable de la configuration du foyer,
          de la confidentialité de ses identifiants et de l&apos;usage effectué sur les
          appareils partagés. RoutineKids est un outil d&apos;organisation familiale et ne
          remplace aucun conseil médical, éducatif ou professionnel.
        </p>
      </section>

      <section>
        <h2>Utilisation acceptable</h2>
        <p className="mt-3">
          Vous vous engagez à fournir des informations licites, à ne pas contourner les
          protections de sécurité et à ne pas utiliser le service pour nuire à un tiers.
          Les contenus, avatars ou photos importés doivent pouvoir être utilisés par le
          titulaire du compte.
        </p>
      </section>

      <section>
        <h2>Offre gratuite et Family Plus</h2>
        <p className="mt-3">
          L&apos;offre gratuite comprend un profil enfant et jusqu&apos;à quatre missions par
          routine. Family Plus porte ces limites à six profils et vingt missions par
          routine, avec synchronisation familiale et fonctions additionnelles affichées
          avant l&apos;achat. Les prix et taxes applicables sont confirmés par la boutique au
          moment du paiement.
        </p>
      </section>

      <section>
        <h2>Renouvellement et résiliation</h2>
        <p className="mt-3">
          Un abonnement est renouvelé automatiquement jusqu&apos;à sa résiliation. Un achat
          effectué dans l&apos;application iOS est géré depuis les réglages d&apos;abonnement de
          l&apos;identifiant Apple. Un achat web est géré via le portail Stripe accessible
          depuis les réglages RoutineKids. La résiliation prend effet à la fin de la
          période déjà payée. Les remboursements suivent les règles de la boutique ayant
          encaissé le paiement.
        </p>
      </section>

      <section>
        <h2>Disponibilité et évolution</h2>
        <p className="mt-3">
          Le service peut évoluer pour améliorer sa sécurité ou ses fonctionnalités.
          Une maintenance, une panne réseau ou un prestataire externe peut interrompre
          temporairement la synchronisation. Les modifications importantes de ces
          conditions seront signalées dans l&apos;application ou par e-mail lorsqu&apos;une telle
          notification est requise.
        </p>
      </section>

      <section>
        <h2>Fin du service et contact</h2>
        <p className="mt-3">
          Le parent peut exporter puis supprimer son foyer depuis les réglages. RoutineKids
          peut suspendre un accès en cas de fraude, d&apos;abus ou de risque de sécurité. Pour
          toute question contractuelle, contactez{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        </p>
      </section>

      <section lang="en">
        <h2>English summary</h2>
        <p className="mt-3">
          RoutineKids is a parent-managed family organization service. Family Plus is an
          auto-renewing subscription until cancelled through the store used for purchase.
          Free and paid limits are disclosed before checkout. Contact{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a> for assistance.
        </p>
      </section>
    </PublicDocument>
  );
}
