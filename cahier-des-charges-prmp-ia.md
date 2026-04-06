# CAHIER DES CHARGES COMPLET — PLATEFORME PRMP-IA

## Application web de gestion, suivi et automatisation des marchés publics au Bénin

**Version** : 2.0 — Avril 2026
**Cadre juridique** : Loi N°2020-26, Décrets 2020-595 à 2020-605, Loi 2024-30, Manuel ARMP 2023
**Architecture cible** : Next.js 14+ (App Router) / Node.js TypeScript / PostgreSQL / Prisma ORM / Claude API (agents IA)

---

# PARTIE A — ARCHITECTURE GLOBALE ET SPÉCIFICATIONS TRANSVERSALES

## A1. Vision du produit

Plateforme SaaS B2G couvrant les 8 phases du cycle de vie d'un marché public, de la planification (PPMP) jusqu'à l'archivage et au reporting. L'application intègre des agents IA spécialisés (IAPRMP) pour automatiser les tâches répétitives, garantir la conformité réglementaire et assister les acteurs.

## A2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14+ (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui |
| Backend | Next.js API Routes + Services TypeScript, tRPC ou REST |
| Base de données | PostgreSQL 16, Prisma ORM |
| Authentification | NextAuth.js v5, RBAC custom (22 rôles) |
| Agents IA | Claude API (claude-sonnet-4-20250514), structured outputs JSON |
| File generation | docx (npm), PDFKit, ExcelJS |
| File storage | S3-compatible (MinIO en dev, AWS S3 en prod) |
| Queue/Jobs | BullMQ + Redis (pénalités, alertes, cron) |
| Recherche plein texte | PostgreSQL FTS + pg_trgm |
| Emails | Nodemailer + templates MJML |
| Tests | Vitest (unit), Playwright (e2e) |

## A3. Système RBAC — 22 rôles

```
SUPER_ADMIN           — Administration système globale
ADMIN_AC              — Administrateur d'une Autorité Contractante
PRMP                  — Personne Responsable des Marchés Publics
SPMP                  — Secrétariat Permanent des Marchés Publics
SPM                   — Spécialiste en Passation de Marchés
COE_PRESIDENT         — Président de la COE (= PRMP en général)
COE_MEMBRE            — Membre de la Commission d'Ouverture et d'Évaluation
COE_RAPPORTEUR        — Rapporteur de la COE
CCMP_PRESIDENT        — Président de la Cellule de Contrôle
CCMP_MEMBRE           — Membre de la CCMP
CCMP_RAPPORTEUR       — Rapporteur de la CCMP
DDCMP_DIRECTEUR       — Directeur Départemental de Contrôle
DDCMP_AGENT           — Agent de la DDCMP
DNCMP_DIRECTEUR       — Directeur National de Contrôle
DNCMP_AGENT           — Agent de la DNCMP
CONTROLEUR_FINANCIER  — Contrôleur financier / visa budgétaire
AUTORITE_APPROBATRICE — Ministre des finances, DG, Maire
ARMP_PRESIDENT        — Président de l'ARMP
ARMP_AUDITEUR         — Auditeur ARMP
SERVICE_BENEFICIAIRE  — Direction technique (saisie des besoins)
CANDIDAT              — Soumissionnaire / entreprise
MAITRE_OEUVRE         — Maître d'œuvre / Assistant MOA
```

## A4. Modèle de données principal (schéma Prisma simplifié)

