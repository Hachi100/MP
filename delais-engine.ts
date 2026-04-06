/**
 * delais-engine.ts — Moteur de calcul des chronogrammes PPM
 *
 * Couvre les deux feuilles du canevas ARMP :
 *   • FTS : Fournitures, Travaux, Services → 13 dates (colonnes K–W)
 *   • PI  : Prestations Intellectuelles    → 27 dates (colonnes K–AK)
 *
 * Règles dérivées de :
 *   - Décret 2020-600 (délais impartis aux organes)
 *   - Manuel de procédures ARMP 2023
 *   - Analyse empirique du PPM SAB 2026 (données réelles)
 *
 * CONVENTION :
 *   - "j.ouv"  = jours ouvrables (lundi–vendredi, hors fériés Bénin)
 *   - "j.cal"  = jours calendaires
 *   - Tous les calculs partent de `dateLancement` (date de publication de l'avis)
 *     puis propagent rétroactivement (avant) et prospectivement (après).
 */

import {
  ajouterJoursOuvrables,
  retirerJoursOuvrables,
  ajouterJoursCalendaires,
  retirerJoursCalendaires,
} from "./jours-ouvres";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

/** Organe de contrôle */
export type OrganeControle = "CCMP" | "DDCMP" | "DNCMP";

/** Mode de passation FTS */
export type ModePassationFTS =
  | "AOO_NATIONAL"
  | "AOO_INTERNATIONAL"
  | "AOR"
  | "DRP"
  | "DC"
  | "MED"
  | "DISPENSE";

/** Mode de passation PI */
export type ModePassationPI = "AMI" | "AMII" | "DRP" | "DC";

/** Méthode de sélection PI */
export type MethodeSelectionPI =
  | "SFQC"
  | "SPBP"
  | "SFBD"
  | "QT"
  | "CI"
  | "DP"
  | "SED";

// ─── Résultats ───

/**
 * 13 dates de la feuille 1 « Fournitures, Travaux, Services »
 * Colonnes K à W du canevas ARMP.
 */
export interface ChronogrammeFTS {
  /** K  — Date de réception du Dossier par l'Organe de contrôle */
  receptionDossierOC: Date;
  /** L  — Date de réception de l'avis de non objection de l'OC */
  avisNonObjectionOC: Date;
  /** M  — Date de l'avis de non objection du PTF (null si pas de PTF) */
  avisNonObjectionPTF: Date | null;
  /** N  — Date de réception du dossier corrigé pour le BON À LANCER */
  dossierCorrigeBal: Date;
  /** O  — Date d'autorisation du lancement du DAO */
  autorisationLancement: Date;
  /** P  — Date de publication de l'avis par la PRMP */
  publicationAvis: Date;
  /** Q  — Date d'ouverture des plis */
  ouverturePlis: Date;
  /** R  — Date de réception des rapports d'évaluation par l'OC */
  receptionRapportEvalOC: Date;
  /** S  — Date de réception de l'avis de non objection de l'OC (évaluation) */
  avisNonObjectionOCEval: Date;
  /** T  — Date de réception de l'avis de non objection du PTF (évaluation) */
  avisNonObjectionPTFEval: Date | null;
  /** U  — Date d'examen juridique du contrat par l'OC */
  examenJuridique: Date;
  /** V  — Date d'approbation du contrat */
  approbation: Date;
  /** W  — Date de notification du contrat */
  notification: Date;
}

/**
 * 27 dates de la feuille 2 « Prestations Intellectuelles »
 * Colonnes K à AK du canevas ARMP.
 *
 * 5 blocs : AMI (10 dates) · DP (6 dates) · Éval technique (4) · Éval financière (4) · Signature (3)
 */
