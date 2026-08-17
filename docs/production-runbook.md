# RoutineKids — runbook de mise en production

## 1. Protection Git

Le dépôt autorisé est exclusivement :

```text
git@github.com:YoannDrx/routine-kids.git
```

Contrôle :

```bash
pnpm check:git-target
git remote -v
```

Le hook `.githooks/pre-push` relance ce contrôle. Ne pas ajouter de remote `upstream`.

## 2. Variables requises

Configurer les environnements Preview puis Production en suivant `.env.example` :

- URL publique et secret Better Auth aléatoire ;
- URL poolée et directe Neon ;
- token Vercel Blob privé ;
- Resend et expéditeur sur un domaine vérifié ;
- secret/webhook et deux Price IDs Stripe ;
- verrou `COMMERCIAL_SALES_ENABLED=false` jusqu'au go/no-go final ;
- bundle ID, App ID, deux Product IDs et certificats racine Apple ;
- adresse publique de support.

Ne jamais copier de secret dans Git, une capture, un ticket ou les notes App Review.

## 3. Base de données

1. Sauvegarder ou créer un point de restauration Neon.
2. Tester `prisma migrate deploy` sur une branche Neon dérivée de production.
3. Rejouer signup, lecture du foyer, validation d'une mission, import et facturation.
4. Promouvoir la migration validée pendant une fenêtre calme.
5. Enregistrer correctement la baseline et les migrations dans `_prisma_migrations`.
6. Exécuter une lecture de contrôle sans données sensibles.

La migration préparée le 10 août 2026 est additive et a été validée sur une branche
temporaire. Sa promotion vers `main` exige une validation explicite du propriétaire.

## 4. Stripe

1. Créer un seul produit `RoutineKids Family Plus`.
2. Créer les prix récurrents 4,99 EUR/mois et 39,99 EUR/an.
3. Configurer le webhook `/api/billing/stripe-webhook` pour Checkout et événements de
   subscription.
4. Rejouer en mode test : achat, doublon webhook, portail, annulation, expiration.
5. Passer les secrets live uniquement après validation.
6. Ne jamais réutiliser un ancien Price ID à 9/90 €.

## 5. Apple

Suivre `docs/app-store-submission.md`. La validation minimale comprend achat Sandbox,
restauration sur un autre appareil, notification V2, expiration, révocation et
remboursement. Les produits Apple doivent donner exactement les mêmes droits que Stripe.

## 6. Vérification avant déploiement

```bash
pnpm install --frozen-lockfile
pnpm check:git-target
pnpm prisma:validate
pnpm prisma:generate
pnpm typecheck
pnpm lint
pnpm test:ci
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Le build de production exige les variables d'e-mail, même dans CI. Utiliser des valeurs
de build non fonctionnelles en CI ; utiliser de vrais secrets seulement dans Vercel.

## 7. Déploiement web

1. Déployer d'abord une Preview reliée à une branche Neon isolée.
2. Vérifier `/api/health`, `/privacy`, `/terms`, `/support`, auth et médias privés.
3. Rejouer un compte jetable complet, y compris export et suppression.
4. Promouvoir le même commit en Production.
5. Vérifier les logs d'erreur dans l'heure qui suit et les webhooks fournisseurs.

Le workflow GitHub Actions `Production health` contrôle déjà `/api/health` toutes les
cinq minutes, avec deux nouvelles tentatives avant échec. Conserver les notifications
GitHub Actions actives et ajouter, avant l'ouverture commerciale, une alerte indépendante
sur tout taux de webhook 5xx non nul.

## 8. Rollback

- Web : promouvoir le dernier déploiement Vercel sain.
- Paiement : ne pas supprimer les produits ni désactiver brutalement les droits déjà
  payés ; retirer temporairement la vente si nécessaire.
- Base : préférer une migration corrective additive. Restaurer un snapshot uniquement
  en incident majeur, avec analyse des écritures intervenues depuis le point choisi.
- iOS : interrompre le phased release ou publier un correctif ; une version déjà
  installée doit continuer à lire l'API v1.

## 9. Exploitation

- Examiner chaque semaine : erreurs 5xx, échecs webhook, e-mails rejetés, latence DB,
  mutations offline non synchronisées et suppressions média en échec.
- Examiner chaque mois : activation Free, conversion Family Plus, churn volontaire,
  restauration d'achat et tickets support.
- Ne jamais journaliser nom d'enfant, photo, contenu de routine, token, e-mail complet,
  cookie ou payload d'achat signé.
