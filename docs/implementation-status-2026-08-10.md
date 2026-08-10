# RoutineKids — état d'implémentation complet

Date de référence : 11 août 2026
Branche de livraison : `codex/routinekids-production-readiness`

Ce document est la source de vérité de la livraison. Les pourcentages indiquent la
capacité à être utilisée en production, pas seulement la présence d'un écran.

## Synthèse exécutive

RoutineKids est désormais une application familiale réelle et non plus un simple
prototype : authentification parent, stockage Neon/Prisma, routines, profils,
validations quotidiennes, progression, espace parent, médias privés, export et
suppression de compte sont reliés au serveur.

Le socle de lancement est solide. La migration Neon est appliquée, les produits Apple
sont créés et le build 3 est prêt à soumettre. Une publication commerciale attend
encore quatre opérations externes : validation SMS et runtime Stripe, déploiement web
final, recette Sandbox/TestFlight sur appareil et activation contractuelle de Paid Apps.

## Matrice fonctionnelle

| Domaine | Niveau | État réel | Reste avant production |
| --- | ---: | --- | --- |
| Authentification parent | 98 % | Inscription, connexion, déconnexion, vérification e-mail, oubli et réinitialisation du mot de passe ; Resend production vérifié | Smoke test public post-déploiement |
| Sécurité parentale | 95 % | Code PIN chiffré, revalidation par mot de passe au premier accès, cookie de step-up court et invalidé au changement de PIN | Test manuel final sur appareil partagé |
| Profils enfant | 95 % | CRUD, âge 2–12, avatar, photo privée, crop, thème, limites serveur | Validation UX finale VoiceOver |
| Routines et missions | 95 % | Matin/soir, modèles, affectation unitaire ou multiple, planification hebdomadaire, images privées | Tests manuels exhaustifs des modales les plus denses |
| Board enfant | 95 % | Données serveur, validation atomique, sons, progression et état multi-appareil | Test tactile sur iPad physique |
| Historique et streak | 90 % | Journées accomplies figées dans `DayCompletion`, historique antérieur repris depuis `TaskCompletion`, calcul par fuseau | Backfill historique facultatif pour les très anciens comptes |
| Import du prototype | 90 % | Preview, confirmation destructive `IMPORTER`, limites de plan, planning hebdo conservé, médias orphelins nettoyés | Jeu de données réel du propriétaire à rejouer avant lancement |
| Export et suppression | 98 % | Export JSON privé `no-store`, suppression renforcée compte/foyer, arrêt Stripe, purge média et suppression initiable dans l'app iOS | Vérifier la révocation Apple dans le scénario support |
| Facturation web Stripe | 90 % | Checkout, portail, webhook signé et idempotent, propriété vérifiée, entitlements serveur ; produit et tarifs live créés | Clé live restreinte, secret webhook et smoke test live contrôlé |
| Facturation iOS StoreKit 2 | 92 % | Produits Apple FR/EN, achat, restauration, `appAccountToken`, validation JWS serveur et notifications V2 | URL de notifications, test Sandbox/TestFlight et review |
| PWA | 80 % | Manifest, icônes, service worker, shell public hors ligne | La board web n'est volontairement pas mise en cache pour protéger les données enfant |
| Application native SwiftUI | 95 % | Connexion, inscription, reset, suppression de compte, board, synchronisation, file hors ligne, rappels, réglages et StoreKit ; build 3 signé et traité par Apple | TestFlight et tests sur appareil physique |
| Notifications | 55 % | Rappels matin/soir locaux iOS et enregistrement appareil | Pas d'APNs distant, pas de centre de préférences avancé |
| Accessibilité | 85 % | Focus visible, modales dialog, piège de focus, Échap, zoom autorisé, reduced motion | Audit VoiceOver/Dynamic Type et contraste sur appareil |
| Internationalisation | 85 % | Catalogue typé FR/EN sur les parcours principaux | Quelques libellés natifs restent uniquement français |
| Co-parent | 35 % | Modèle membre/invitation, rôles et lecture API membre | Invitation, acceptation, choix du foyer et gestion UI non exposés |
| Récompenses | 25 % | Modèles de récompense et ledger prêts | Catalogue, attribution et UX enfant non exposés |
| Observabilité | 65 % | Logs JSON pseudonymes sur santé et paiements, endpoint `/api/health` | Moniteur externe, alertes et éventuellement Sentry serveur sans données enfant |
| App Store | 95 % | Fiche, confidentialité, captures, IAP, groupe, build signé et brouillon App Review complet à 4 éléments | Paid Apps, TestFlight/Sandbox et envoi final confirmé |

## Fonctionnalités livrées dans cette tranche

- Mise à niveau Next.js 16, React 19, Better Auth, Stripe et dépendances de sécurité.
- Audit des dépendances de production sans vulnérabilité connue au moment du contrôle.
- Garde-fou Git local et CI refusant tout dépôt distant autre que
  `YoannDrx/routine-kids`.
- En-têtes CSP, HSTS en production, anti-framing, permissions minimales et médias
  familiaux privés.
- Vérification e-mail et réinitialisation de mot de passe par e-mail transactionnel.
- Rate limiting Better Auth persistant en base.
- Step-up parental réel autour des réglages et mutations sensibles.
- Limites serveur cohérentes : Free = 1 enfant / 4 missions par routine ; Family
  Plus = 6 enfants / 20 missions par routine.