export interface ChronogrammePI {
  // ── BLOC AMI (colonnes K–T) ──
  /** K  — Date de réception de l'AMI par l'Organe de contrôle */
  ami_receptionOC: Date;
  /** L  — Date de réception de l'avis de non objection de l'OC (AMI) */
  ami_avisOC: Date;
  /** M  — Date de l'avis de non objection du PTF (AMI) */
  ami_avisPTF: Date | null;
  /** N  — Date de réception du dossier corrigé pour le BON À LANCER (AMI) */
  ami_balCorrige: Date;
  /** O  — Date d'autorisation du lancement de l'AMI */
  ami_autorisationLancement: Date;
  /** P  — Date de publication de l'avis à manifestation d'intérêt */
  ami_publication: Date;
  /** Q  — Date d'ouverture des plis de l'AMI */
  ami_ouverturePlis: Date;
  /** R  — Date de réception des rapports d'évaluation de l'AMI par l'OC */
  ami_rapportEvalOC: Date;
  /** S  — Date de réception de l'avis de non objection de l'OC (évaluation AMI) */
  ami_avisOCEval: Date;
  /** T  — Date de réception de l'avis de non objection du PTF (évaluation AMI) */
  ami_avisPTFEval: Date | null;

  // ── BLOC DP (colonnes U–Z) ──
  /** U  — Date de réception de la DP par l'Organe de contrôle */
  dp_receptionOC: Date;
  /** V  — Date de réception de l'avis de non objection de l'OC (DP) */
  dp_avisOC: Date;
  /** W  — Date de l'avis de non objection du PTF (DP) */
  dp_avisPTF: Date | null;
  /** X  — Date de réception du dossier corrigé pour le BON À LANCER (DP) */
  dp_balCorrige: Date;
  /** Y  — Date d'autorisation du lancement de la DP */
  dp_autorisationLancement: Date;
  /** Z  — Date d'invitation à la soumission */
  dp_invitation: Date;

  // ── BLOC ÉVALUATION TECHNIQUE (colonnes AA–AD) ──
  /** AA — Date d'ouverture des offres techniques */
  evalTech_ouverture: Date;
  /** AB — Date de réception des résultats par l'organe de contrôle (technique) */
  evalTech_rapportOC: Date;
  /** AC — Date de réception de l'avis de non objection de l'OC (technique) */
  evalTech_avisOC: Date;
  /** AD — Date de réception de l'avis de non objection du PTF (technique) */
  evalTech_avisPTF: Date | null;

  // ── BLOC ÉVALUATION FINANCIÈRE (colonnes AE–AH) ──
  /** AE — Date d'ouverture des offres financières */
  evalFin_ouverture: Date;
  /** AF — Date de réception des résultats par l'organe de contrôle (financier) */
  evalFin_rapportOC: Date;
  /** AG — Date de réception de l'avis de non objection de l'OC (financier) */
  evalFin_avisOC: Date;
  /** AH — Date de réception de l'avis de non objection du PTF (financier) */
  evalFin_avisPTF: Date | null;

  // ── BLOC SIGNATURE (colonnes AI–AK) ──
  /** AI — Date d'examen juridique du contrat par l'organe de contrôle */
  signature_examenJuridique: Date;
  /** AJ — Date d'approbation du contrat */
  signature_approbation: Date;
  /** AK — Date de notification du contrat */
  signature_notification: Date;
}

// ─────────────────────────────────────────────────
// Paramètres de délais
// ─────────────────────────────────────────────────

/**
 * Délai d'examen de l'organe de contrôle (jours ouvrables)
 * Décret 2020-600, art. 3
 */
function delaiExamenOC(oc: OrganeControle): number {
  switch (oc) {
    case "CCMP":
      return 3; // 3 j. ouvrables
    case "DDCMP":
    case "DNCMP":
      return 4; // 4 j. ouvrables (DNCMP = 5j pour évaluation, 4j pour DAO)
  }
}

/**
 * Délai d'examen de l'OC pour les rapports d'évaluation (j. ouvrables)
 * Art. 78, Décret 2020-600
 */
function delaiExamenOCEval(oc: OrganeControle): number {
  switch (oc) {
    case "CCMP":
      return 3;
    case "DDCMP":
    case "DNCMP":
      return 5; // 5 j. ouvrables pour rapports d'évaluation
  }
}

/**
 * Délai minimum de remise des offres (jours calendaires)
 * Art. 54, Loi 2020-26
 */
function delaiRemiseOffres(
  mode: ModePassationFTS | ModePassationPI,
  estCommunautaire: boolean,
  estUrgence: boolean
): number {
  if (estUrgence) return 15;
  if (estCommunautaire || mode === "AOO_INTERNATIONAL" || mode === "AMII")
    return 30;
  if (mode === "DRP") return 10; // Délai DRP (manuel ARMP)
  if (mode === "DC") return 5; // Délai DC (court)
  return 21; // AOO national, AMI
}