```prisma
model AutoriteContractante {
  id          String   @id @default(cuid())
  nom         String
  type        TypeAC   // ETAT, COMMUNE, COMMUNE_STATUT_PARTICULIER, ETABLISSEMENT
  // ... relations
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  nom         String
  prenom      String
  roles       UserRole[]
  acId        String?
  // ... relations
}

model UserRole {
  id     String @id @default(cuid())
  userId String
  role   RoleEnum
  acId   String? // scope par AC
}

model PlanPassation {
  id              String   @id @default(cuid())
  acId            String
  annee           Int
  version         Int      @default(1)
  statut          StatutPPM // BROUILLON, VALIDE_CCMP, CONFORME_DNCMP, PUBLIE
  dateCreation    DateTime @default(now())
  dateValidation  DateTime?
  lignes          LignePPM[]
  imports         PtabImport[]
}

model LignePPM {
  id                  String   @id @default(cuid())
  ppmId               String
  refN                String   // Référence unique
  description         String
  typeMarche          TypeMarche // TRAVAUX, FOURNITURES, SERVICES, PI_CABINET, PI_INDIVIDUEL
  modePassation       ModePassation // AOO, AOR, DRP, DC, DISPENSE, AMI, AMII
  methodeSelection    MethodePI? // SFQC, SPBP, SFBD, QT, CI, DP (PI uniquement)
  montantEstimatif    Decimal
  sourceFinancement   String
  imputationBudgetaire String
  organeControle      OrganeControle // CCMP, DDCMP, DNCMP
  autorisationEngagement Decimal?
  estCommunautaire    Boolean @default(false)
  // Dates planifiées (calculées automatiquement)
  dateReceptionDossierOC   DateTime?
  dateAvisNonObjection     DateTime?
  dateBonALancer           DateTime?
  datePublicationAAO       DateTime?
  dateOuverturePlis        DateTime?
  dateRapportEvaluation    DateTime?
  dateAvisOCEvaluation     DateTime?
  dateExamenJuridique      DateTime?
  dateApprobation          DateTime?
  dateNotification         DateTime?
  // Traçabilité PTAB
  activitesPtab   ActivitePtab[]
  // Relations
  dao             Dao?
  marche          Marche?
}

model ActivitePtab {
  id                  String @id @default(cuid())
  importId            String
  lignePpmId          String?
  codeBudgetaire      String
  description         String
  imputationBudgetaire String?
  montant             Decimal
  dateDebut           DateTime?
  dateFin             DateTime?
  structureResponsable String?
  modeExecution       String?
  estFusionnee        Boolean @default(false)
}

model PtabImport {
  id          String @id @default(cuid())
  ppmId       String
  fichier     String
  mapping     Json   // Mapping colonnes détecté par IA
  dateImport  DateTime @default(now())
  activites   ActivitePtab[]
}

model Dao {
  id              String @id @default(cuid())
  lignePpmId      String @unique
  typeDao         TypeDao // TRAVAUX, FOURNITURES, SERVICES, PI
  statut          StatutDAO // BROUILLON, EN_REVUE, SOUMIS_OC, BAL_OBTENU, PUBLIE
  // Sections du DAO
  dpao            Json      // Données Particulières de l'AO
  criteresEvaluation Json   // Critères Section I-C
  specificationsT Json?     // Spécifications techniques
  ccap            Json?     // Clauses administratives particulières
  aao             Json?     // Avis d'appel d'offres généré
  // Garantie et délais
  montantGarantie    Decimal?
  tauxGarantie       Decimal? // 1-3%
  dateLimiteDepot    DateTime?
  delaiValiditeOffres Int @default(90)
  // Hash blocs fixes
  hashIC          String?
  hashCCAG        String?
  // Check-list
  checklistARMP   Json?
  rapportConformite Json?
  // Relations
  eclaircissements Eclaircissement[]
  additifs         Additif[]
  retraitsDAO      RetraitDAO[]
  offres           Offre[]
}

model Eclaircissement {
  id          String @id @default(cuid())
  daoId       String
  candidatId  String?
  question    String
  reponse     String?
  dateQuestion DateTime @default(now())
  dateReponse  DateTime?
  estAnonyme  Boolean @default(true)
  diffuse     Boolean @default(false)
}

model Additif {
  id          String @id @default(cuid())
  daoId       String
  contenu     String
  statut      StatutValidation // EN_ATTENTE, VALIDE, REJETE
  dateCreation DateTime @default(now())
  dateValidation DateTime?
  prorogationJours Int?
}

model RetraitDAO {
  id          String @id @default(cuid())
  daoId       String
  raisonSociale String
  email       String
  telephone   String?
  dateRetrait DateTime @default(now())
}

model Offre {
  id              String @id @default(cuid())
  daoId           String
  soumissionnaire String
  numeroOrdre     Int
  dateReception   DateTime
  heureReception  DateTime
  estRecevable    Boolean @default(true)
  motifIrrecevabilite String?
  // Données ouverture
  prixLuChiffres  Decimal?
  prixLuLettres   String?
  montantGarantie Decimal?
  rabais          Decimal?
  pouvoirSignataire Boolean?
  accordGroupement  Boolean?
  // Évaluation
  noteRecevabilite    Json?
  noteTechnique       Decimal?
  noteFinanciere      Decimal?
  montantCorrige      Decimal?
  variationCorrection Decimal? // %
  estOAB              Boolean @default(false)
  margePrefUEMOA      Boolean @default(false)
  margePrefMPME       Boolean @default(false)
  margePrefSousTraitance Boolean @default(false)
  montantApresMarges  Decimal?
  rangClassement      Int?
  motifRejet          String?
  statut              StatutOffre // RECUE, OUVERTE, EVALUEE, RETENUE, ECARTEE
}

model SeanceOuverture {
  id          String @id @default(cuid())
  daoId       String @unique
  dateSeance  DateTime
  lieuSeance  String
  quorumAtteint Boolean
  membresPresents Json // [{userId, nom, fonction}]
  representantOC  Json? // {nom, organe}
  soumissionnairesPresents Json?
  observations    String?
  pvGenere        Boolean @default(false)
  pvSigne         Boolean @default(false)
  pvPublie        Boolean @default(false)
  datePvPublication DateTime?
}

model RapportEvaluation {
  id          String @id @default(cuid())
  daoId       String @unique
  phaseRecevabilite Json
  phaseConformite   Json
  phaseFinanciere   Json
  phaseQualification Json?
  seuilOAB          Decimal? // M calculé
  tableauComparatif Json
  attributaireProvisoire String?
  montantAttribution     Decimal?
  pvAttribution   Json?
  statut          StatutValidation
  dateTransmission DateTime?
  dateAvisOC       DateTime?
  avisOC           AvisOC? // FAVORABLE, RESERVES, DEFAVORABLE
  observationsOC   String?
}

model Marche {
  id              String @id @default(cuid())
  lignePpmId      String @unique
  daoId           String
  attributaire    String
  montantTTC      Decimal
  montantHT       Decimal
  delaiExecution  Int // jours
  // Workflow signature/approbation
  dateNotifProvisoire   DateTime?
  dateFinStandstill     DateTime?
  dateSignatureAttributaire DateTime?
  dateSignaturePRMP     DateTime?
  dateExamenJuridique   DateTime?
  dateVisaBudgetaire    DateTime?
  dateApprobation       DateTime?
  dateAuthentification  DateTime?
  dateEnregistrementFiscal DateTime?
  dateNotifDefinitive   DateTime?
  dateEntreeVigueur     DateTime?
  datePublicAttribDef   DateTime?
  statut              StatutMarche
  // Exécution
  ordresService     OrdreService[]
  decomptes         Decompte[]
  avenants          Avenant[]
  penalites         Penalite[]
  garanties         Garantie[]
  receptions        Reception[]
  paiements         Paiement[]
  recours           Recours[]
}

model OrdreService {
  id          String @id @default(cuid())
  marcheId    String
  numero      Int
  type        TypeOS // DEMARRAGE, ARRET, REPRISE, MODIFICATION
  dateEmission DateTime
  dateEffet   DateTime
  redevanceARMPPayee Boolean @default(false)
}

model Decompte {
  id              String @id @default(cuid())
  marcheId        String
  numero          Int
  periode         String
  montantTravaux  Decimal
  avancementPhysique Decimal // %
  acomptesDeduits    Decimal @default(0)
  penalitesDeduites  Decimal @default(0)
  retenue            Decimal @default(0) // 5%
  montantNet         Decimal
  dateCreation       DateTime
  dateValidation     DateTime?
  datePaiement       DateTime?
}

model Avenant {
  id          String @id @default(cuid())
  marcheId    String
  numero      Int
  objet       String
  montant     Decimal
  delaiSupplementaire Int?
  cumulAvenantsPourcent Decimal // calculé
  statut      StatutValidation
  dateCreation DateTime
}

model Penalite {
  id          String @id @default(cuid())
  marcheId    String
  dateDebut   DateTime
  dateFin     DateTime?
  joursRetard Int
  taux        Decimal // 1/5000 à 1/2000
  montant     Decimal
  cumulPourcent Decimal // vs montant TTC
  miseEnDemeure Boolean @default(false)
  dateMiseEnDemeure DateTime?
}

model Garantie {
  id          String @id @default(cuid())
  marcheId    String
  type        TypeGarantie // SOUMISSION, BONNE_EXECUTION, RESTITUTION_AVANCE, RETENUE
  montant     Decimal
  dateDebut   DateTime
  dateExpiration DateTime
  estLiberee  Boolean @default(false)
  dateLiberation DateTime?
}

model Reception {
  id          String @id @default(cuid())
  marcheId    String
  type        TypeReception // PROVISOIRE, DEFINITIVE
  dateReception DateTime
  reserves    String?
  pvGenere    Boolean @default(false)
}

model Paiement {
  id              String @id @default(cuid())
  marcheId        String
  decompteId      String?
  montant         Decimal
  dateFacture     DateTime
  dateEcheance    DateTime // dateFacture + 60j
  datePaiementEffectif DateTime?
  interetsMoratoires   Decimal @default(0)
  tauxBCEAO       Decimal?
}

model Recours {
  id          String @id @default(cuid())
  marcheId    String
  requerant   String
  motif       String
  dateDepot   DateTime
  dateReponse DateTime?
  reponse     String?
  saisineARMP Boolean @default(false)
  dateDecisionARMP DateTime?
  decisionARMP    String?
  effetSuspensif  Boolean @default(true)
  statut      StatutRecours // EN_INSTANCE, REPONDU, CLOS
}

model AuditTrail {
  id          String @id @default(cuid())
  userId      String
  role        RoleEnum
  action      ActionType // CREATE, UPDATE, DELETE, VIEW, SIGN, VALIDATE
  entite      String // table name
  entiteId    String
  snapshotAvant Json?
  snapshotApres Json?
  horodatage  DateTime @default(now())
  ipAddress   String?
}

model DossierArchive {
  id          String @id @default(cuid())
  marcheId    String
  documents   DocumentArchive[]
  estComplet  Boolean @default(false)
  dateClotureMarche DateTime?
  datePurge   DateTime? // dateClotureMarche + 10 ans
}

model DocumentArchive {
  id          String @id @default(cuid())
  dossierId   String
  phase       PhaseMarche
  typeDocument String
  fichierUrl  String
  hashSHA256  String
  dateAjout   DateTime @default(now())
}

// ENUMS
enum TypeAC { ETAT COMMUNE COMMUNE_STATUT_PARTICULIER ETABLISSEMENT }
enum TypeMarche { TRAVAUX FOURNITURES SERVICES PI_CABINET PI_INDIVIDUEL }
enum ModePassation { AOO_NATIONAL AOO_INTERNATIONAL AOR DRP DC DISPENSE AMI AMII ENTENTE_DIRECTE }
enum MethodePI { SFQC SPBP SFBD QT CI DP SED }
enum OrganeControle { CCMP DDCMP DNCMP }
enum StatutPPM { BROUILLON EN_VALIDATION_CCMP VALIDE_CCMP EN_EXAMEN_DNCMP CONFORME_DNCMP PUBLIE REVISE }
enum StatutDAO { BROUILLON EN_REVUE SOUMIS_OC AVIS_EMIS BAL_OBTENU }
enum StatutValidation { EN_ATTENTE VALIDE REJETE RESERVES }
enum AvisOC { FAVORABLE RESERVES DEFAVORABLE }
enum StatutOffre { RECUE IRRECEVABLE OUVERTE EN_EVALUATION EVALUEE RETENUE ECARTEE }
enum StatutMarche { NOTIFIE_PROVISOIRE STANDSTILL EN_SIGNATURE SIGNE EXAMEN_JURIDIQUE VISA_BUDGETAIRE EN_APPROBATION APPROUVE AUTHENTIFIE ENREGISTRE EN_VIGUEUR EN_EXECUTION RECEPTION_PROVISOIRE PERIODE_GARANTIE RECEPTION_DEFINITIVE ARCHIVE RESILIE }
enum TypeOS { DEMARRAGE ARRET REPRISE MODIFICATION }
enum TypeGarantie { SOUMISSION BONNE_EXECUTION RESTITUTION_AVANCE RETENUE }
enum TypeReception { PRE_RECEPTION PROVISOIRE DEFINITIVE }
enum StatutRecours { EN_INSTANCE REPONDU_PRMP SAISINE_ARMP DECIDE_ARMP CLOS }
enum PhaseMarche { PLANIFICATION PREPARATION PUBLICATION OUVERTURE EVALUATION ATTRIBUTION EXECUTION ARCHIVAGE }
enum ActionType { CREATE UPDATE DELETE VIEW SIGN VALIDATE SUBMIT PUBLISH GENERATE }
```

