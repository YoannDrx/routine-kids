# routine-kids

Projet statique minimal pour faire tourner la maquette HTML de RoutineKids sans réécriture en framework.

## Lancer le projet

```bash
cd /Users/yoannandrieux/Projets/routine-kids
pnpm dev
```

Le serveur local écoute par défaut sur `http://localhost:3000`.

## Structure

- `index.html` : intégration de la maquette fournie
- `server.js` : serveur statique Node sans dépendances

## Vidéo d'intro

La page attend une vidéo optionnelle dans `assets/intro.mp4`.
Si le fichier n'est pas présent, l'overlay d'intro se ferme automatiquement.