/**
 * Délai de soumission des propositions PI après invitation (jours calendaires)
 * Manuel ARMP, délais observés sur PPM SAB
 */
function delaiSoumissionPropositionsPI(
  mode: ModePassationPI,
  estInternational: boolean
): number {
  if (estInternational) return 30; // AMII
  if (mode === "AMI") return 21; // AMI national : 21j observé (PPM SAB)
  return 14; // DRP/DC : 14j observé
}

// ─────────────────────────────────────────────────
// CHRONOGRAMME FTS — 13 dates
// ─────────────────────────────────────────────────

export interface ParametresFTS {
  /** Date souhaitée de publication de l'avis (= date de lancement) */
  dateLancement: Date;
  mode: ModePassationFTS;
  organeControle: OrganeControle;
  estCommunautaire: boolean;
  estUrgence?: boolean;
  /** Y a-t-il un PTF (bailleur) impliqué ? */
  avecPTF?: boolean;
}

/**
 * Calcule les 13 dates du chronogramme FTS (feuille 1 du PPM).
 *
 * Stratégie :
 *   1. `publicationAvis` = dateLancement (donnée d'entrée = P)
 *   2. On calcule rétroactivement : O, N, (M), L, K
 *   3. On calcule prospectivement : Q, R, S, (T), U, V, W
 */
export function calculerChronogrammeFTS(
  params: ParametresFTS
): ChronogrammeFTS {
  const { dateLancement, mode, organeControle, estCommunautaire, avecPTF } =
    params;
  const estUrgence = params.estUrgence ?? false;
  const delaiOC = delaiExamenOC(organeControle);
  const delaiOCEval = delaiExamenOCEval(organeControle);
  const delaiRemise = delaiRemiseOffres(mode, estCommunautaire, estUrgence);

  // ─── P : date de publication de l'avis ───
  const P = dateLancement;

  // ─── RÉTROACTIF (avant la publication) ───

  // O = P − 1j ouv (autorisation lancement)
  const O = retirerJoursOuvrables(P, 1);

  // N = O − 1j ouv (dossier corrigé pour BAL)
  //     Pour MED : N = O (même jour, pas de correction)
  const N = mode === "MED" ? O : retirerJoursOuvrables(O, 1);

  // M = avis PTF (si applicable), sinon = L
  // L = N − délaiOC j. ouv (avis non objection de l'OC)
  const L = retirerJoursOuvrables(N, delaiOC);
  const M = avecPTF ? L : null;

  // K = L − 0j (réception dossier = même jour que début d'examen)
  //     En réalité K = date de transmission du DAO à l'OC
  //     Manuel p.56 : le DAO doit être transmis 10j ouv. avant lancement
  //     Mais dans le PPM SAB, K ≈ L pour les DC/MED (examen rapide)
  //     Pour AOO/DRP : K = L − 0j (l'OC commence l'examen dès réception)
  const K = retirerJoursOuvrables(L, 0); // K = L (début examen)

  // ─── PROSPECTIF (après la publication) ───

  // Q = P + délaiRemise j.cal (ouverture des plis)
  const Q = ajouterJoursCalendaires(P, delaiRemise);

  // R = Q + 10 j.ouv (évaluation COE → rapport transmis à l'OC)
  //     Manuel p.61 : délai d'évaluation = 10 j. ouvrables
  //     Pour DC : 5j ouv (procédure simplifiée observée)
  const delaiEval = mode === "DC" || mode === "DISPENSE" ? 3 : 10;
  const R = ajouterJoursOuvrables(Q, delaiEval);

  // S = R + délaiOCEval j.ouv (avis OC sur évaluation)
  const S = ajouterJoursOuvrables(R, delaiOCEval);

  // T = avis PTF évaluation (si applicable)
  const T = avecPTF ? S : null;

  // U = S + 2 j.ouv (examen juridique du contrat par l'OC)
  //     Décret 2020-600 : 2 j. ouvrables
  const U = ajouterJoursOuvrables(S, 2);

  // V = U + 5 j.ouv (approbation)
  //     Art. 85 : 5 j. ouvrables
  //     Pour DC : 2j ouv (observé PPM SAB)
  const delaiApprobation = mode === "DC" ? 2 : 5;
  const V = ajouterJoursOuvrables(U, delaiApprobation);

  // W = V + 3 j.cal (notification définitive)
  //     Art. 86 : 3 j. calendaires
  const W = ajouterJoursCalendaires(V, 2);

  return {
    receptionDossierOC: K,
    avisNonObjectionOC: L,
    avisNonObjectionPTF: M,
    dossierCorrigeBal: N,
    autorisationLancement: O,
    publicationAvis: P,
    ouverturePlis: Q,
    receptionRapportEvalOC: R,
    avisNonObjectionOCEval: S,
    avisNonObjectionPTFEval: T,
    examenJuridique: U,
    approbation: V,
    notification: W,
  };
}

