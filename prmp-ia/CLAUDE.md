@AGENTS.md

# CLAUDE.md — PRMP-IA

## Contexte
Outil interne de gestion des marchés publics au Bénin pour la PRMP et son secrétariat (SPMP).
Cadre juridique : Loi N°2020-26 du 29 sept. 2020, Décrets 2020-595 à 2020-605, Manuel ARMP 2023.

## Utilisateurs
UNIQUEMENT 3 rôles : ADMIN, PRMP, SPMP. Pas de portail candidat ni organe de contrôle.

## Stack
- Next.js 14+ (App Router), React 18, TypeScript strict, TailwindCSS, shadcn/ui
- PostgreSQL 16 + Prisma ORM
- NextAuth.js v5, RBAC simplifié
- DeepSeek API (deepseek-chat) pour l'agent IA
- ExcelJS (PPM), docx (DAO/PV), PDFKit (PDF)
- node-cron (jobs planifiés)
- Vitest (tests unitaires)

## Commandes
```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run test         # Tests unitaires (vitest)
npx prisma migrate dev  # Migrations
npx prisma db seed      # Seed data
```

## Conventions
- TypeScript strict, pas de `any`
- Montants en Decimal (Prisma), FCFA HT
- Commentaires règles métier en français
- Tests obligatoires pour tous les engines (src/lib/engines/)
- Fichiers kebab-case, composants PascalCase
