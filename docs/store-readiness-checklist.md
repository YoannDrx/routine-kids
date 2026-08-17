# RoutineKids — checklist de préparation aux stores

Date de référence : 17 août 2026

Branche : `codex/routinekids-production-readiness`
Périmètre V1 : web de production + App Store iPhone/iPad. Android n'existe pas dans
ce dépôt et constitue un chantier produit distinct.

## Légende

- **FAIT** : implémenté et vérifié localement ou configuré chez le fournisseur.
- **PRÊT** : code terminé, opération externe encore nécessaire.
- **BLOQUÉ** : accès, secret, consentement explicite ou décision du propriétaire requis.
- **APRÈS LANCEMENT** : utile mais non bloquant pour la V1.

## Ordre critique de livraison

1. Finaliser le second facteur Stripe, ajouter la clé live et créer le webhook.
2. Déployer le web de production et vérifier les parcours réels.
3. Configurer l'URL Apple App Store Server Notifications V2.
4. Créer le compte de review, les données fictives et les captures. **Terminé.**
5. Archiver/téléverser le build 4, l'installer via TestFlight, tester les achats
   Sandbox et corriger les écarts.
6. Faire compléter par le titulaire les contrats Paid Apps, la fiscalité et la banque.
7. Associer la version, les deux abonnements et leur groupe au même brouillon App
   Review. **Terminé : quatre éléments prêts et action d'envoi activée.**
8. Soumettre à App Review uniquement après confirmation finale explicite.

Chaque étape dépend de la précédente. En particulier, aucun achat live ne doit être
ouvert avant le déploiement du webhook et aucun build ne doit être soumis avant un test
de suppression de compte, restauration d'achat et expiration d'abonnement en TestFlight.

## 1. Code, qualité et sécurité

| État | Tâche | Preuve / critère de sortie |
| --- | --- | --- |
| FAIT | Cible Git personnelle uniquement | `origin` pointe vers `YoannDrx/routine-kids`; garde locale et CI |
| FAIT | Auth, board, profils, routines, historique, médias privés | Parcours reliés à Prisma/Neon, pas au prototype local |
| FAIT | Gate parent et step-up pour opérations sensibles | Réglages, achats, export et suppression protégés |
| FAIT | Suppression de compte depuis iOS | Annule Stripe, supprime les données et purge les médias avec retry |
| FAIT | Inscription et reset de mot de passe natifs | Aucun renvoi obligatoire vers un navigateur |
| FAIT | Sécurité HTTP/PWA | CSP, HSTS production, no-store authentifié, service worker limité |
| FAIT | Prix Stripe strictement validés côté serveur | EUR 4,99/mois et 39,99/an, périodicité et statut contrôlés |
| FAIT | Vérifications web | Prisma, TypeScript, ESLint, 45 tests Vitest, build et audit dépendances passent localement |
| FAIT | Vérifications iOS | 3 XCTest + 2 Swift Testing et build 4 simulateur passent |
| FAIT | Cycle de session iOS | Origine Better Auth envoyée, cookies du domaine purgés même si le sign-out serveur échoue, reconnexion validée sans réinstallation |
| FAIT | Playwright local final | 16 scénarios réussis, dont parcours authentifiés et webhook Stripe ; à rejouer après déploiement public |
| PRÊT | Test manuel accessibilité | VoiceOver, Dynamic Type XXL, contraste et rotation sur iPhone/iPad physiques |

## 2. Base de données Neon

| État | Tâche | Détail |
| --- | --- | --- |
| FAIT | Migration additive préparée et appliquée | ID Neon `7294d6f7-821b-4eab-b41b-a5ee8ebe7ee3` sur `main` |
| FAIT | Validation isolée | Branche temporaire `br-wandering-block-ag8ugpfx`, données et contraintes vérifiées |
| FAIT | Historique Prisma | Quatre migrations enregistrées comme appliquées, statut à jour |
| FAIT | Backfill post-migration | 5 utilisateurs, 5 foyers, 5 propriétaires, aucun token ou abonnement orphelin |
| PRÊT | Smoke test applicatif post-déploiement | Création de compte, foyer, routine, mutation idempotente et suppression |

Plan de retour : la migration est additive. En cas d'incident applicatif, revenir au
déploiement web précédent ; ne supprimer aucune colonne/table dans l'urgence.

## 3. Vercel et services web