// ─────────────────────────────────────────────────
// CHRONOGRAMME PI — 27 dates
// ─────────────────────────────────────────────────

export interface ParametresPI {
  /** Date souhaitée de publication de l'AMI (= date de lancement phase 1) */
  dateLancementAMI: Date;
  mode: ModePassationPI;
  methodeSelection: MethodeSelectionPI;
  organeControle: OrganeControle;
  estInternational: boolean;
  /** Y a-t-il un PTF (bailleur) impliqué ? */
  avecPTF?: boolean;
}

/**
 * Calcule les 27 dates du chronogramme PI (feuille 2 du PPM).
 *
 * Flux en 5 blocs séquentiels :
 *   1. AMI  : K→T  (10 dates) — Manifestation d'intérêt + présélection
 *   2. DP   : U→Z  (6 dates)  — Demande de Propositions aux présélectionnés
 *   3. EVAL TECH : AA→AD (4 dates) — Ouverture et évaluation technique
 *   4. EVAL FIN  : AE→AH (4 dates) — Ouverture et évaluation financière
 *   5. SIGNATURE : AI→AK (3 dates) — Examen juridique, approbation, notification
 *
 * Point d'entrée : `dateLancementAMI` = date de publication de l'AMI (= P)
 *
 * Délais dérivés empiriquement du PPM SAB 2026 + textes réglementaires :
 *
 *   PHASE AMI :
 *     K→L : delaiOC j.ouv (examen OC de l'AMI)
 *     L→M : 0j (PTF simultané)
 *     M→N : 2j ouv (correction/BAL)
 *     N→O : 1j ouv (autorisation)
 *     O→P : 1j ouv (publication effective)
 *     P→Q : 12j cal (délai manifestation d'intérêt — Art. 64 Loi 2020-26)
 *     Q→R : 7j ouv (évaluation AMI, COE — shortlisting)
 *     R→S : delaiOCEval j.ouv (avis OC sur évaluation AMI)
 *     S→T : 0j (PTF)
 *
 *   PHASE DP :
 *     T→U : 10j cal (préparation de la DP par la PRMP)
 *     U→V : delaiOC j.ouv (examen OC de la DP)
 *     V→W : 0j (PTF)
 *     W→X : 2j ouv (correction/BAL)
 *     X→Y : 1j ouv (autorisation)
 *     Y→Z : 2j ouv (envoi des invitations aux consultants présélectionnés)
 *
 *   ÉVALUATION TECHNIQUE :
 *     Z→AA : delaiSoumission j.cal (21j AMI / 14j DRP / 30j AMII)
 *     AA→AB : 14j cal (évaluation technique par la COE)
 *     AB→AC : delaiOCEval j.ouv (avis OC)
 *     AC→AD : 0j (PTF)
 *
 *   ÉVALUATION FINANCIÈRE :
 *     AD→AE : 12j cal (notification résultats tech → ouverture financière)
 *     AE→AF : 14j cal (évaluation financière + négociation SFQC)
 *     AF→AG : delaiOCEval j.ouv (avis OC)
 *     AG→AH : 0j (PTF)
 *
 *   SIGNATURE :
 *     AH→AI : 3j ouv (examen juridique — Décret 2020-600)
 *     AI→AJ : 5j ouv (approbation — Art. 85)
 *     AJ→AK : 3j cal (notification définitive)
 */
