# CLAUDE.md — PRMP-IA : Plateforme de gestion des marchés publics au Bénin

## Contexte

Application web SaaS B2G couvrant les 8 phases du cycle de vie d'un marché public au Bénin (planification → archivage). Cadre juridique : Loi N°2020-26 du 29 sept. 2020 portant Code des marchés publics, Décrets 2020-595 à 2020-605, Manuel ARMP 2023.

Le cahier des charges complet est dans `docs/cahier-des-charges-prmp-ia.md` (1400 lignes, 8 modules, 51 fonctionnalités, 58 règles métier, 22 rôles RBAC, 7 moteurs de calcul, 5 agents IA).

## Stack technique

- **Frontend** : Next.js 14+ (App Router), React 18, TypeScript strict, TailwindCSS, shadcn/ui
- **Backend** : Next.js API Routes, tRPC (type-safe)
- **BDD** : PostgreSQL 16, Prisma ORM
- **Auth** : NextAuth.js v5, RBAC custom (22 rôles)
- **Agents IA** : Claude API (claude-sonnet-4-20250514), réponses JSON structurées
- **Documents** : docx (npm), PDFKit, ExcelJS
- **Files** : S3-compatible (MinIO dev / AWS S3 prod)
- **Jobs** : BullMQ + Redis (pénalités quotidiennes, alertes, surveillance)
- **Tests** : Vitest (unit), Playwright (e2e)

## Conventions de code

- TypeScript strict, JAMAIS de `any`
- Fichiers en kebab-case, composants PascalCase, fonctions camelCase
- Montants toujours en `Decimal` (Prisma) — FCFA HT sauf mention contraire
- Commentaires en **français** pour les règles métier
- Tests obligatoires pour TOUS les moteurs de calcul (`src/lib/engines/`)
- Server Components par défaut, Client Components uniquement si interactivité requise
- Middleware d'audit trail sur TOUTES les mutations Prisma

## Les 8 modules

1. **PPM** — Import PTAB Excel + génération Plan de Passation (2 feuilles ARMP)
2. **DAO** — Génération automatique Dossiers d'Appel d'Offres (wizard 3 étapes)
3. **Publication** — Publication multi-canal AAO, éclaircissements, additifs
4. **Ouverture** — Réception offres + séance ouverture publique + PV temps réel
5. **Évaluation** — Grille paramétrable, OAB, marges, rapport évaluation
6. **Attribution** — Notification, standstill, recours, signature→approbation (5 gates)
7. **Exécution** — OS, décomptes, pénalités, avenants, réceptions, paiements
8. **Archivage** — Dossier numérique, audit trail immuable, reporting ARMP

## Règles CRITIQUES (blocages système)

1. **Anti-fractionnement** : cumul par catégorie ≥ seuil mais chaque ligne < seuil → BLOCAGE (Art. 24 al.7)
2. **IC/CCAG non modifiables** : hash SHA-256 pour vérification, JAMAIS de modification autorisée
3. **BAL obligatoire** : pas de publication AAO sans Bon À Lancer de l'organe de contrôle
4. **Standstill** : BLOCAGE TECHNIQUE de la signature (5j ouv. ou 10j cal. selon type)
5. **Recours = gel** : effet suspensif automatique, le workflow est gelé
6. **Audit trail immuable** : table append-only, pas de DELETE ni UPDATE, conservation 10 ans
7. **Pénalités 10%** : cumul ≥ 10% TTC → résiliation de plein droit automatique
8. **Avenants 30%** : cumul > 30% initial → blocage
9. **Sous-traitance 40%** : plafond à ne pas dépasser
10. **Paiement 60j** : au-delà → intérêts moratoires automatiques au taux BCEAO

## Seuils de passation (FCFA HT — Décret 2020-599)

| Nature | AOO (≥) | DRP | DC | Dispense (≤) |
|--------|---------|-----|-----|--------------|
| Travaux | 100M | 10M-100M | 4M-10M | 4M |
| Fournitures/Services | 70M | 10M-70M | 4M-10M | 4M |
| PI cabinets | 50M | 10M-50M | 4M-10M | 4M |
| PI individuels | 20M | 10M-20M | 4M-10M | 4M |

## Moteurs de calcul (src/lib/engines/)

| Moteur | Fichier | Rôle |
|--------|---------|------|
| Seuils | `seuils-engine.ts` | Mode passation + organe contrôle + délai remise |
| Délais | `delais-engine.ts` | Calcul chronogramme (jours ouvrables, fériés Bénin) |
| Anti-fractionnement | `anti-fractionnement.ts` | Cumul par catégorie vs seuils |
| OAB | `oab-engine.ts` | M = 0,80 × (0,6×Fm + 0,4×Fc) |
| Marges | `marges-engine.ts` | UEMOA 15%, MPME 5%, sous-traitance 10% |
| Pénalités | `penalites-engine.ts` | Calcul quotidien, plafond 10% |
| Intérêts | `interets-engine.ts` | Taux BCEAO après 60j |

## Agents IA (src/lib/ia/agents/)

| Agent | Module | Tâches principales |
|-------|--------|-------------------|
| IAPRMP-Planification | M1 | Analyse PTAB, mapping colonnes, catégorisation, fusion |
| IAPRMP-DAO | M2 | Pré-remplissage DPAO, critères évaluation, check-list |
| IAPRMP-Evaluation | M5 | Vérification cohérence notes, calculs OAB/marges |
| IAPRMP-Attribution | M6 | Lettres notification, conformité projet marché |
| IAPRMP-Reporting | M8 | Rapports trimestriels, détection anomalies, appréciation |

Tous les agents utilisent `claude-sonnet-4-20250514` avec réponses JSON structurées.

## Ordre de développement

1. Schéma Prisma complet + migrations + seed
2. Moteurs de calcul (7) + tests unitaires exhaustifs
3. RBAC (22 rôles) + authentification NextAuth
4. Module 1 — PPM (fondation de tout le système)
5. Module 2 — DAO (cœur de l'automatisation)
6. Modules 3-4 — Publication + Ouverture
7. Module 5 — Évaluation
8. Module 6 — Attribution (workflow le plus complexe)
9. Module 7 — Exécution
10. Module 8 — Archivage/Reporting (transversal)

## Commandes utiles

```bash
npx prisma migrate dev     # Migrations
npx prisma db seed         # Seed data
npm run dev                # Dev server
npx vitest                 # Tests unitaires
npx playwright test        # Tests e2e
```
