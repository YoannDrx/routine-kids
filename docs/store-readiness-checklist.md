# RoutineKids — checklist de préparation aux stores

Date de référence : 10 août 2026

Branche : `codex/routinekids-production-readiness`
Périmètre V1 : web de production + App Store iPhone/iPad. Android n'existe pas dans
ce dépôt et constitue un chantier produit distinct.

## Légende

- **FAIT** : implémenté et vérifié localement ou configuré chez le fournisseur.
- **PRÊT** : code terminé, opération externe encore nécessaire.
- **BLOQUÉ** : accès, secret, consentement explicite ou décision du propriétaire requis.
- **APRÈS LANCEMENT** : utile mais non bloquant pour la V1.

## Ordre critique de livraison

1. Autoriser puis promouvoir la migration Neon préparée.
2. Compléter Resend et la clé Stripe live dans Vercel.
3. Déployer le web, vérifier les parcours réels, puis créer le webhook Stripe.
4. Se connecter à App Store Connect et créer l'app, le groupe d'abonnement et les IAP.
5. Configurer les secrets Apple serveur et l'URL de notifications V2.
6. Créer le compte de review, les données fictives et les captures.
7. Archiver, distribuer en TestFlight, tester les achats Sandbox et corriger les écarts.
8. Compléter App Privacy, âge, conformité commerciale et soumettre à App Review.

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
| FAIT | Vérifications web | Prisma, TypeScript, ESLint, Vitest, build et audit dépendances |
| FAIT | Vérifications iOS | Swift typecheck, 2 XCTest, builds Release iPhone/iPad/appareil générique |
| FAIT | Playwright local final | 14 scénarios sur deux résolutions paysage ; à rejouer après déploiement public |
| PRÊT | Test manuel accessibilité | VoiceOver, Dynamic Type XXL, contraste et rotation sur iPhone/iPad physiques |

## 2. Base de données Neon

| État | Tâche | Détail |
| --- | --- | --- |
| FAIT | Migration additive préparée | ID `7294d6f7-821b-4eab-b41b-a5ee8ebe7ee3` |
| FAIT | Validation isolée | Branche temporaire `br-wandering-block-ag8ugpfx`, données et contraintes vérifiées |
| BLOQUÉ | Promotion sur la branche principale | Exige l'autorisation explicite du propriétaire avant mutation |
| PRÊT | Historique Prisma | Marquer le baseline puis les migrations additives comme appliquées |
| PRÊT | Smoke test post-migration | Santé, création de compte, foyer, routine, mutation idempotente et suppression |

Plan de retour : la migration est additive. En cas d'incident applicatif, revenir au
déploiement web précédent ; ne supprimer aucune colonne/table dans l'urgence.

## 3. Vercel et services web

| État | Tâche | Détail |
| --- | --- | --- |
| FAIT | Projet relié au GitHub personnel | Aucun upstream autorisé |
| FAIT | Alias stable choisi | `https://routine-kids.vercel.app` |
| FAIT | Secrets cœur configurés | Neon, Better Auth, Blob et certificats racine Apple |
| FAIT | IDs de prix Stripe live configurés | Mensuel `price_1U2y48H4VwBfiTEIheyAI0FY`, annuel `price_1U2y6DH4VwBfiTEIHBYtVejc` |
| BLOQUÉ | Resend production | Ajouter `RESEND_API_KEY` et un `EMAIL_FROM` dont le domaine est vérifié |
| BLOQUÉ | Runtime Stripe live | Ajouter une clé restreinte avec Customers, Checkout, Billing Portal et Subscriptions |
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
| BLOQUÉ | Clé live applicative | La clé CLI actuelle est volontairement en lecture seule |
| PRÊT | Endpoint webhook live | À créer après que la route soit réellement déployée |
| PRÊT | Portail client | Vérifier annulation, retour vers l'app et moyens de paiement |
| PRÊT | Achat live contrôlé | Utiliser un vrai compte interne, rembourser si nécessaire, vérifier l'idempotence |

Le lancement conserve 4,99/39,99 comme prix fondateur. Réévaluer après trois mois ou
500 foyers actifs. Ne pas lancer de remise d'essai tant que le plan Free suffit à
démontrer la valeur premium.

## 5. App Store Connect et StoreKit