export function calculerChronogrammePI(
  params: ParametresPI
): ChronogrammePI {
  const {
    dateLancementAMI,
    mode,
    methodeSelection,
    organeControle,
    estInternational,
    avecPTF,
  } = params;

  const delaiOC = delaiExamenOC(organeControle);
  const delaiOCEval = delaiExamenOCEval(organeControle);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BLOC 1 — PHASE AMI (K→T, 10 dates)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // P = date de publication AMI (point d'ancrage)
  const P = dateLancementAMI;

  // Rétroactif : P → O → N → (M) → L → K
  const O = retirerJoursOuvrables(P, 1);   // O = P − 1j ouv
  const N = retirerJoursOuvrables(O, 1);   // N = O − 1j ouv
  const L = retirerJoursOuvrables(N, 2);   // L = N − 2j ouv (correction BAL)
  const M = avecPTF ? L : null;            // M = L (PTF simultané)
  const K = retirerJoursOuvrables(L, delaiOC); // K = L − delaiOC j.ouv

  // Prospectif : P → Q → R → S → T
  // Délai manifestation d'intérêt : 12j cal (national) ou 21j cal (international)
  const delaiMI = estInternational ? 21 : 12;
  const Q = ajouterJoursCalendaires(P, delaiMI);

  // Évaluation AMI (présélection / shortlisting)
  // AMI complet → 14j cal ; DRP/DC → 7j cal
  const delaiEvalAMI = mode === "AMI" || mode === "AMII" ? 14 : 7;
  const R = ajouterJoursCalendaires(Q, delaiEvalAMI);

  // Avis OC sur évaluation AMI
  const S = ajouterJoursOuvrables(R, delaiOCEval);
  const T = avecPTF ? S : null;

  // La date effective de fin de la phase AMI (pour enchaîner)
  const finPhaseAMI = S; // T = S si pas de PTF

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BLOC 2 — PHASE DP (U→Z, 6 dates)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // U = fin AMI + 10j cal (préparation de la Demande de Propositions)
  const U = ajouterJoursCalendaires(finPhaseAMI, 10);

  // V = U + delaiOC j.ouv (examen OC de la DP)
  const V = ajouterJoursOuvrables(U, delaiOC);
  const W = avecPTF ? V : null;

  // X = V + 2j ouv (correction / BAL DP)
  const X = ajouterJoursOuvrables(V, 2);

  // Y = X + 1j ouv (autorisation lancement DP)
  const Y = ajouterJoursOuvrables(X, 1);

  // Z = Y + 2j ouv (envoi des invitations à soumissionner)
  const Z = ajouterJoursOuvrables(Y, 2);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BLOC 3 — ÉVALUATION TECHNIQUE (AA→AD, 4 dates)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // AA = Z + délai de soumission des propositions (j.cal)
  //   AMI national → 21j ; AMII → 30j ; DRP → 14j ; DC → 7j
  const delaiSoumission = delaiSoumissionPropositionsPI(
    mode,
    estInternational
  );
  const AA = ajouterJoursCalendaires(Z, delaiSoumission);

  // AB = AA + 14j cal (évaluation technique par la COE)
  //   Pour CI/DC : 7j (procédure simplifiée)
  const delaiEvalTech =
    methodeSelection === "CI" || mode === "DC" ? 7 : 14;
  const AB = ajouterJoursCalendaires(AA, delaiEvalTech);

  // AC = AB + delaiOCEval j.ouv (avis OC évaluation technique)
  const AC = ajouterJoursOuvrables(AB, delaiOCEval);
  const AD = avecPTF ? AC : null;

  const finEvalTech = AC;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BLOC 4 — ÉVALUATION FINANCIÈRE (AE→AH, 4 dates)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // AE = fin éval tech + 12j cal (notification des résultats techniques
  //   aux consultants → convocation ouverture offres financières)
  //   Observé : 12j constants dans le PPM SAB
  const AE = ajouterJoursCalendaires(finEvalTech, 12);

  // AF = AE + 14j cal (évaluation financière + négociation si SFQC)
  //   Pour CI/DC : 7j
  const delaiEvalFin =
    methodeSelection === "CI" || mode === "DC" ? 7 : 14;
  const AF = ajouterJoursCalendaires(AE, delaiEvalFin);

  // AG = AF + delaiOCEval j.ouv (avis OC évaluation financière)
  const AG = ajouterJoursOuvrables(AF, delaiOCEval);
  const AH = avecPTF ? AG : null;

  const finEvalFin = AG;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BLOC 5 — SIGNATURE (AI→AK, 3 dates)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // AI = fin éval fin + 3j ouv (examen juridique — Décret 2020-600)
  const AI = ajouterJoursOuvrables(finEvalFin, 3);

  // AJ = AI + 5j ouv (approbation — Art. 85)
  //   Pour DC : 3j ouv
  const delaiApprobPI = mode === "DC" ? 3 : 5;
  const AJ = ajouterJoursOuvrables(AI, delaiApprobPI);

  // AK = AJ + 3j cal (notification définitive)
  const AK = ajouterJoursCalendaires(AJ, 3);

  return {
    // Phase AMI
    ami_receptionOC: K,
    ami_avisOC: L,
    ami_avisPTF: M,
    ami_balCorrige: N,
    ami_autorisationLancement: O,
    ami_publication: P,
    ami_ouverturePlis: Q,
    ami_rapportEvalOC: R,
    ami_avisOCEval: S,
    ami_avisPTFEval: T,
    // Phase DP
    dp_receptionOC: U,
    dp_avisOC: V,
    dp_avisPTF: W,
    dp_balCorrige: X,
    dp_autorisationLancement: Y,
    dp_invitation: Z,
    // Évaluation technique
    evalTech_ouverture: AA,
    evalTech_rapportOC: AB,
    evalTech_avisOC: AC,
    evalTech_avisPTF: AD,
    // Évaluation financière
    evalFin_ouverture: AE,
    evalFin_rapportOC: AF,
    evalFin_avisOC: AG,
    evalFin_avisPTF: AH,
    // Signature
    signature_examenJuridique: AI,
    signature_approbation: AJ,
    signature_notification: AK,
  };
}