## A5. Référentiel des seuils (Décret 2020-599)

### A5.1 Seuils de passation (montants HT en FCFA)

| Nature | AOO (≥) | DRP (entre) | DC (entre) | Dispense (≤) |
|--------|---------|-------------|------------|--------------|
| Travaux | 100 000 000 | 10M — 100M | 4M — 10M | 4 000 000 |
| Fournitures/Services | 70 000 000 | 10M — 70M | 4M — 10M | 4 000 000 |
| PI cabinets | 50 000 000 | 10M — 50M | 4M — 10M | 4 000 000 |
| PI individuels | 20 000 000 | 10M — 20M | 4M — 10M | 4 000 000 |

### A5.2 Seuils de compétence des organes de contrôle

| Type AC | Travaux | Fourn./Services | PI cabinets | PI individuels |
|---------|---------|-----------------|-------------|----------------|
| État/ministères → DNCMP si ≥ | 500M | 300M | 200M | 100M |
| Communes sans statut → DNCMP si ≥ | 300M | 150M | 120M | 80M |
| En dessous → CCMP (ou DDCMP selon département) |

### A5.3 Seuils communautaires UEMOA (publication obligatoire)

| Nature | Seuil |
|--------|-------|
| Travaux | 1 000 000 000 FCFA |
| Fournitures/Services | 300 000 000 FCFA |
| PI | 200 000 000 FCFA |

## A6. Référentiel des délais légaux (Décret 2020-600)

| Étape | Délai | Base légale |
|-------|-------|-------------|
| Élaboration PPMP après approbation budget | 10 j. calendaires | Art. 24 al.1 |
| Validation CCMP du PPMP | 3 j. ouvrables | Check-list N°03 |
| Validation DNCMP du PPMP | 4 j. ouvrables | Décret 2020-600 |
| Transmission DAO avant lancement | 10 j. ouvrables | Manuel p.56 |
| Examen DAO par CCMP | 3 j. ouvrables | Décret 2020-600 |
| Examen DAO par DNCMP/DDCMP | 4 j. ouvrables | Décret 2020-600 |
| Publication AAO après BAL | 2 j. ouvrés | Manuel p.56 |
| Délai remise offres (national) | 21 j. calendaires | Art. 54 |
| Délai remise offres (communautaire) | 30 j. calendaires | Art. 54 |
| Délai remise offres (urgence) | 15 j. calendaires | Art. 54 |
| Délai éclaircissements (national) | 10 j. cal. avant date limite | Clause 7/8 IC |
| Réponse éclaircissements | 3 j. ouvrables | Manuel |
| Évaluation des offres (COE) | 10 j. ouvrables | Manuel p.61 |
| Examen rapport éval. CCMP | 3 j. ouvrables | Décret 2020-600 |
| Examen rapport éval. DNCMP/DDCMP | 5 j. ouvrables | Décret 2020-600 |
| Standstill (travaux/fourn/services) | 5 j. ouvrables | Art. 79 al.3 |
| Standstill (PI) | 10 j. calendaires | Art. 79 al.3 |
| Recours devant PRMP | 5 j. ouvrables | Art. 86 |
| Réponse PRMP au recours | 3 j. ouvrables | Art. 86 |
| Saisine ARMP après réponse PRMP | 2 j. ouvrables | Art. 86 |
| Décision ARMP sur recours | 7 j. ouvrables | Art. 86 |
| Signature par attributaire | 3 j. ouvrables | Clause 40.3 |
| Signature par PRMP | 2 j. ouvrables | Clause 40.3 |
| Examen juridique/technique | 2 j. ouvrables | Décret 2020-600 |
| Visa budgétaire | 2 j. ouvrables | Décret 2020-600 |
| Approbation | 5 j. ouvrables | Art. 85 |
| Authentification/numérotation | 3 j. ouvrables | Décret 2020-600 |
| Enregistrement fiscal | 1 mois | Art. 86 |
| Notification définitive | 3 j. calendaires | Art. 86 |
| Publication attrib. définitive | 15 j. cal. après entrée en vigueur | Art. 87 |
| Délai paiement | 60 j. calendaires | Art. 116 |
| Mise en demeure avant pénalités | 8 j. calendaires | Art. 113 |
| Entrée en vigueur max après approbation | 3 mois | Clause 44.4 |

## A7. Jours fériés du Bénin (à intégrer dans le calcul des jours ouvrables)

```typescript
const JOURS_FERIES_FIXES = [
  { mois: 1, jour: 1, nom: "Jour de l'An" },
  { mois: 1, jour: 10, nom: "Fête du Vodoun" },
  { mois: 5, jour: 1, nom: "Fête du Travail" },
  { mois: 8, jour: 1, nom: "Fête de l'Indépendance" },
  { mois: 8, jour: 15, nom: "Assomption" },
  { mois: 10, jour: 26, nom: "Journée des Forces Armées" },
  { mois: 11, jour: 1, nom: "Toussaint" },
  { mois: 12, jour: 25, nom: "Noël" },
];
// + Lundi de Pâques, Ascension, Lundi de Pentecôte (variables)
// + Ramadan (Eid al-Fitr), Tabaski (Eid al-Adha), Maouloud (variables)
// À calculer dynamiquement ou paramétrer annuellement
```

## A8. Moteur de calcul des seuils (seuils-engine)