| État | Tâche | Critère de sortie |
| --- | --- | --- |
| BLOQUÉ | Authentification App Store Connect | Connexion et 2FA à effectuer par le titulaire dans l'onglet ouvert |
| BLOQUÉ | Contrats, fiscalité et banque | Paid Apps actif, coordonnées et accords à jour |
| PRÊT | Enregistrement de l'app | Nom, SKU `routinekids-ios-1`, bundle `com.yoannandrieux.routinekids` |
| PRÊT | Groupe Family Plus | Un seul niveau, localisations FR/EN |
| PRÊT | IAP mensuel | `com.yoannandrieux.routinekids.familyplus.monthly`, 4,99 EUR cible |
| PRÊT | IAP annuel | `com.yoannandrieux.routinekids.familyplus.yearly`, 39,99 EUR cible |
| PRÊT | Notifications serveur V2 | URL `/api/billing/apple-notifications`, environnement production |
| BLOQUÉ | Secrets Apple serveur | App ID numérique, Issuer ID, Key ID et clé privée App Store Connect |
| PRÊT | Capture et notes de review IAP | Décrire le paywall, restauration et gestion d'abonnement |
| PRÊT | Sandbox | Achat, restauration, renouvellement, expiration, révocation, remboursement |

## 6. Signature, archive et TestFlight

| État | Tâche | Critère de sortie |
| --- | --- | --- |
| FAIT | Projet XcodeGen reproductible | `ios/project.yml` est la source de vérité |
| FAIT | URL API et IDs StoreKit dans le bundle | Clés présentes dans l'Info.plist compilé |
| FAIT | Runtime et builds locaux | iOS 26.3.1, iPhone/iPad, Release et appareil générique |
| BLOQUÉ | Équipe et distribution Apple | Sélectionner la team et laisser Xcode provisionner la distribution |
| PRÊT | Archive Release | Version 1.0.0, build 1, aucune erreur de validation |
| PRÊT | TestFlight interne | Installer sur un iPhone et un iPad physiques |
| PRÊT | Recette TestFlight | Auth, offline, rotation, photos, rappels, achat, restore, delete account |
| PRÊT | Export conformité | Répondre au questionnaire chiffrement lors de l'upload |

## 7. Fiche, confidentialité et conformité

| État | Tâche | Critère de sortie |
| --- | --- | --- |
| FAIT | Métadonnées FR préparées | Nom, sous-titre, description, promotional text et keywords |
| FAIT | Pages publiques préparées | Support, confidentialité et conditions sans authentification |
| BLOQUÉ | Identité légale de l'éditeur | Nom/statut, adresse de contact et e-mail juridique à confirmer, sans invention |
| BLOQUÉ | Statut trader DSA | Le titulaire doit déclarer son statut et fournir les informations demandées par Apple |
| BLOQUÉ | Décision Kids | Choix irréversible après approbation ; décision explicite requise |
| PRÊT | App Privacy | E-mail, noms, photos, IDs, achats et contenu utilisateur ; aucun tracking publicitaire |
| PRÊT | Questionnaire d'âge | Aucun chat, publicité, violence, contenu adulte ou jeu d'argent |
| PRÊT | Compte de démo | Compte fictif stable, vérification parent documentée dans Review Notes |
| PRÊT | Captures | FR/EN, iPhone/iPad, profils fictifs uniquement |
| PRÊT | Vérification des URLs | Support, privacy et terms répondent en HTTPS sans login |
| PRÊT | Relecture juridique | Confidentialité, CGU, abonnements, suppression et prestataires |

Recommandation catégorie : **Éducation** et note 4+ pour la V1, sans cocher
automatiquement « Made for Kids ». Le produit couvre aujourd'hui 2–12 ans, plus large
qu'une tranche Kids unique ; cocher Kids impose une décision durable et doit être fait
seulement après choix explicite du titulaire et alignement du marketing.

## 8. Soumission et exploitation

| État | Tâche | Critère de sortie |
| --- | --- | --- |
| PRÊT | Checklist pré-soumission | Aucun placeholder, aucune donnée réelle dans les captures, compte review testé |
| PRÊT | Soumission App Review | Action finale uniquement après confirmation explicite du propriétaire |
| PRÊT | Support lancement | Procédures remboursement, suppression, restauration et incident documentées |
| PRÊT | Surveillance 72 h | Santé, erreurs auth, e-mails, webhooks Apple/Stripe et crashs TestFlight |
| PRÊT | Plan de rollback | Retrait vente si nécessaire, rollback Vercel, aucune migration destructive |

## Hors périmètre bloquant de la V1

Les invitations co-parent, récompenses, push APNs distant, widgets, Live Activities,
offline web complet et Android sont des évolutions. Elles ne doivent ni retarder la V1
ni être promises dans la fiche tant que leurs parcours ne sont pas complets.