// ─────────────────────────────────────────────────
// Conversion vers tableau PPM (pour export Excel)
// ─────────────────────────────────────────────────

/** Convertit un ChronogrammeFTS en tableau ordonné de 13 dates (colonnes K→W) */
export function chronogrammeFTSToArray(
  c: ChronogrammeFTS
): (Date | null)[] {
  return [
    c.receptionDossierOC,
    c.avisNonObjectionOC,
    c.avisNonObjectionPTF,
    c.dossierCorrigeBal,
    c.autorisationLancement,
    c.publicationAvis,
    c.ouverturePlis,
    c.receptionRapportEvalOC,
    c.avisNonObjectionOCEval,
    c.avisNonObjectionPTFEval,
    c.examenJuridique,
    c.approbation,
    c.notification,
  ];
}

/** Convertit un ChronogrammePI en tableau ordonné de 27 dates (colonnes K→AK) */
export function chronogrammePIToArray(
  c: ChronogrammePI
): (Date | null)[] {
  return [
    // AMI (K→T)
    c.ami_receptionOC,
    c.ami_avisOC,
    c.ami_avisPTF,
    c.ami_balCorrige,
    c.ami_autorisationLancement,
    c.ami_publication,
    c.ami_ouverturePlis,
    c.ami_rapportEvalOC,
    c.ami_avisOCEval,
    c.ami_avisPTFEval,
    // DP (U→Z)
    c.dp_receptionOC,
    c.dp_avisOC,
    c.dp_avisPTF,
    c.dp_balCorrige,
    c.dp_autorisationLancement,
    c.dp_invitation,
    // Éval technique (AA→AD)
    c.evalTech_ouverture,
    c.evalTech_rapportOC,
    c.evalTech_avisOC,
    c.evalTech_avisPTF,
    // Éval financière (AE→AH)
    c.evalFin_ouverture,
    c.evalFin_rapportOC,
    c.evalFin_avisOC,
    c.evalFin_avisPTF,
    // Signature (AI→AK)
    c.signature_examenJuridique,
    c.signature_approbation,
    c.signature_notification,
  ];
}

// ─────────────────────────────────────────────────
// En-têtes pour export Excel
// ─────────────────────────────────────────────────