```typescript
interface SeuilsResult {
  modePassation: ModePassation;
  organeControle: OrganeControle;
  delaiMinRemise: number; // jours
  estCommunautaire: boolean;
  delaiExamenOC: number; // jours ouvrables
}

function calculerSeuils(
  typeMarche: TypeMarche,
  montantHT: number,
  typeAC: TypeAC
): SeuilsResult {
  // 1. Déterminer le mode de passation
  // 2. Déterminer l'organe de contrôle
  // 3. Calculer le délai minimum de remise
  // 4. Vérifier le caractère communautaire UEMOA
  // Voir tables A5.1, A5.2, A5.3
}

function calculerDatesChronogramme(
  dateLancementSouhaitee: Date,
  modePassation: ModePassation,
  organeControle: OrganeControle,
  estCommunautaire: boolean
): Record<string, Date> {
  // Calcul rétroactif et prospectif selon table A6
  // Utilisation des jours ouvrables (excluant weekends + fériés)
}
```

## A9. Contrôle anti-fractionnement

```
RÈGLE : Pour chaque catégorie (T/F/S/PI) et chaque imputation budgétaire,
sur une même période (année), si :
  - montant_cumule_categorie ≥ seuil_passation
  - ET chaque montant_individuel < seuil_passation
ALORS → ALERTE FRACTIONNEMENT (Art. 24 al. 7, Loi 2020-26)
→ Bloquer la création de la ligne et proposer fusion
```

## A10. Formules réglementaires

### Offre Anormalement Basse (OAB)
```
M = 0,80 × (0,6 × Fm + 0,4 × Fc)
Fm = moyenne arithmétique des offres financières HT (après corrections)
Fc = estimation prévisionnelle HT de l'AC
Si offre < M → présumée OAB → demande de justification
```

### Marges de préférence
```
UEMOA : -15% sur le prix de l'offre (pour classement uniquement)
MPME  : -5% si sous-traitance ≥ 30% à des MPME (cumulable avec UEMOA)
Sous-traitance locale : -10% (collectivités, extra-communautaires sous-traitant ≥30% à béninois)
```

### Pénalités de retard
```
Pénalité journalière = montant_TTC × taux_contractuel (entre 1/5000 et 1/2000)
Cumul plafonné à 10% du montant TTC (y compris avenants)
Si cumul ≥ 10% → résiliation de plein droit
```

### Intérêts moratoires
```
Si paiement > 60 jours après réception facture :
Intérêts = montant_dû × taux_BCEAO × (jours_retard / 365)
```

### Garanties
```
Garantie de soumission : 1 à 3% du montant estimé HT
Garantie de bonne exécution : 5% du prix de base (avec avenants)
  - Libération : 90% à réception provisoire, 10% à réception définitive
Avance de démarrage max : 20% (travaux/PI), 30% (fournitures)
Retenue de garantie : 5% de chaque paiement
Sous-traitance max : 40% du montant global
Cumul avenants max : 30% du montant initial
```

---

# PARTIE B — SPÉCIFICATIONS DÉTAILLÉES PAR MODULE

---

## MODULE 1 : Import PTAB et Génération du Plan de Passation des Marchés (PPM)

### M1.1 Objectif
Permettre l'import d'un PTAB Excel (structure variable selon les AC), l'analyse par agent IA, la catégorisation, le calcul des modes de passation, la fusion des marchés sous seuil de dispense, et la génération d'un PPM conforme au canevas ARMP (2 feuilles).

### M1.2 Fonctionnalités

**F1.1 — Import PTAB adaptatif**
- Upload de fichiers .xlsx, .xls, .csv
- Détection automatique des feuilles de données (ignorer les feuilles de synthèse)
- Analyse IA des en-têtes pour proposer un mapping des colonnes : code budgétaire, description, imputation, montant (AE/CP), dates, structure responsable, mode d'exécution
- L'utilisateur valide ou corrige le mapping
- Extraction des lignes détaillées uniquement (ignorer les lignes avec formules SUM)
- Stockage des activités PTAB brutes dans `ActivitePtab`

**F1.2 — Catégorisation IA des activités**
- L'agent IAPRMP analyse le libellé de chaque activité et le mode d'exécution (si présent)
- Classification en : TRAVAUX, FOURNITURES, SERVICES, PI_CABINET, PI_INDIVIDUEL
- L'utilisateur peut corriger chaque classification

**F1.3 — Calcul automatique seuils et modes de passation**
- Application du moteur seuils-engine (section A8) à chaque activité
- Détermination : mode passation, organe de contrôle, délai remise, caractère communautaire
- Pour les PI : détermination de la méthode de sélection (SFQC, SPBP, etc.) par l'IA

**F1.4 — Fusion des marchés sous seuil de dispense (≤ 4M FCFA)**
- Regrouper par catégorie + trimestre (ou année si pas de dates)
- Description fusionnée : "Achats divers de [catégorie] — [période] (fusion de X activités sous seuil de dispense)"
- Montant = somme des montants individuels
- Mode = DISPENSE
- Conserver la traçabilité complète (liste des codes budgétaires, montants, imputations)
- Exception : activité seule sans autre de même catégorie/période → pas de fusion

**F1.5 — Détection anti-fractionnement**
- Après génération, vérifier le cumul par catégorie et imputation (section A9)
- Si risque de fractionnement → alerte bloquante avec proposition de fusion en marché unique

**F1.6 — Calcul automatique des dates du chronogramme PPM**
- À partir de la date de lancement souhaitée (proposée par IA ou ajustée par utilisateur)
- Calcul rétroactif et prospectif de toutes les dates (section A6)
- Prise en compte des jours ouvrables et fériés

**F1.7 — Génération du PPM (2 feuilles type ARMP)**
- Feuille 1 "Fournitures, travaux, services" : N°, Réf N, Description, Type (T/F/S), Mode passation, Montant estimatif, Source financement, Imputation, Organe contrôle, AE, + 11 colonnes de dates
- Feuille 2 "Prestations intellectuelles" : N°, Réf N°, Description, Mode (AMI/AMII/DC), Méthode sélection, Montant, Source, Imputation, Organe, AE, + blocs dates AMI et DP
- Export Excel et PDF

**F1.8 — Tableau de bord PPM**
- Taux d'exécution (marchés lancés / planifiés)
- Retards, répartition par catégorie et procédure
- Proportion MPME (Art. 24 al.8)

**F1.9 — Workflow validation PPM**
- Élaboration PRMP → validation CCMP (3j ouv.) → examen conformité DNCMP (4j ouv.) → publication SIGMAP
- Chaque étape = gate bloquante
- Gestion des révisions (historique des versions)

### M1.3 User Stories (7)
US1.1 à US1.7 (voir spécifications fonctionnelles complètes)

### M1.4 Règles métier (8)
RM1.1 à RM1.8 (voir spécifications fonctionnelles complètes)

### M1.5 Contrôles automatiques (6)
- Cohérence montant estimé vs crédits alloués
- Anti-fractionnement par catégorie vs seuils
- Délai 10j post-budget
- Complétude champs obligatoires (Art. 24 al.6)
- Procédure calculée + organe de contrôle affecté à chaque ligne
- Proportion MPME < seuil

### M1.6 Agent IA — Rôle dans Module 1

