import type { Metadata } from "next";

import { PublicDocument } from "@/components/public/public-document";

export const metadata: Metadata = {
  title: "Support",
  description: "Aide, contact et dépannage pour RoutineKids.",
};

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support.routinekids@gmail.com";

export default function SupportPage() {
  return (
    <PublicDocument
      eyebrow="Aide · Support"
      title="Comment pouvons-nous vous aider ?"
      summary="Consultez les solutions rapides ci-dessous ou contactez le support RoutineKids."
    >
      <section>
        <h2>Contacter le support</h2>
        <p className="mt-3">
          Écrivez à <a href={`mailto:${supportEmail}`}>{supportEmail}</a> en indiquant
          l&apos;adresse du compte parent, le type d&apos;appareil et une description du problème.
          Ne joignez jamais votre mot de passe ni votre code parent.
        </p>
      </section>

      <section>
        <h2>Connexion et mot de passe</h2>
        <p className="mt-3">
          Utilisez « Mot de passe oublié » depuis l&apos;écran de connexion. Pour protéger
          les comptes, RoutineKids affiche la même confirmation que l&apos;adresse soit connue
          ou non. Vérifiez aussi les courriers indésirables.
        </p>
      </section>

      <section>
        <h2>Abonnement</h2>
        <p className="mt-3">
          Sur iPhone ou iPad, utilisez « Gérer l&apos;abonnement » ou « Restaurer les achats »
          dans les réglages. Pour un achat web, ouvrez le portail de facturation depuis
          les réglages. Un abonnement peut nécessiter quelques secondes avant d&apos;être
          synchronisé sur un nouvel appareil.
        </p>
      </section>

      <section>
        <h2>Mode hors ligne</h2>
        <p className="mt-3">
          L&apos;app native conserve temporairement les validations à envoyer lorsque le
          réseau revient. La version web ne met pas en cache la board familiale sur un
          appareil partagé afin de limiter l&apos;exposition des données enfant.
        </p>
      </section>

      <section>
        <h2>Exporter ou supprimer mes données</h2>
        <p className="mt-3">
          Ouvrez Réglages, puis « Mes données ». Vous pouvez télécharger une sauvegarde
          avant de confirmer la suppression définitive du foyer et du compte.
        </p>
      </section>

      <section lang="en">
        <h2>English support</h2>
        <p className="mt-3">
          Contact <a href={`mailto:${supportEmail}`}>{supportEmail}</a> with your parent
          account email, device type, and a short description. Never include your password
          or parent PIN.
        </p>
      </section>
    </PublicDocument>
  );
}
