import type { Metadata } from "next";

import { PublicDocument } from "@/components/public/public-document";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité de RoutineKids.",
};

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support.routinekids@gmail.com";

export default function PrivacyPage() {
  return (
    <PublicDocument
      eyebrow="Confidentialité · Privacy"
      title="Vos données familiales restent privées"
      summary="Cette politique décrit les données utilisées par RoutineKids, leur finalité et les choix proposés aux parents. Dernière mise à jour : 10 août 2026."
    >
      <section>
        <h2>Responsable et périmètre</h2>
        <p className="mt-3">
          RoutineKids est une application gérée par le titulaire du compte parent.
          Elle ne crée pas de compte autonome pour l&apos;enfant et ne diffuse aucune
          publicité. Pour toute question, contactez{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        </p>
      </section>

      <section>
        <h2>Données traitées</h2>
        <ul className="mt-3">
          <li>Compte parent : adresse e-mail, identifiants techniques et préférences de langue.</li>
          <li>Foyer : nom, fuseau horaire, horaires de routine et code parent chiffré.</li>
          <li>Profils enfant : prénom ou pseudonyme choisi par le parent, tranche d&apos;âge, avatar et thème.</li>
          <li>Routines : missions, planification, validations quotidiennes et progression.</li>
          <li>Photos ajoutées volontairement par le parent, si cette fonction est utilisée.</li>
          <li>Abonnement : statut et identifiants techniques fournis par Stripe ou Apple. RoutineKids ne reçoit pas le numéro complet de carte.</li>
          <li>Données techniques minimales : appareil enregistré, langue, erreurs serveur et événements de sécurité nécessaires au fonctionnement.</li>
        </ul>
      </section>

      <section>
        <h2>Finalités et base d&apos;utilisation</h2>
        <p className="mt-3">
          Ces données servent à fournir les routines, synchroniser les appareils,
          sécuriser l&apos;espace parent, gérer l&apos;abonnement, répondre au support et
          prévenir les abus. Elles ne sont ni vendues ni utilisées pour du ciblage
          publicitaire. Les données familiales ne servent pas à entraîner un modèle
          d&apos;intelligence artificielle.
        </p>
      </section>

      <section>
        <h2>Prestataires et transferts</h2>
        <p className="mt-3">
          RoutineKids utilise des prestataires strictement nécessaires à
          l&apos;hébergement, la base de données, l&apos;envoi d&apos;e-mails et le paiement.
          Selon la configuration de production, cela peut inclure Vercel, Neon,
          Resend, Stripe et Apple. Chaque prestataire ne reçoit que les données
          nécessaires à son rôle et applique ses propres garanties contractuelles.
        </p>
      </section>

      <section>
        <h2>Conservation et sécurité</h2>
        <p className="mt-3">
          Les données actives sont conservées tant que le compte existe. Les journaux
          techniques et sauvegardes peuvent subsister temporairement pour la sécurité
          et la reprise après incident. Les communications sont chiffrées en transit,
          les mots de passe ne sont pas stockés en clair et les actions sensibles sont
          protégées par une vérification parentale.
        </p>
      </section>

      <section>
        <h2>Vos droits</h2>
        <p className="mt-3">
          Depuis les réglages, le parent peut exporter les données du foyer puis
          supprimer définitivement le compte et ses profils. Il peut aussi demander
          l&apos;accès, la rectification, l&apos;effacement, la limitation ou la portabilité en
          écrivant à <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. Une preuve
          raisonnable de contrôle du compte pourra être demandée.
        </p>
      </section>

      <section>
        <h2>Enfants</h2>
        <p className="mt-3">
          L&apos;application doit être configurée et administrée par un adulte. Le parent
          choisit les informations affichées à l&apos;enfant et doit utiliser un pseudonyme
          si le contexte familial l&apos;exige. Aucun achat ni réglage sensible n&apos;est destiné
          à être effectué par un enfant.
        </p>
      </section>

      <section lang="en">
        <h2>English summary</h2>
        <p className="mt-3">
          RoutineKids is parent-managed, contains no advertising, does not sell family
          data, and does not create independent child accounts. Parents can export or
          delete household data from Settings. Contact{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a> for privacy requests.
        </p>
      </section>
    </PublicDocument>
  );
}