```
Nom de l'agent : IAPRMP-Planification
Modèle : claude-sonnet-4-20250514
System prompt : Spécialiste PRMP Bénin, expert en PTAB et PPM, connaît les seuils (Décret 2020-599),
les catégories de marchés, les modes de passation.

Tâches :
1. Analyse structure PTAB → mapping colonnes (JSON structuré)
2. Catégorisation activités (travaux/fournitures/services/PI)
3. Décision de fusion (≤ 4M, même catégorie, même période)
4. Méthode de sélection PI (SFQC, SPBP, etc.)
5. Proposition date de lancement réaliste
6. Génération descriptions pour lignes fusionnées

Format réponse : JSON structuré, pas de markdown
```

### M1.7 Entrées / Sorties

| Entrées | Sorties |
|---------|---------|
| Fichier PTAB Excel | PPM complet (Excel 2 feuilles + PDF) |
| Budget approuvé | Avis validation CCMP |
| Référentiel seuils | Avis conformité DNCMP |
| PPM année précédente | PPM publié sur SIGMAP |
| | Rapport trimestriel exécution |
| | Alertes fractionnement |
| | Tableau d'arrimage PTAB↔PPM |

---

## MODULE 2 : Génération automatique des DAO

### M2.1 Objectif
Générer des DAO complets et conformes aux DAO-types ARMP à partir d'une ligne PPM, avec un agent IA spécialiste en rédaction de DAO.

### M2.2 Fonctionnalités

**F2.1 — Wizard de création en 3 étapes**
- Étape 1 (saisie humaine) : spécifications techniques, estimation détaillée, critères d'évaluation (l'IA propose une grille par défaut)
- Étape 2 (génération IA) : assemblage complet du DAO (blocs fixes + variables), pré-remplissage des champs calculés, génération AAO, check-list ARMP
- Étape 3 (revue PRMP) : diff visuel entre DAO généré et DAO-type, modifications possibles uniquement sur sections variables, recalcul automatique des champs dépendants

**F2.2 — Assemblage des blocs fixes (IC + CCAG)**
- Copie intégrale depuis templates stockés en base
- Hash SHA-256 pour vérification d'intégrité
- Blocage de toute modification (système + UI)
- 4 templates : Travaux (531KB), Services (383KB), Fournitures (405KB), Préqualification (116KB)

**F2.3 — Pré-remplissage intelligent DPAO**
- ~45% des ~30 champs calculés automatiquement :
  - Montant garantie soumission : 1-3% montant estimé HT, arrondi au millier inférieur
  - Date limite dépôt : date publication AAO + délai légal (21/30/15j)
  - Validité offres : 90 jours par défaut
  - Marges de préférence : UEMOA 15%, MPME 5%, sous-traitance 10%
  - Organe de contrôle + coordonnées
  - Source de financement et imputation (repris du PPM)

**F2.4 — Génération de l'AAO**
- Conforme Art. 53, Loi 2020-26
- Champs obligatoires remplis automatiquement depuis DPAO et PPM

**F2.5 — Assistance IA pour critères d'évaluation**
- Suggestion de grille pondérée selon catégorie, montant, complexité, historique
- Exemples : fournitures courantes → prix 70%, délai 15%, SAV 15% ; travaux complexes → technique 80%, prix 20%
- Justification de chaque proposition

**F2.6 — Contrôle de complétude (check-list ARMP N°04)**
- Vérification automatique : sections présentes, IC/CCAG non modifiés (hash), garantie 1-3%, pas de marque sans "ou équivalent", cohérence DPAO/CCAP, critères objectifs
- Rapport de conformité avec anomalies et suggestions

**F2.7 — Export multi-format**
- PDF (distribution candidats), DOCX (édition interne), XML/JSON (SIGMAP)
- Formulaires de soumission remplissables

### M2.3 Agent IA — Rôle dans Module 2

```
Nom de l'agent : IAPRMP-DAO
Modèle : claude-sonnet-4-20250514
System prompt : Expert en rédaction de DAO conformes aux DAO-types ARMP Bénin.
Connaît la structure des 4 DAO-types (Travaux, Fournitures, Services, PI).
Maîtrise les sections fixes (IC, CCAG) et variables (DPAO, CCAP, Critères).

Accès en lecture :
- Templates DAO-types (stockés en base)
- Historique des DAO générés par l'AC
- Référentiel seuils et délais

Tâches :
1. Pré-remplissage DPAO (calculs garantie, délais, marges)
2. Suggestion critères d'évaluation (avec justification)
3. Vérification de cohérence spécifications techniques (pas de marque)
4. Génération AAO conforme Art. 53
5. Check-list ARMP N°04
6. Explication de chaque choix automatique (audit trail)

Interdictions :
- Ne JAMAIS modifier IC ou CCAG
- Ne pas accéder aux données confidentielles des soumissionnaires
```

### M2.4 Règles métier (7)
- RM2.1 : DAO-type correspondant au type de marché, IC/CCAG non modifiables
- RM2.2 : DPAO prévalent en cas de contradiction avec IC
- RM2.3 : Soumission DAO 10j ouv. avant date lancement prévue
- RM2.4 : Délai examen OC : 4j DNCMP/DDCMP, 3j CCMP
- RM2.5 : Pas de publication AAO sans BAL (blocage système)
- RM2.6 : Pas de référence à des marques (sauf exception justifiée, Art. 48)
- RM2.7 : DAO mis à disposition gratuitement (Art. 47)

---

## MODULE 3 : Publication et gestion des appels d'offres

### M3.1 Objectif
Publication multi-canal des AAO, suivi des délais, gestion des éclaircissements (anonymisés) et additifs (avec validation OC), registre de retrait des DAO.

### M3.2 Fonctionnalités

**F3.1 — Publication multi-canal automatique**
- Canaux obligatoires : SIGMAP (portail web), JMP, quotidien public ("La Nation")
- Marchés communautaires : UEMOA avant national (Art. 7, Décret 2020-599)
- Marchés internationaux : journal international
- Génération avis au format requis (PDF, XML pour SIGMAP)
- Condition préalable : BAL enregistré (blocage système)

**F3.2 — Calcul et suivi des délais**
- Compte à rebours : 21j (national), 30j (communautaire), 15j (urgence)
- Alertes à J-5 et J-1 (email + notification in-app)
- Prorogation automatique en cas d'additif (+ 5 à 10j)

**F3.3 — Gestion des éclaircissements**
- Formulaire candidat en ligne
- Délai demande : 10j cal. (national) ou 15j (international) avant date limite
- Réponse PRMP : 3j ouvrables, assistée par IA
- Anonymisation automatique
- Diffusion à tous les retraitaires (email + FAQ en ligne)

**F3.4 — Gestion des additifs**
- Workflow : préparation PRMP → validation OC (3/4j) → publication mêmes canaux
- Prorogation automatique du délai si modification substantielle
- Email à tous les retraitaires

**F3.5 — Registre de retrait des DAO**
- Inscription obligatoire pour téléchargement : raison sociale, email, téléphone, horodatage
- Base de diffusion pour éclaircissements et additifs
- Consultable par PRMP et OC, pas par les autres candidats

### M3.3 Agent IA dans Module 3
- Aide rédaction réponses éclaircissements (formulations standardisées)
- Analyse impact additif → estimation prorogation nécessaire
- Détection questions redondantes
- Vérification conformité réponses (neutralité)

---

## MODULE 4 : Réception et ouverture des plis

### M4.1 Objectif
Enregistrement sécurisé des offres avec horodatage infalsifiable, séance d'ouverture publique assistée par tablette, génération PV en temps réel, publication immédiate.

### M4.2 Fonctionnalités