- Prix affichés cohérents : 4,99 €/mois ou 39,99 €/an.
- Produit Stripe live créé avec les Price IDs mensuel `price_1U2y48H4VwBfiTEIheyAI0FY`
  et annuel `price_1U2y6DH4VwBfiTEIHBYtVejc`.
- Webhooks Stripe et Apple idempotents, rejouables après échec et protégés contre
  le rattachement d'un achat à un autre compte.
- Fuseau du foyer explicite, contrôle de la date envoyée par le client et snapshot
  immuable des journées réussies.
- API native versionnée, file d'écriture hors ligne et synchronisation.
- PWA sans cache des pages authentifiées ni des données enfant.
- Pages publiques `/privacy`, `/terms` et `/support`.
- CI : cible Git, Prisma, TypeScript, ESLint, Vitest, build et Playwright iPad.
- Projet SwiftUI générable avec XcodeGen, manifeste de confidentialité et StoreKit 2.
- XCTest sur simulateur, build Release iPad et build Release appareil générique validés.
- Migration additive testée sur une branche Neon isolée puis appliquée sur `main`, avec
  historique Prisma et données post-migration vérifiés.

## Ce qui n'est volontairement pas présenté comme terminé

### Co-parent

La base supporte les membres mais le produit ne possède pas encore le cycle complet
inviter → accepter → choisir le foyer → révoquer. Le cacher est préférable à exposer
un bouton partiellement fonctionnel. C'est la priorité produit après V1.

### Récompenses matérielles

Un ledger est prévu dans le schéma, mais aucune promesse visible n'est faite. Avant de
l'activer, il faut décider si une mission récompense l'effort, une journée complète ou
un objectif fixé par le parent, afin d'éviter une mécanique manipulatrice.

### Push distant

Les rappels locaux suffisent pour une première version et réduisent les données
techniques. APNs devient pertinent pour les invitations co-parent et les changements
de routine depuis un autre appareil.

### Offline web

Le shell PWA est installable, mais une board familiale authentifiée n'est pas stockée
dans le cache HTTP du navigateur. Le natif possède une file hors ligne mieux isolée.

## Backlog proposé et ordonné

### P0 — lancement

1. Finaliser la validation SMS, la clé restreinte et le webhook Stripe live.
2. Déployer Vercel, exécuter les smoke tests publics et tester la livraison des notifications Apple V2.
3. Accepter l'invitation interne, tester StoreKit Sandbox puis valider le build 3 sur appareil.
4. Faire accepter Paid Apps et compléter fiscalité/banque par le titulaire du compte.
5. Faire relire les textes légaux et confirmer l'adresse de support.
6. Activer un moniteur de `/api/health` et une alerte sur les erreurs webhook.

### P1 — valeur et rétention

1. Co-parent complet avec invitations expirables et rôles propriétaire/parent.
2. Règles d'exception : vacances, jours fériés, routine ponctuelle et pause enfant.
3. Tableau hebdomadaire parent, export CSV et comparaison sans classement entre enfants.
4. Widgets iOS et Live Activity uniquement si la protection des données partagées est
   satisfaisante.
5. Rappels locaux par enfant et par jour, avec résumé parent.

### P2 — différenciation

1. Bibliothèque de routines partageables par lien privé.
2. Catalogue de récompenses parentales configurable et non monétaire par défaut.
3. Suggestions adaptatives locales ou explicables, jamais fondées sur un profilage
   publicitaire.
4. Accès grands-parents/baby-sitter temporaire avec expiration automatique.
5. Import/export interopérable et suppression sélective d'un profil enfant.

## Challenge pricing

Le tarif de lancement retenu est **4,99 €/mois ou 39,99 €/an**. L'annuel équivaut à
3,33 €/mois, soit environ 33 % de remise — proche de quatre mois offerts, pas deux.

Cette remise est généreuse. Elle est défendable comme prix fondateur pour accélérer
l'adoption, mais ne doit pas devenir un plafond psychologique permanent. Recommandation :

- conserver 4,99 €/39,99 € pendant la phase de lancement ;
- mesurer activation, rétention à 30/90 jours et taux de conversion après 500 foyers
  actifs ou trois mois ;
- envisager ensuite 5,99 €/49,99 € pour les nouveaux abonnés si le co-parent, les
  insights et les exceptions de planning sont livrés ;
- conserver les anciens abonnés au prix fondateur si l'économie le permet ;
- ne pas ajouter de publicité ni vendre de données : cela détruirait la promesse et
  compliquerait fortement l'éligibilité Kids.

Un essai gratuit n'est pas conseillé dès le jour 1 : le plan Free constitue déjà une
démonstration durable. Un essai 7 jours n'a de sens que si l'on peut montrer une valeur
premium immédiate (co-parent, historique avancé, modèles exclusifs).

## Décision App Store recommandée

RoutineKids a une interface enfant mais un compte et des réglages administrés par un
parent. Le nom, les captures et la proposition de valeur ciblent néanmoins clairement
les familles avec enfants. Apple réserve les mentions destinées aux enfants aux apps
de la catégorie Kids et rend ce choix irréversible après approbation.

La recommandation prudente est de préparer le produit aux règles Kids (gate parental,
aucune publicité, aucun analytics comportemental tiers, données minimales), puis de
faire confirmer par le titulaire du compte Apple le segment **6–8 ans** ou **9–11 ans**
avant la première soumission. Ne pas cocher ce choix par défaut dans App Store Connect :
il s'agit d'une décision commerciale et réglementaire durable.
