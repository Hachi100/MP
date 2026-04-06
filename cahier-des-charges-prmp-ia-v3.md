# CAHIER DES CHARGES RÉVISÉ — PLATEFORME PRMP-IA (V3)

## Corrections majeures par rapport à la V2

1. **Utilisateurs** : UNIQUEMENT la PRMP et son secrétariat (SPMP) — pas 22 rôles
2. **IA** : DeepSeek API (pas Claude) pour toute l'automatisation
3. **Module 1 revisité** : Import PPM existant OU import PTAB → DeepSeek analyse → proposition PPM conforme au canevas ARMP
4. **Structure PPM** : EXACTEMENT conforme à l'exemple SAB fourni (2 feuilles, colonnes exactes)

---

# PARTIE A — ARCHITECTURE RÉVISÉE

## A1. Utilisateurs — RBAC simplifié

```
ADMIN       — Administrateur système (1 personne)
PRMP        — Personne Responsable des Marchés Publics (utilisateur principal)
SPMP        — Secrétariat Permanent des Marchés Publics (assistant PRMP)
```

Pas de portail candidat, pas de portail organe de contrôle, pas de portail ARMP.
La plateforme est un outil **interne** de gestion pour la PRMP et son secrétariat.

## A2. Stack technique révisée

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14+ (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui |
| Backend | Next.js API Routes + Services TypeScript |
| Base de données | PostgreSQL 16, Prisma ORM |
| Authentification | NextAuth.js v5, RBAC simplifié (3 rôles) |
| **Agent IA** | **DeepSeek API** (deepseek-chat / deepseek-reasoner) — réponses JSON structurées |
| File generation | ExcelJS (PPM), docx (DAO/PV), PDFKit |
| File storage | Local filesystem ou S3-compatible |
| Jobs | node-cron (pénalités, alertes) |
| Emails | Nodemailer (alertes internes) |

## A3. Agent IA — DeepSeek (IAPRMP)

```typescript
// Configuration DeepSeek
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
const DEEPSEEK_MODEL = "deepseek-chat"; // ou deepseek-reasoner pour les tâches complexes

// Appel type
const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
  },
  body: JSON.stringify({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: SYSTEM_PROMPT_IAPRMP },
      { role: "user", content: promptAvecDonnees }
    ],
    response_format: { type: "json_object" }, // Force JSON structuré
    temperature: 0.1 // Déterminisme pour les règles métier
  })
});
```

---

# PARTIE B — MODULE 1 RÉVISÉ : Import PTAB/PPM et Génération du PPM

## B1. Deux scénarios d'entrée

### Scénario A : Import d'un PPM existant (Excel)
- La PRMP importe un fichier PPM déjà fait (ex: PPM SAB)
- Le système le parse et le charge dans la base
- L'utilisateur peut le modifier, le compléter
- Pas besoin de l'IA dans ce cas

### Scénario B : Import d'un PTAB → DeepSeek génère le PPM
- La PRMP importe un fichier PTAB Excel
- DeepSeek analyse la structure, propose un mapping des colonnes
- DeepSeek catégorise chaque activité, calcule les modes de passation
- DeepSeek propose de fusionner les marchés de même nature
- DeepSeek génère un PPM conforme au canevas ARMP
- DeepSeek génère un tableau d'arrimage PPM↔PTAB

## B2. Structure exacte du PPM — CANEVAS ARMP (d'après le PPM SAB)

### Feuille 1 : « FOURNITURES, TRAVAUX ET SERVICES NON CONSULTANTS »

**En-tête (lignes 1-9) :**
```
Ligne 2 : GENERALITE
Ligne 3 : Nom de l'Autorité Contractante: [NOM_AC]
Ligne 5 : Date d'approbation du plan de passation de marché :    Plan original   crée le [DATE], transmis le [DATE], validé le [DATE]
Ligne 6 :                                                        Revision [N]    crée le [DATE]
Ligne 7 : Période couverte par le Plan de passation de marchés:  [DATE_DEBUT] au [DATE_FIN]
Ligne 9 : FOURNITURES, TRAVAUX ET SERVICES NON CONSULTANTS
```

**Ligne 10 — En-têtes de groupes :**
| Col | Groupe |
|-----|--------|
| A | N° |
| B | Réf N |
| C | Description |
| D-J | DONNÉES DE BASES |
| K-P | DOSSIER D'APPEL D'OFFRES |
| Q-T | ÉVALUATION DES OFFRES |
| U-W | SIGNATURE DE CONTRAT |

**Ligne 11 — En-têtes détaillés (23 colonnes) :**

| Col | En-tête exact | Exemple SAB |
|-----|---------------|-------------|
| A | N° | 1, 2, 3... |
| B | Réf N | F_SSSI_116126, T_DIE_118706... |
| C | Description | Renouvellement de l'outil de veille... |
| D | Type de marché (T, F et S) | T, F, S |
| E | Mode de Passation de Marchés (AOOI, AOON, AOR, DC...) | DC, AOO, DRP, MED |
| F | Montant Estimatif en FCFA | 7 990 400 |
| G | Source de financement (BN, BA, FE et Don) | BA, BN, FE |
| H | Ligne d'imputation budgétaire | 624202, 2341... |
| I | Organe de contrôle compétent (DNCMP, CCMP et DDCMP) | CCMP, DNCMP |
| J | Autorisation d'engagement (1 ou 3) | Annuel |
| K | Date de réception du Dossier par l'Organe de contrôle | 03-08-2026 |
| L | Date de réception de l'avis de non objection de l'Organe de contrôle | 03-08-2026 |
| M | Date de l'avis de non objection du PTF | |
| N | Date de réception du dossier corrigé pour le BON A LANCER | 03-08-2026 |
| O | Date d'autorisation du lancement du DAO | 03-08-2026 |
| P | Date de publication de l'avis par la PRMP | 03-08-2026 |
| Q | Date d'ouverture des plis | 10-08-2026 |
| R | Date de réception des rapports d'évaluation des offres par l'organe de contrôle | 13-08-2026 |
| S | Date de réception de l'avis de non objection de l'organe de contrôle | 13-08-2026 |
| T | Date de réception de l'avis de non objection du PTF | |
| U | Date d'examen juridique du contrat par l'organe de contrôle | 13-08-2026 |
| V | Date d'approbation du contrat | 17-08-2026 |
| W | Date de notification du contrat | 19-08-2026 |

**Dernière ligne de données + 1 : ligne COÛT TOTAL (col B + col F)**

**Après les données : légende des abréviations**

### Feuille 2 : « PRESTATIONS INTELLECTUELLES »

**Même en-tête que Feuille 1 (lignes 1-9), puis :**

Ligne 9 : SELECTION DE CONSULTANT POUR LES PRESTATIONS INTELLECTUELLES

**Ligne 10 — En-têtes de groupes :**
| Col | Groupe |
|-----|--------|
| A | N° |
| B | Réf N° |
| C | Description |
| D-J | DONNÉES DE BASES |
| K-T | AMI |
| U-Z | DP |
| AA-AD | ÉVALUATION DES OFFRES TECHNIQUES |
| AE-AH | ÉVALUATION DES PROPOSITIONS FINANCIÈRES |
| AI-AK | SIGNATURE DE CONTRAT |

**Ligne 11 — En-têtes détaillés (37 colonnes) :**

| Col | En-tête exact |
|-----|---------------|
| A | N° |
| B | Réf N° |
| C | Description |
| D | Mode de Passation de Marchés (AMI, AMII, DC) |
| E | Méthode de sélection (SFQC, SPBP, SFBD, QT, CI et DP) |
| F | Montant Estimatif en FCFA |
| G | Source de financement (BN, BA, FE et Don) |
| H | Ligne d'imputation budgétaire |
| I | Organe de contrôle compétent (DNCMP, CCMP et DDCMP) |
| J | Autorisation d'engagement (1 ou 3) |
| K | Date de réception de l'AMI par l'Organe de contrôle |
| L | Date de réception de l'avis de non objection de l'Organe de contrôle (AMI) |
| M | Date de l'avis de non objection du PTF (AMI) |
| N | Date de réception du dossier corrigé pour le BON A LANCER (AMI) |
| O | Date d'autorisation du lancement l'AMI |
| P | Date de publication de l'avis à manifestation d'intérêt |
| Q | Date d'ouverture des plis de l'AMI |
| R | Date de réception des rapports d'évaluation de l'AMI par l'organe de contrôle |
| S | Date de réception de l'avis de non objection de l'organe de contrôle (AMI) |
| T | Date de réception de l'avis de non objection du PTF (AMI) |
| U | Date de réception de la DP par l'Organe de contrôle |
| V | Date de réception de l'avis de non objection de l'Organe de contrôle (DP) |
| W | Date de l'avis de non objection du PTF (DP) |
| X | Date de réception du dossier corrigé pour le BON A LANCER (DP) |
| Y | Date d'autorisation du lancement de la DP |
| Z | Date d'invitation à la soumission |
| AA | Date d'ouverture des offres techniques |
| AB | Date de réception des résultats par l'organe de contrôle (technique) |
| AC | Date de réception de l'avis de non objection de l'organe de contrôle (technique) |
| AD | Date de réception de l'avis de non objection du PTF (technique) |
| AE | Date d'ouverture des offres financières |
| AF | Date de réception des résultats par l'organe de contrôle (financier) |
| AG | Date de réception de l'avis de non objection de l'organe de contrôle (financier) |
| AH | Date de réception de l'avis de non objection du PTF (financier) |
| AI | Date d'examen juridique du contrat par l'organe de contrôle |
| AJ | Date d'approbation du contrat |
| AK | Date de notification du contrat |

### Convention de Référence (Réf N / Réf N°) — d'après le PPM SAB

```
Format : [TYPE]_[DIRECTION]_[NUMERO]

TYPE :
  F = Fournitures
  T = Travaux
  S = Services
  PI = Prestations Intellectuelles

DIRECTION : code de la direction/service (ex: DSI, DIE, DCJ, SSSI, DOX)

NUMERO : identifiant unique (6 chiffres)

Exemples : F_SSSI_116126, T_DIE_118706, S_DSI_115217, PI_DIE_115118
```

## B3. Tableau d'arrimage PPM ↔ PTAB

Quand le PPM est généré à partir d'un PTAB, DeepSeek produit un **tableau d'arrimage** :

| Code budgétaire PTAB | Description activité PTAB | Montant PTAB | → | Réf N PPM | Description marché PPM | Type | Mode | Montant PPM |
|----------------------|--------------------------|-------------|---|-----------|----------------------|------|------|-------------|
| SAB.116.005.001.1.1.1.1 | Acquisition matériel info | 3 500 000 | → | F_DSI_001 | Achats divers fournitures Q1 (fusion 3 activités) | F | DISPENSE | 8 200 000 |
| SAB.116.005.001.1.1.1.2 | Achat toners | 2 200 000 | → | (même ligne fusionnée) | | | | |
| SAB.116.005.001.1.1.1.3 | Achat câblage | 2 500 000 | → | (même ligne fusionnée) | | | | |
| SAB.116.005.002.1.1.1.1 | Travaux peinture piste | 140 000 000 | → | T_DIE_002 | Travaux de peinture de la piste | T | AOO | 140 000 000 |

**Structure du tableau d'arrimage :**
- Colonne 1 : Code budgétaire PTAB
- Colonne 2 : Description activité PTAB (texte original)
- Colonne 3 : Imputation budgétaire PTAB
- Colonne 4 : Montant PTAB
- Colonne 5 : Réf N PPM (référence de la ligne PPM correspondante)
- Colonne 6 : Description marché PPM
- Colonne 7 : Type de marché (T/F/S/PI)
- Colonne 8 : Mode de passation
- Colonne 9 : Montant PPM
- Colonne 10 : Observation (ex: "fusionné avec...", "marché autonome")

Ce tableau est exportable en Excel et consultable dans l'interface.

## B4. Workflow du Module 1 (révisé)

```
[PRMP] Choisit : "Importer un PPM" ou "Importer un PTAB"

── SI PPM ──
   1. Upload du fichier PPM Excel
   2. Le système parse les 2 feuilles (structure connue)
   3. Chargement en base
   4. Affichage dans l'interface (tableau éditable)
   5. PRMP peut modifier/compléter

── SI PTAB ──
   1. Upload du fichier PTAB Excel
   2. Le système envoie les en-têtes et un échantillon à DeepSeek
   3. DeepSeek propose un mapping des colonnes → PRMP valide/corrige
   4. Le système extrait toutes les activités détaillées (pas les lignes SUM)
   5. DeepSeek analyse chaque activité :
      a. Catégorisation (T/F/S/PI)
      b. Mode de passation (selon seuils Décret 2020-599)
      c. Organe de contrôle (selon seuils + type AC)
      d. Proposition de fusion pour les marchés ≤ 4M de même nature
   6. DeepSeek génère le PPM (2 feuilles, structure exacte ARMP)
   7. DeepSeek calcule les dates du chronogramme
   8. DeepSeek génère le tableau d'arrimage PPM↔PTAB
   9. Affichage du PPM proposé dans l'interface (tableau éditable)
   10. PRMP peut :
       - Accepter ou refuser chaque fusion
       - Scinder un marché en plusieurs
       - Fusionner manuellement des marchés
       - Modifier les descriptions, dates, modes
       - Valider le PPM

── EXPORT ──
   - Export Excel conforme au canevas ARMP (2 feuilles)
   - Export PDF
   - Export tableau d'arrimage (si PTAB)
```

## B5. Prompts DeepSeek pour le Module 1

### Prompt 1 : Analyse du PTAB et mapping des colonnes

```
SYSTEM:
Tu es IAPRMP, un expert en marchés publics au Bénin. Tu connais parfaitement
la loi n°2020-26, les décrets 2020-595 à 2020-605, et le manuel ARMP 2023.

Ta tâche : analyser la structure d'un fichier PTAB (Plan de Travail Annuel
Budgétisé) et proposer un mapping des colonnes.

USER:
Voici les en-têtes et les 5 premières lignes de données du PTAB :
[EN-TETES_JSON]
[ECHANTILLON_JSON]

Propose un mapping JSON avec les champs suivants :
{
  "feuille": "nom de la feuille de données",
  "premiere_ligne_donnees": number,
  "mapping": {
    "code_budgetaire": "lettre_colonne ou null",
    "description": "lettre_colonne",
    "imputation_budgetaire": "lettre_colonne ou null",
    "montant_ae": "lettre_colonne",
    "montant_cp": "lettre_colonne ou null",
    "date_debut": "lettre_colonne ou null",
    "date_fin": "lettre_colonne ou null",
    "structure_responsable": "lettre_colonne ou null",
    "mode_execution": "lettre_colonne ou null"
  },
  "colonnes_ignorees": ["liste des colonnes non mappées"],
  "observations": "remarques sur la structure"
}
```

### Prompt 2 : Catégorisation et génération du PPM

```
SYSTEM:
Tu es IAPRMP, expert en marchés publics au Bénin.

RÈGLES DE SEUILS (Décret 2020-599) :
- Travaux : AOO ≥ 100M, DRP 10M-100M, DC 4M-10M, Dispense ≤ 4M
- Fournitures/Services : AOO ≥ 70M, DRP 10M-70M, DC 4M-10M, Dispense ≤ 4M
- PI cabinets : AOO ≥ 50M, DRP 10M-50M, DC 4M-10M, Dispense ≤ 4M
- PI individuels : AOO ≥ 20M, DRP 10M-20M, DC 4M-10M, Dispense ≤ 4M

RÈGLES DE FUSION :
- Activités ≤ 4M FCFA HT de même catégorie et même trimestre → fusionner
- Description fusionnée : "Achats divers de [catégorie] — [trimestre] (fusion de X activités)"
- Le montant fusionné peut dépasser 4M → recalculer le mode de passation

ORGANE DE CONTRÔLE (type AC = [TYPE_AC]) :
- DNCMP si : Travaux ≥ 500M, Fournitures/Services ≥ 300M, PI cab ≥ 200M, PI ind ≥ 100M
- CCMP sinon

CONVENTION DE RÉFÉRENCE :
[TYPE]_[DIRECTION]_[NUMERO] (ex: F_DSI_000001)

USER:
Voici les [N] activités extraites du PTAB :
[ACTIVITES_JSON]

Génère un JSON avec :
{
  "lignes_ppm_fts": [  // Fournitures, Travaux, Services
    {
      "numero": 1,
      "ref_n": "F_DSI_000001",
      "description": "...",
      "type_marche": "F",
      "mode_passation": "DC",
      "montant_estimatif": 7990400,
      "source_financement": "BA",
      "imputation_budgetaire": "624202",
      "organe_controle": "CCMP",
      "autorisation_engagement": "Annuel",
      "dates": {
        "reception_dossier_oc": "2026-03-08",
        "avis_non_objection_oc": "2026-03-08",
        ...toutes les 13 dates...
      },
      "activites_ptab_origine": ["code1", "code2"],  // traçabilité
      "est_fusion": false,
      "justification_ia": "Marché de fourniture, montant 7.99M → DC, organe CCMP"
    }
  ],
  "lignes_ppm_pi": [  // Prestations Intellectuelles
    {
      "numero": 1,
      "ref_n": "PI_DIE_000001",
      "description": "...",
      "mode_passation": "DRP",
      "methode_selection": "SFQC",
      ...les 27 dates de la feuille 2...
    }
  ],
  "fusions_proposees": [
    {
      "description_fusion": "Achats divers de fournitures — Q1 (fusion de 3 activités)",
      "activites_fusionnees": ["code1", "code2", "code3"],
      "montant_total": 8200000,
      "nouveau_mode": "DC",
      "justification": "3 achats de fournitures de même nature en Q1, chacun ≤ 4M"
    }
  ],
  "alertes_fractionnement": [
    {
      "categorie": "Fournitures",
      "imputation": "624202",
      "cumul": 85000000,
      "seuil_depasse": "AOO (70M)",
      "lignes_concernees": ["ref1", "ref2", "ref3"],
      "message": "Risque de fractionnement détecté : 3 marchés de fournitures totalisent 85M"
    }
  ],
  "tableau_arrimage": [
    {
      "code_budgetaire_ptab": "SAB.116.005.001.1.1.1.1",
      "description_ptab": "...",
      "imputation_ptab": "624202",
      "montant_ptab": 3500000,
      "ref_ppm": "F_DSI_001",
      "description_ppm": "Achats divers fournitures Q1",
      "observation": "Fusionné avec 2 autres activités"
    }
  ]
}
```

## B6. Interface du Module 1

### Page principale : `/ppm`
- Bouton "Importer un PPM" (upload Excel)
- Bouton "Importer un PTAB pour générer un PPM" (upload Excel)
- Liste des PPM existants (année, statut, nombre de lignes, montant total)

### Page d'import PTAB : `/ppm/import-ptab`
- Étape 1 : Upload du fichier
- Étape 2 : Validation du mapping (tableau avec colonnes PTAB ↔ champs système)
- Étape 3 : Résultat DeepSeek — PPM proposé (tableau éditable)
  - Onglet "Fournitures, Travaux, Services"
  - Onglet "Prestations Intellectuelles"
  - Onglet "Fusions proposées" (accepter/refuser chaque fusion)
  - Onglet "Tableau d'arrimage PPM↔PTAB"
  - Onglet "Alertes" (fractionnement, anomalies)
- Étape 4 : Export (Excel canevas ARMP + PDF + tableau d'arrimage)

### Page d'édition PPM : `/ppm/[id]`
- Tableau éditable avec les colonnes exactes du canevas ARMP
- Actions : ajouter ligne, supprimer, fusionner, scinder
- Bouton "Recalculer les dates" (moteur de délais)
- Bouton "Vérifier anti-fractionnement"
- Bouton "Exporter Excel" / "Exporter PDF"

---

# PARTIE C — GUIDE CLAUDE CODE RÉVISÉ

## C1. CLAUDE.md révisé

```markdown
# CLAUDE.md — PRMP-IA

## Contexte
Outil interne de gestion des marchés publics pour la PRMP et son secrétariat.
Cadre juridique : Loi N°2020-26, Décrets 2020-595 à 2020-605.
Utilisateurs : PRMP + SPMP uniquement (3 rôles : ADMIN, PRMP, SPMP).

## Stack
- Next.js 14+ (App Router), TypeScript strict, TailwindCSS, shadcn/ui
- PostgreSQL 16 + Prisma ORM
- DeepSeek API (deepseek-chat) pour automatisation IA
- ExcelJS (génération PPM), docx (DAO/PV), PDFKit
- node-cron pour jobs planifiés

## Agent IA
- API : DeepSeek (https://api.deepseek.com/v1/chat/completions)
- Modèle : deepseek-chat (ou deepseek-reasoner pour analyse complexe)
- Toujours response_format: { type: "json_object" }
- Temperature: 0.1 (déterminisme)
- Prompts en français avec toutes les règles métier intégrées

## Structure PPM
Le PPM généré DOIT être conforme au canevas ARMP :
- Feuille 1 : "Fournitures, travaux, services" — 23 colonnes (voir specs)
- Feuille 2 : "Prestations intellectuelles" — 37 colonnes (voir specs)
- En-tête standard avec nom AC, dates, période
- Légende des abréviations en bas

## Convention de référence
Format : [TYPE]_[DIRECTION]_[NUMERO]
Types : F (Fournitures), T (Travaux), S (Services), PI (Prestations Intellectuelles)

## Règles critiques
- Montants en FCFA HT
- Seuils : Travaux AOO≥100M, F/S AOO≥70M, PI cab≥50M, PI ind≥20M
- Fusion : activités ≤4M même catégorie même trimestre
- Anti-fractionnement : bloquer si cumul catégorie ≥ seuil avec lignes individuelles < seuil
```

## C2. Commandes Claude Code — Session par session

### Session 1 : Initialisation
```
Lis CLAUDE.md et docs/cahier-des-charges-v3.md.
1. Crée le projet Next.js avec la stack décrite
2. Crée le schéma Prisma simplifié (3 rôles, tables PPM, PTAB, arrimage)
3. Crée le moteur de seuils (seuils-engine.ts) avec tests
4. Crée le moteur de calcul des dates (delais-engine.ts) avec jours fériés Bénin
```

### Session 2 : Module 1 — Backend
```
Implémente le Module 1 — Import PTAB et génération PPM :
1. Service d'import Excel (ExcelJS) — parse PTAB et PPM
2. Intégration DeepSeek API (client + prompts Module 1)
3. Service de génération PPM (structure exacte canevas ARMP)
4. Service de génération du tableau d'arrimage PPM↔PTAB
5. Service d'export Excel (2 feuilles conformes au canevas)
6. Anti-fractionnement
7. API Routes pour tout le workflow
```

### Session 3 : Module 1 — Frontend
```
Crée les pages du Module 1 :
1. Page /ppm — liste des PPM
2. Page /ppm/import-ptab — wizard 4 étapes
3. Page /ppm/[id] — édition PPM (tableau avec 23/37 colonnes)
4. Composants : tableau éditable, onglets, alertes, export
```

### Sessions suivantes : Modules 2 à 8
```
Même approche : backend (services, API, DeepSeek) puis frontend
```