export const HEADERS_FTS = [
  "Date de réception du Dossier par l'Organe de contrôle",
  "Date de réception de l'avis de non objection de l'Organe de contrôle",
  "Date de l'avis de non objection du PTF",
  "Date de réception du dossier corrigé pour le BON A LANCER",
  "Date d'autorisation du lancement du DAO",
  "Date de publication de l'avis par la PRMP",
  "Date d'ouverture des plis",
  "Date de réception des rapports d'évaluation des offres par l'organe de contrôle",
  "Date de réception de l'avis de non objection de l'organe de contrôle",
  "Date de réception de l'avis de non objection du PTF",
  "Date d'examen juridique du contrat par l'organe de contrôle",
  "Date d'approbation du contrat",
  "Date de notification du contrat",
] as const;

export const HEADERS_PI = [
  // AMI
  "Date de réception de l'AMI par l'Organe de contrôle",
  "Date de réception de l'avis de non objection de l'Organe de contrôle",
  "Date de l'avis de non objection du PTF",
  "Date de réception du dossier corrigé pour le BON A LANCER",
  "Date d'autorisation du lancement l'AMI",
  "Date de publication de l'avis à manifestation d'intérêt par la PRMP",
  "Date d'ouverture des plis de l'AMI",
  "Date de réception des rapports d'évaluation de l'AMI par l'organe de contrôle",
  "Date de réception de l'avis de non objection de l'organe de contrôle",
  "Date de réception de l'avis de non objection du PTF",
  // DP
  "Date de réception de la DP par l'Organe de contrôle",
  "Date de réception de l'avis de non objection de l'Organe de contrôle",
  "Date de l'avis de non objection du PTF",
  "Date de réception du dossier corrigé pour le BON A LANCER",
  "Date d'autorisation du lancement de la DP",
  "Date d'invitation à la soumission",
  // Éval technique
  "Date d'ouverture des offres techniques",
  "Date de réception des résultats par l'organe de contrôle",
  "Date de réception de l'avis de non objection de l'organe de contrôle",
  "Date de réception de l'avis de non objection du PTF",
  // Éval financière
  "Date d'ouverture des offres financières",
  "Date de réception des résultats par l'organe de contrôle",
  "Date de réception de l'avis de non objection de l'organe de contrôle",
  "Date de réception de l'avis de non objection du PTF",
  // Signature
  "Date d'examen juridique du contrat par l'organe de contrôle",
  "Date d'approbation du contrat",
  "Date de notification du contrat",
] as const;

/**
 * Groupes d'en-têtes pour la ligne de fusion (row 10 du canevas ARMP).
 * Utilisé par le générateur Excel pour créer les cellules fusionnées.
 */
export const HEADER_GROUPS_FTS = [
  { label: "", cols: 3 }, // N°, Réf, Description
  { label: "DONNÉES DE BASES", cols: 7 }, // D→J
  { label: "DOSSIER D'APPEL D'OFFRES", cols: 6 }, // K→P
  { label: "ÉVALUATION DES OFFRES", cols: 4 }, // Q→T
  { label: "SIGNATURE DE CONTRAT", cols: 3 }, // U→W
] as const;

export const HEADER_GROUPS_PI = [
  { label: "", cols: 3 }, // N°, Réf, Description
  { label: "DONNÉES DE BASES", cols: 7 }, // D→J
  { label: "AMI", cols: 10 }, // K→T
  { label: "ÉVALUATION DES OFFRES (AMI)", cols: 0 }, // (vide, inclus dans AMI)
  { label: "DP", cols: 6 }, // U→Z
  { label: "ÉVALUATION DES OFFRES TECHNIQUES", cols: 4 }, // AA→AD
  { label: "ÉVALUATION DES PROPOSITIONS FINANCIÈRES", cols: 4 }, // AE→AH
  { label: "SIGNATURE DE CONTRAT", cols: 3 }, // AI→AK
] as const;

// ─────────────────────────────────────────────────
// Calcul de la durée totale estimée
// ─────────────────────────────────────────────────

/** Durée totale en jours calendaires du chronogramme FTS (de K à W) */
export function dureeTotaleFTS(c: ChronogrammeFTS): number {
  return Math.ceil(
    (c.notification.getTime() - c.receptionDossierOC.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

/** Durée totale en jours calendaires du chronogramme PI (de K à AK) */
export function dureeTotalePI(c: ChronogrammePI): number {
  return Math.ceil(
    (c.signature_notification.getTime() -
      c.ami_receptionOC.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}