**F4.1 — Registre électronique de réception**
- Numéro d'ordre, date/heure précises (serveur NTP)
- Signature électronique à chaque enregistrement
- Offres hors délai → automatiquement IRRECEVABLE, non ouvertes, retournées
- Stockage sécurisé (chiffrement, accès restreint)

**F4.2 — Interface d'ouverture publique**
- Mode tablette/PC, utilisable en séance
- Vérification quorum (3/5 membres COE) avant démarrage
- Saisie temps réel : nom soumissionnaire, prix (lettres + chiffres), garantie, rabais, pouvoir signataire, accord groupement
- Mode hors ligne avec synchronisation ultérieure

**F4.3 — Génération automatique PV d'ouverture**
- Conforme Art. 70 : date/heure/lieu, liste membres COE, soumissionnaires présents, données chaque offre, quorum, observations
- Format PDF/A (archivage longue durée)
- Signature électronique tous membres COE + représentant OC

**F4.4 — Publication immédiate PV**
- Mêmes canaux que AAO, le jour même
- Copie email à tous soumissionnaires
- Archivage dans dossier numérique (Module 8)

### M4.3 Règles métier (7)
- RM4.1 : Aucune offre après date/heure limite (IRRECEVABLE)
- RM4.2 : Ouverture PUBLIQUE, date/heure/lieu fixés dans DAO
- RM4.3 : AOO → ouverture même avec 1 pli ; AOR → si < 3 plis, nouveau délai 10j cal.
- RM4.4 : Aucun rejet en séance (sauf hors délai)
- RM4.5 : Quorum COE = 3/5 des membres
- RM4.6 : PV mentionne : nom, prix HT/TTC, garantie, rabais
- RM4.7 : Paraphe toutes pages par tous membres COE + représentant OC

---

## MODULE 5 : Évaluation des offres

### M5.1 Objectif
Évaluation en 3 phases (recevabilité, conformité technique, financière + qualification), détection OAB, marges de préférence, génération rapport évaluation + PV attribution provisoire.

### M5.2 Fonctionnalités

**F5.1 — Grille d'évaluation paramétrable**
- Générée depuis critères Section I-C du DAO
- 4 phases : recevabilité → conformité technique → évaluation financière → qualification
- Saisie des notes par les membres COE

**F5.2 — Correction arithmétique semi-automatique**
- Prix unitaire prévaut sur total (sauf virgule)
- Sous-totaux prévalent sur total
- Lettres prévalent sur chiffres
- Si variation > 10% du prix lu → offre écartée (alerte)

**F5.3 — Détection OAB automatique**
- Formule M = 0,80 × (0,6 × Fm + 0,4 × Fc) — calculée après corrections
- Génération automatique lettre de demande de justification
- Suivi des échanges (3-5j ouvrables)

**F5.4 — Calcul marges de préférence**
- UEMOA 15%, MPME 5%, sous-traitance locale 10%
- Application uniquement pour classement (montant marché = offre originale)

**F5.5 — Génération rapport évaluation + PV attribution**
- Format ARMP, toutes phases tracées
- PV : attributaire, montant, motifs rejet chaque offre (Art. 78)
- Signature électronique tous membres COE

**F5.6 — Workflow validation OC**
- Transmission électronique : PV ouverture + offres + rapport + PV attribution
- DNCMP/DDCMP : 5j ouv. ; CCMP : 3j ouv.
- Avis défavorable → reconvocation COE pour réexamen

### M5.3 Règles métier clés
- Critères EXCLUSIVEMENT ceux du DAO (Art. 71-78)
- Quorum 3/5 chaque séance
- Confidentialité absolue avant notification (Art. 72)
- Délai évaluation : 10j ouvrables

### M5.4 Agent IA dans Module 5
- Vérification cohérence notes (pas hors barème)
- Calcul OAB automatique, génération lettre
- Calcul marges de préférence
- Vérification seuil correction 10%
- Suggestion motifs de rejet standardisés
- Contrôle complétude rapport

---

## MODULE 6 : Attribution et notification

### M6.1 Objectif
Notification tous soumissionnaires, standstill, recours, génération projet de marché, workflow signature→approbation (5 gates), authentification, enregistrement fiscal, notification définitive.

### M6.2 Fonctionnalités

**F6.1 — Notification multi-destinataires**
- Lettres générées automatiquement (attributaire + écartés avec motifs individualisés)
- Publication PV attribution provisoire

**F6.2 — Standstill automatique**
- 5j ouv. (travaux/fourn/services) ou 10j cal. (PI)
- Compte à rebours, BLOCAGE TECHNIQUE de la signature

**F6.3 — Gestion des recours**
- Enregistrement horodaté, accusé de réception automatique
- Effet suspensif = gel du workflow
- Délais : réponse PRMP 3j → saisine ARMP 2j → décision ARMP 7j
- Si recours fondé → retour Module 5

**F6.4 — Génération projet de marché**
- 5 exemplaires depuis templates + données DAO + offre retenue
- Aucune négociation en AOO (vérification automatique)
- Mentions obligatoires Art. 83

**F6.5 — Workflow signature → approbation (5 gates)**
1. Signature attributaire (3j ouv.)
2. Signature PRMP (2j ouv.)
3. Examen juridique/technique OC (2j ouv.)
4. Visa budgétaire contrôleur financier (2j ouv.) — uniquement crédits
5. Approbation autorité approbatrice (5j ouv.) — refus uniquement pour absence/insuffisance crédits

**F6.6 — Authentification, enregistrement, notification définitive**
- Authentification/numérotation par OC (3j ouv.)
- Enregistrement fiscal par titulaire (1 mois, rappels)
- Notification définitive (3j cal.)
- Publication avis attribution définitive (15j cal.)

**F6.7 — Surveillance validité des offres**
- Job quotidien vérifiant date d'expiration
- Alerte si risque dépassement → suggestion prorogation (max 45j cal., au-delà avis ARMP)

---

## MODULE 7 : Suivi d'exécution des contrats

### M7.1 Objectif
Gestion complète de l'exécution post-entrée en vigueur : ordres de service, décomptes, avancement, pénalités, avenants, réceptions, garanties, paiements.

### M7.2 Fonctionnalités

**F7.1 — Ordres de service**
- Premier OS le jour de l'entrée en vigueur
- Condition : preuve paiement redevance ARMP (0,5% HT)
- Types : démarrage, arrêt, reprise, modification

**F7.2 — Suivi d'avancement et décomptes**
- Tableau de bord physique + financier en temps réel
- Décomptes mensuels/par étape
- Calcul montant à payer (acomptes, avances, retenues 5%, pénalités)

