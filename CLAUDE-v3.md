# CLAUDE.md — PRMP-IA

## Contexte
Outil interne de gestion des marchés publics au Bénin pour la PRMP et son secrétariat (SPMP).
Cadre juridique : Loi N°2020-26 du 29 sept. 2020, Décrets 2020-595 à 2020-605, Manuel ARMP 2023.
Cahier des charges complet : `docs/cahier-des-charges-prmp-ia-v3.md`

## Utilisateurs
UNIQUEMENT 3 rôles : ADMIN, PRMP, SPMP. Pas de portail candidat ni organe de contrôle.

## Stack
- Next.js 14+ (App Router), React 18, TypeScript strict, TailwindCSS, shadcn/ui
- PostgreSQL 16 + Prisma ORM
- NextAuth.js v5, RBAC simplifié
- **DeepSeek API** (deepseek-chat) — `https://api.deepseek.com/v1/chat/completions`
- ExcelJS (PPM Excel), docx npm (DAO/PV/contrats), PDFKit (PDF)
- node-cron (jobs planifiés : pénalités, alertes garanties, validité offres)
- Vitest (tests unitaires)

## DeepSeek — Agent IAPRMP
```typescript
// Toujours utiliser response_format JSON, temperature 0.1
const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
  method: "POST",
  headers: { "Authorization": `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "deepseek-chat",
    messages: [{ role: "system", content: PROMPT }, { role: "user", content: DATA }],
    response_format: { type: "json_object" },
    temperature: 0.1
  })
});
```

## Les 8 modules
1. **PPM** — Import PTAB ou PPM existant → DeepSeek génère PPM conforme canevas ARMP (2 feuilles) + tableau d'arrimage PPM↔PTAB
2. **DAO** — Wizard 3 étapes, assemblage blocs fixes (IC/CCAG non modifiables), pré-remplissage DPAO
3. **Publication** — Multi-canal, compte à rebours, éclaircissements, additifs
4. **Ouverture** — Registre réception, séance COE, PV temps réel
5. **Évaluation** — Grille paramétrable, OAB (M=0.80×(0.6×Fm+0.4×Fc)), marges préférence
6. **Attribution** — Notification, standstill, recours, workflow signature→approbation (5 gates)
7. **Exécution** — OS, décomptes, pénalités (plafond 10%), avenants (plafond 30%), réceptions, paiements (60j)
8. **Archivage** — Dossier numérique 10 ans, audit trail immuable, rapports trimestriels

## Structure PPM — Canevas ARMP (CRITIQUE)
Feuille 1 "Fournitures, travaux, services" : 23 colonnes (N°, Réf N, Description, Type T/F/S, Mode, Montant, Source financement, Imputation, Organe contrôle, AE, + 13 dates)
Feuille 2 "Prestations intellectuelles" : 37 colonnes (N°, Réf N°, Description, Mode AMI/AMII/DC, Méthode SFQC/SPBP/etc, Montant, Source, Imputation, Organe, AE, + 27 dates)
Convention Réf : [TYPE]_[DIRECTION]_[NUMERO] (ex: F_DSI_116126, PI_DIE_115118)

## Seuils (FCFA HT)
| Nature | AOO≥ | DRP | DC | Dispense≤ |
|--------|------|-----|-----|-----------|
| Travaux | 100M | 10-100M | 4-10M | 4M |
| Fourn/Serv | 70M | 10-70M | 4-10M | 4M |
| PI cab | 50M | 10-50M | 4-10M | 4M |
| PI ind | 20M | 10-20M | 4-10M | 4M |

## Règles critiques (blocages système)
- Anti-fractionnement → BLOCAGE
- IC/CCAG → hash SHA-256, JAMAIS modifiable
- Pas d'AAO sans BAL
- Standstill → blocage signature
- Recours → gel workflow
- Audit trail → append-only
- Pénalités cumul ≥ 10% → résiliation de plein droit
- Avenants cumul > 30% → blocage
- Paiement > 60j → intérêts moratoires taux BCEAO

## Conventions code
- TypeScript strict, pas de `any`
- Montants : Decimal (Prisma), FCFA HT
- Commentaires règles métier en français
- Tests obligatoires pour tous les engines (src/lib/engines/)
- Fichiers kebab-case, composants PascalCase