| État | Tâche | Détail |
| --- | --- | --- |
| FAIT | Projet relié au GitHub personnel | Aucun upstream autorisé |
| FAIT | Alias stable choisi | `https://routine-kids.vercel.app` |
| FAIT | Secrets cœur configurés | Neon, Better Auth, Blob et certificats racine Apple |
| FAIT | IDs de prix Stripe live configurés | Mensuel `price_1U2y48H4VwBfiTEIheyAI0FY`, annuel `price_1U2y6DH4VwBfiTEIHBYtVejc` |
| PARTIEL | Resend production | Clé dédiée et expéditeur configurés ; acceptation API constatée, réception réelle vérification/reset encore à confirmer |
| BLOQUÉ | Runtime Stripe live | Ajouter une clé restreinte avec Customers, Checkout, Billing Portal et Subscriptions |
| BLOQUÉ | Portail Stripe dédié | Créer une configuration RoutineKids et ajouter `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` |
| PRÊT | Déploiement production | Déployer seulement après Neon + e-mail + Stripe runtime |
| PRÊT | Webhook Stripe | URL `/api/billing/stripe-webhook`, événements checkout/subscription, secret dans Vercel |
| PRÊT | Smoke tests publics | `/`, auth, e-mail, reset, `/privacy`, `/terms`, `/support`, `/api/health` |
| PRÊT | Observabilité | Moniteur externe sur `/api/health` et alertes sur erreurs de webhooks |
| APRÈS LANCEMENT | Domaine personnalisé | Corriger le DNS de `routinekids.app`, puis rediriger l'alias stable |

## 4. Stripe web

| État | Tâche | Détail |
| --- | --- | --- |
| FAIT | Produit live | `prod_V34CEIffnjMeYy` — RoutineKids Family Plus |
| FAIT | Tarif mensuel live | 4,99 EUR TTC/mois |
| FAIT | Tarif annuel live | 39,99 EUR TTC/an, environ 33 % de remise |
| BLOQUÉ | Identité du compte | Le compte Stripe partagé expose publiquement Pressay ; choisir un compte RoutineKids dédié ou valider explicitement cette cohabitation |
| BLOQUÉ | Clé live applicative | La clé CLI actuelle est volontairement en lecture seule |
| PRÊT | Endpoint webhook live | À créer après que la route soit réellement déployée |
| PRÊT | Portail client | Configuration dédiée exigée par le code ; vérifier produits RoutineKids, annulation, retour et moyens de paiement |
| PRÊT | Achat live contrôlé | Utiliser un vrai compte interne, rembourser si nécessaire, vérifier l'idempotence |

Le lancement conserve 4,99/39,99 comme prix fondateur. Réévaluer après trois mois ou
500 foyers actifs. Ne pas lancer de remise d'essai tant que le plan Free suffit à
démontrer la valeur premium.

## 5. App Store Connect et StoreKit

| État | Tâche | Critère de sortie |
| --- | --- | --- |
| BLOQUÉ | Authentification App Store Connect | La session web n'est plus authentifiée ; reconnexion titulaire requise |
| BLOQUÉ | Contrats, fiscalité et banque | Paid Apps actif, coordonnées et accords à jour |
| FAIT | Enregistrement de l'app | App Apple `6800070456`, SKU `routinekids-ios-1`, bundle exact |
| FAIT | Groupe Family Plus | Groupe `22300397`, localisations FR/EN |
| FAIT | IAP mensuel | `com.yoannandrieux.routinekids.familyplus.monthly`, 4,99 EUR, 175 territoires |
| FAIT | IAP annuel | `com.yoannandrieux.routinekids.familyplus.yearly`, 39,99 EUR, 175 territoires |
| FAIT | Notifications serveur V2 | URL `/api/billing/apple-notifications` enregistrée pour production et Sandbox ; livraison à tester après déploiement |
| PARTIEL | Configuration Apple serveur | App ID numérique `6800070456` disponible ; validation JWS basée sur les racines Apple, le bundle et les produits |
| FAIT | Capture de review IAP | Paywall StoreKit local capturé et joint aux produits mensuel et annuel |
| FAIT | Notes de review IAP | Parcours StoreKit 2, restauration, gestion et gate parent documentés sur chaque produit et dans les notes de version |
| PRÊT | Sandbox | Achat, restauration, renouvellement, expiration, révocation, remboursement |

## 6. Signature, archive et TestFlight