**F7.3 — Pénalités de retard (job CRON quotidien)**
- Détection retards vs calendrier contractuel
- Mise en demeure 8j cal. préalable
- Taux : 1/5000 à 1/2000 par jour
- Plafond 10% TTC → résiliation de plein droit
- Alerte à 8% (seuil d'alerte)

**F7.4 — Avenants**
- Circuit : PRMP → avis DNCMP → approbation
- Contrôle cumul ≤ 30% du montant initial
- Approbation AVANT début travaux modifiés

**F7.5 — Réceptions**
- Pré-réception technique → réception provisoire (2 sem.) → période garantie → réception définitive
- Génération PV
- Libération garanties : 90% bonne exécution à provisoire, 10% à définitive
- Définitive de plein droit si aucune réserve à l'expiration

**F7.6 — Suivi garanties**
- Bonne exécution (5%), restitution avance, retenue
- Alertes 30j avant expiration
- Libération automatique après réception définitive

**F7.7 — Paiements et intérêts moratoires**
- Délai 60j cal. après réception facture
- Si dépassement → intérêts au taux BCEAO (paramétrable annuellement)
- Mise en demeure 8j préalable

### M7.3 Contrôle sous-traitance
- Plafond 40% valeur globale (Art. 101)
- Agrément sous-traitant par PRMP
- Paiements directs possibles (Art. 115)

---

## MODULE 8 : Archivage et reporting

### M8.1 Objectif
Archivage numérique structuré (10 ans), audit trail immuable, rapports trimestriels, tableaux de bord par rôle, reporting ARMP, statistiques de performance.

### M8.2 Fonctionnalités

**F8.1 — Archivage numérique structuré**
- Dossier unique par marché : documents par phase (planification → exécution)
- Formats : PDF/A, XML, JSON, images OCRisées
- Conservation 10 ans après réception définitive
- Hash SHA-256 pour intégrité
- Recherche plein texte (PostgreSQL FTS)

**F8.2 — Audit trail immuable**
- Table append-only (pas de DELETE/UPDATE)
- Pour chaque action : horodatage, userId, rôle, entité, action, snapshot avant/après (JSON)
- Conservation 10 ans
- Vérification périodique des hash

**F8.3 — Rapports trimestriels PRMP**
- Génération automatique (30j après fin trimestre)
- Contenu Art. 2, Décret 2020-596 : planification, exécution, difficultés
- L'IA propose analyses et mises en évidence
- Export PDF + Excel

**F8.4 — Tableaux de bord personnalisés**
- PRMP : marchés en cours, délais, alertes, taux exécution PPMP
- OC (CCMP/DNCMP) : dossiers en attente, délais traitement
- ARMP : statistiques nationales, conformité par AC, recours, MPME

**F8.5 — Reporting ARMP**
- Extraction format audit annuel (fiches par type procédure)
- Appréciation globale TS/S/PS/NS (calculée par IA)

**F8.6 — Statistiques et indicateurs**
- Délai moyen passation par type procédure
- Taux conformité dossiers
- Nombre recours (taux succès)
- Montant moyen par catégorie
- Proportion MPME
- Taux exécution PPMP
- Délai moyen traitement OC

### M8.3 Purge contrôlée
- Après 10 ans : alerte ARMP + PRMP
- Double validation pour purge
- Log de purge conservé indéfiniment

---

# PARTIE C — GUIDE D'IMPLÉMENTATION AVEC CLAUDE CODE

## C1. Organisation du projet

```
prmp-ia/
├── CLAUDE.md                    # Instructions pour Claude Code
├── package.json
├── prisma/
│   └── schema.prisma            # Schéma complet (voir section A4)
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # Pages auth (login, register)
│   │   ├── (dashboard)/         # Layout dashboard
│   │   │   ├── ppm/             # Module 1 — PPM
│   │   │   ├── dao/             # Module 2 — DAO
│   │   │   ├── publication/     # Module 3 — Publication
│   │   │   ├── ouverture/       # Module 4 — Ouverture
│   │   │   ├── evaluation/      # Module 5 — Évaluation
│   │   │   ├── attribution/     # Module 6 — Attribution
│   │   │   ├── execution/       # Module 7 — Exécution
│   │   │   └── archivage/       # Module 8 — Archivage
│   │   └── api/                 # API Routes
│   ├── lib/
│   │   ├── engines/
│   │   │   ├── seuils-engine.ts       # Moteur de calcul des seuils
│   │   │   ├── delais-engine.ts       # Calcul dates/délais
│   │   │   ├── anti-fractionnement.ts # Détection fractionnement
│   │   │   ├── oab-engine.ts          # Calcul OAB
│   │   │   ├── marges-engine.ts       # Marges de préférence
│   │   │   ├── penalites-engine.ts    # Pénalités de retard
│   │   │   └── interets-engine.ts     # Intérêts moratoires
│   │   ├── ia/
│   │   │   ├── agents/
│   │   │   │   ├── iaprmp-planification.ts  # Agent Module 1
│   │   │   │   ├── iaprmp-dao.ts            # Agent Module 2
│   │   │   │   ├── iaprmp-evaluation.ts     # Agent Module 5
│   │   │   │   ├── iaprmp-attribution.ts    # Agent Module 6
│   │   │   │   └── iaprmp-reporting.ts      # Agent Module 8
│   │   │   └── claude-client.ts       # Client API Claude
│   │   ├── workflow/
│   │   │   ├── workflow-engine.ts     # Moteur de workflow (gates)
│   │   │   ├── ppm-workflow.ts
│   │   │   ├── dao-workflow.ts
│   │   │   ├── evaluation-workflow.ts
│   │   │   ├── attribution-workflow.ts
│   │   │   └── execution-workflow.ts
│   │   ├── auth/
│   │   │   ├── rbac.ts               # Système RBAC (22 rôles)
│   │   │   └── permissions.ts
│   │   ├── generators/
│   │   │   ├── ppm-excel.ts          # Génération PPM Excel
│   │   │   ├── dao-pdf.ts            # Génération DAO PDF
│   │   │   ├── pv-ouverture.ts       # Génération PV
│   │   │   ├── rapport-evaluation.ts
│   │   │   ├── lettres-notification.ts
│   │   │   ├── contrat-marche.ts
│   │   │   ├── ordres-service.ts
│   │   │   └── rapport-trimestriel.ts
│   │   ├── templates/
│   │   │   ├── dao-travaux/          # Template DAO-type travaux
│   │   │   ├── dao-fournitures/
│   │   │   ├── dao-services/
│   │   │   └── dao-pi/
│   │   ├── notifications/
│   │   │   ├── email-service.ts
│   │   │   └── in-app-notifications.ts
│   │   ├── jobs/
│   │   │   ├── penalites-cron.ts     # Calcul quotidien pénalités
│   │   │   ├── validite-offres.ts    # Surveillance validité
│   │   │   ├── garanties-alertes.ts  # Alertes expiration
│   │   │   └── paiements-check.ts    # Vérification délai 60j
│   │   ├── audit/
│   │   │   └── audit-trail.ts        # Middleware audit trail
│   │   └── utils/
│   │       ├── jours-ouvres.ts       # Calcul jours ouvrables
│   │       ├── feries-benin.ts       # Jours fériés
│   │       └── hash.ts              # SHA-256 documents
│   └── components/
│       ├── ui/                      # shadcn/ui components
│       ├── ppm/                     # Composants Module 1
│       ├── dao/                     # Composants Module 2
│       ├── dashboard/               # Tableaux de bord
│       └── workflow/                # Composants workflow
├── tests/
│   ├── engines/                     # Tests moteurs de calcul
│   ├── workflows/                   # Tests workflows
│   └── e2e/                        # Tests end-to-end
└── docs/
    ├── regles-metier.md            # Ce document
    └── api.md                      # Documentation API
```

## C2. Fichier CLAUDE.md pour Claude Code

```markdown
# CLAUDE.md — Instructions pour le développement de PRMP-IA

## Contexte
Application web de gestion des marchés publics au Bénin.
Cadre juridique : Loi N°2020-26, Décrets 2020-595 à 2020-605.
8 modules couvrant le cycle de vie complet d'un marché public.

## Stack
- Next.js 14+ (App Router), React 18, TypeScript strict
- PostgreSQL 16 + Prisma ORM
- TailwindCSS + shadcn/ui
- Claude API (claude-sonnet-4-20250514) pour agents IA
- BullMQ + Redis pour jobs planifiés
- Vitest + Playwright pour tests

## Architecture
- Monorepo Next.js (pas de micro-services)
- Server Components par défaut, Client Components uniquement si interactivité
- tRPC pour les API internes (type-safe)
- Middleware d'audit trail sur toutes les mutations

## Conventions
- TypeScript strict, pas de `any`
- Noms de fichiers en kebab-case
- Composants en PascalCase
- Fonctions utilitaires en camelCase
- Tests obligatoires pour tous les moteurs de calcul (engines)
- Commentaires en français pour les règles métier
- Tous les montants en Decimal (Prisma) / BigInt en JS

## Priorités de développement
1. Schéma Prisma + migrations
2. Moteurs de calcul (seuils, délais, anti-fractionnement, OAB, pénalités)
3. Système RBAC + authentification
4. Module 1 (PPM) — fondation de tout le système
5. Module 2 (DAO) — cœur de l'automatisation
6. Modules 3-6 (publication → attribution) — workflow séquentiel
7. Module 7 (exécution) — post-attribution
8. Module 8 (archivage/reporting) — transversal

## Règles critiques
- JAMAIS modifier les IC ou CCAG des DAO-types
- Tous les délais en jours OUVRABLES (sauf mention "calendaires")
- Anti-fractionnement = blocage système (pas juste une alerte)
- Standstill = blocage technique de la signature
- Recours = gel automatique du workflow (effet suspensif)
- Audit trail = append-only, JAMAIS de DELETE/UPDATE
- Montants toujours en FCFA HT sauf mention contraire
```

## C3. Stratégie d'agents pour Claude Code

### Agent 1 : Architecte / Tech Lead
```
Rôle : Initialiser le projet, créer le schéma Prisma, configurer Next.js,
mettre en place l'authentification RBAC, créer les moteurs de calcul.
Fichiers : prisma/schema.prisma, src/lib/engines/*, src/lib/auth/*
```

### Agent 2 : Backend — Workflows et API
```
Rôle : Implémenter les workflows (gates bloquantes), les API routes,
les jobs planifiés (BullMQ), le middleware d'audit trail.
Fichiers : src/lib/workflow/*, src/app/api/*, src/lib/jobs/*, src/lib/audit/*
```

### Agent 3 : Intégrateur IA — Agents IAPRMP
```
Rôle : Implémenter les agents IA (Claude API), les prompts structurés,
le parsing des réponses JSON, les fallbacks.
Fichiers : src/lib/ia/*
```

### Agent 4 : Frontend — UI/UX
```
Rôle : Créer les pages et composants pour chaque module,
les tableaux de bord, les formulaires, le wizard DAO.
Fichiers : src/app/(dashboard)/*, src/components/*
```

### Agent 5 : Générateur de documents
```
Rôle : Implémenter la génération des documents (PPM Excel, DAO PDF,
PV, rapports, lettres, contrats) avec les templates.
Fichiers : src/lib/generators/*, src/lib/templates/*
```

## C4. Comment lancer le développement sur Claude Code

### Étape 1 : Préparer le workspace
```bash
# Créer le projet
npx create-next-app@latest prmp-ia --typescript --tailwind --eslint --app --src-dir
cd prmp-ia

# Installer les dépendances
npm install prisma @prisma/client next-auth@beta
npm install bullmq ioredis
npm install exceljs docx pdfkit
npm install zod @trpc/server @trpc/client @trpc/next
npm install -D vitest @playwright/test

# Copier le fichier CLAUDE.md à la racine
# Copier le schéma Prisma
# Copier ce cahier des charges dans docs/
```

### Étape 2 : Lancer Claude Code avec le bon contexte
```bash
claude code

# Puis donner l'instruction :
> Lis CLAUDE.md et docs/cahier-des-charges-prmp-ia.md.
> Commence par initialiser le schéma Prisma complet (section A4),
> puis implémente les moteurs de calcul (seuils-engine, delais-engine,
> anti-fractionnement) avec leurs tests unitaires.
```

### Étape 3 : Développement itératif par module
```
Session 1 : Schéma Prisma + migrations + seed data
Session 2 : Moteurs de calcul + tests
Session 3 : RBAC + auth
Session 4 : Module 1 — Import PTAB + génération PPM
Session 5 : Module 2 — Génération DAO (wizard 3 étapes)
Session 6 : Modules 3-4 — Publication + ouverture
Session 7 : Module 5 — Évaluation
Session 8 : Module 6 — Attribution (workflow complet)
Session 9 : Module 7 — Exécution (pénalités, avenants)
Session 10 : Module 8 — Archivage + reporting
```

## C5. Tests critiques à couvrir

```
1. Moteur de seuils :
   - Travaux 50M → DRP, CCMP
   - Fournitures 80M → AOO, vérifier si DNCMP ou CCMP selon type AC
   - PI individuel 25M → AOO, vérifier organe

2. Anti-fractionnement :
   - 5 fournitures de 15M même catégorie = 75M > 70M → ALERTE
   - 3 fournitures de 15M, 2 services de 15M → pas d'alerte (catégories différentes)

3. Fusion sous seuil :
   - 3 fournitures de 2M en Q1 → 1 ligne "Achats divers fournitures Q1 (3 activités)" = 6M → DC
   - 1 fourniture de 3M seule en Q2 → pas de fusion, reste DISPENSE

4. Calcul OAB :
   - 5 offres : 100M, 90M, 85M, 80M, 50M. Estimation AC : 95M
   - Fm = 81M, Fc = 95M, M = 0.80 × (0.6×81 + 0.4×95) = 0.80 × 86.6 = 69.28M
   - L'offre de 50M < 69.28M → OAB

5. Pénalités :
   - Marché 100M TTC, taux 1/3000, 15j retard après mise en demeure
   - Pénalité = 100M × (1/3000) × 15 = 500 000 FCFA
   - Cumul 9.5M + 500K = 10M = 10% → RÉSILIATION

6. Standstill :
   - Vérifier qu'une tentative de signature pendant le standstill est bloquée
   - Vérifier que le gel s'active automatiquement en cas de recours

7. Délais :
   - Date publication 1er mars → date limite national = 22 mars (21j cal.)
   - Si 22 mars = jour férié → vérifier la règle applicable
```

---

# PARTIE D — SYNTHÈSE CHIFFRÉE GLOBALE

| Module | Fonctionnalités | User Stories | Règles métier | Contrôles auto |
|--------|----------------|-------------|---------------|----------------|
| M1 — Planification/PPM | 9 | 7 | 8 | 6 |
| M2 — Génération DAO | 7 | 7 | 7 | 6 |
| M3 — Publication | 5 | 5 | 6 | 6 |
| M4 — Réception/Ouverture | 4 | 5 | 7 | 5 |
| M5 — Évaluation | 6 | 6 | 7 | 7 |
| M6 — Attribution | 7 | 8 | 10 | 8 |
| M7 — Suivi exécution | 7 | 6 | 8 | 7 |
| M8 — Archivage/Reporting | 6 | 5 | 5 | 6 |
| **TOTAL** | **51** | **49** | **58** | **51** |

**Agents IA** : 5 agents spécialisés (Planification, DAO, Évaluation, Attribution, Reporting)
**Rôles RBAC** : 22 rôles
**Jobs planifiés** : 4 (pénalités, validité offres, garanties, paiements)
**Moteurs de calcul** : 7 (seuils, délais, anti-fractionnement, OAB, marges, pénalités, intérêts)
**Générateurs de documents** : 8 (PPM Excel, DAO PDF, PV ouverture, rapport évaluation, lettres notification, contrat, OS, rapport trimestriel)