| État | Tâche | Critère de sortie |
| --- | --- | --- |
| FAIT | Projet XcodeGen reproductible | `ios/project.yml` est la source de vérité |
| FAIT | URL API et IDs StoreKit dans le bundle | Clés présentes dans l'Info.plist compilé |
| FAIT | Runtime et builds locaux | iOS 26.3.1, iPhone/iPad, Release et appareil générique |
| FAIT | Équipe et distribution Apple | Team `G9WFV7HNV6`, certificat et profil de distribution automatiques |
| FAIT | Archive Release initiale | Version 1.0, build 2, archive validée et uploadée sans erreur |
| FAIT | Archive corrective historique | Build 3 archivé et validé, désormais obsolète fonctionnellement |
| PRÊT | Archive et upload final | Build 4 à archiver, téléverser, traiter et sélectionner sur la version 1.0 |
| PARTIEL | TestFlight interne | Compte titulaire ajouté au groupe ; build 4 à installer sur appareil |
| PRÊT | Recette TestFlight | Auth, offline, rotation, photos, rappels, achat, restore, delete account |
| FAIT | Export conformité | `ITSAppUsesNonExemptEncryption=false`, accepté lors de l'upload |

## 7. Fiche, confidentialité et conformité

| État | Tâche | Critère de sortie |
| --- | --- | --- |
| FAIT | Métadonnées FR préparées | Nom, sous-titre, description, promotional text et keywords |
| FAIT | Catégories et droits de contenu | Éducation, Style de vie et absence de contenu tiers enregistrés |
| FAIT | Pages publiques préparées | Support, confidentialité et conditions sans authentification |
| BLOQUÉ | Identité légale de l'éditeur | Nom/statut, adresse de contact et e-mail juridique à confirmer, sans invention |
| FAIT | Statut trader DSA | Statut trader déclaré actif dans App Store Connect |
| FAIT | Décision Kids | Classification 4+, sans sélectionner la catégorie Kids irréversible |
| FAIT | App Privacy | 8 types publiés, fonctionnalité de l'app uniquement, liés au compte, aucun tracking |
| FAIT | Questionnaire d'âge | Classification calculée 4+, aucun contenu sensible déclaré |
| FAIT | Prix et disponibilité de l'app | Téléchargement gratuit, diffusion publique, France comme base, 175 territoires |
| FAIT | Compte de démo | Compte fictif vérifié, foyer et routines stables, identifiants enregistrés uniquement dans App Store Connect |
| PARTIEL | Captures | Anciennes captures chargées ; à régénérer après validation de la DA du build 4 |
| FAIT | Coordonnées et notes App Review | Contact, compte de connexion et instructions de vérification enregistrés |
| PARTIEL | Déclarations d'accessibilité | Brouillons iPhone/iPad renseignés pour VoiceOver, contrôle vocal, interface sombre, différenciation sans couleur et animations réduites ; publication possible après mise en ligne d'une version |
| PRÊT | Vérification des URLs | Support, privacy et terms répondent en HTTPS sans login |
| PRÊT | Relecture juridique | Confidentialité, CGU, abonnements, suppression et prestataires |

Recommandation catégorie : **Éducation** et note 4+ pour la V1, sans cocher
automatiquement « Made for Kids ». Le produit couvre aujourd'hui 2–12 ans, plus large
qu'une tranche Kids unique ; cocher Kids impose une décision durable et doit être fait
seulement après choix explicite du titulaire et alignement du marketing.

## 8. Soumission et exploitation

| État | Tâche | Critère de sortie |
| --- | --- | --- |
| PARTIEL | Brouillon App Review | Version iOS 1.0 et abonnements préparés ; remplacer le build 3 par le build 4 et les captures |
| PRÊT | Checklist pré-soumission | Aucun placeholder, aucune donnée réelle dans les captures, compte review testé |
| PRÊT | Soumission App Review | Bouton activé ; action finale uniquement après tests Sandbox, accords payants et confirmation explicite du propriétaire |
| PRÊT | Support lancement | Procédures remboursement, suppression, restauration et incident documentées |
| PRÊT | Surveillance 72 h | Santé, erreurs auth, e-mails, webhooks Apple/Stripe et crashs TestFlight |
| PRÊT | Plan de rollback | Retrait vente si nécessaire, rollback Vercel, aucune migration destructive |

## Hors périmètre bloquant de la V1

Les invitations co-parent, récompenses, push APNs distant, widgets, Live Activities,
offline web complet et Android sont des évolutions. Elles ne doivent ni retarder la V1
ni être promises dans la fiche tant que leurs parcours ne sont pas complets.
