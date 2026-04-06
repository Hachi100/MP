/**
 * Moteur de calcul des délais — Chronogramme PPM
 * Calcule les dates du chronogramme en jours ouvrables
 * en tenant compte des jours fériés au Bénin
 */

import { addDays, isWeekend, isSameDay, format } from "date-fns"
import { fr } from "date-fns/locale"

// Jours fériés fixes au Bénin
const JOURS_FERIES_FIXES = [
  { mois: 1, jour: 1, nom: "Jour de l'An" },
  { mois: 1, jour: 10, nom: "Fête du Vodoun" },
  { mois: 5, jour: 1, nom: "Fête du Travail" },
  { mois: 8, jour: 1, nom: "Fête de l'Indépendance" },
  { mois: 8, jour: 15, nom: "Assomption" },
  { mois: 10, jour: 26, nom: "Journée des Forces Armées" },
  { mois: 11, jour: 1, nom: "Toussaint" },
  { mois: 12, jour: 25, nom: "Noël" },
] as const

/**
 * Retourne la liste des jours fériés pour une année donnée
 * Inclut les fériés fixes + les fériés mobiles (Pâques, etc.)
 */
export function getJoursFeries(annee: number): Date[] {
  const feries: Date[] = []

  // Fériés fixes
  for (const f of JOURS_FERIES_FIXES) {
    feries.push(new Date(annee, f.mois - 1, f.jour))
  }

  // Pâques (algorithme de Meeus/Jones/Butcher)
  const paques = calculerPaques(annee)
  feries.push(paques)

  // Lundi de Pâques
  feries.push(addDays(paques, 1))

  // Ascension (Pâques + 39 jours)
  feries.push(addDays(paques, 39))

  // Lundi de Pentecôte (Pâques + 50 jours)
  feries.push(addDays(paques, 50))

  // Fêtes musulmanes mobiles (dates approximatives, à ajuster chaque année)
  // Ramadan, Tabaski, Maouloud — nécessitent une table annuelle
  // Pour l'instant, on les gère comme dates configurables

  return feries
}

/**
 * Calcul de la date de Pâques (algorithme de Meeus/Jones/Butcher)
 */
export function calculerPaques(annee: number): Date {
  const a = annee % 19
  const b = Math.floor(annee / 100)
  const c = annee % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mois = Math.floor((h + l - 7 * m + 114) / 31)
  const jour = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(annee, mois - 1, jour)
}

/**
 * Vérifie si une date est un jour férié
 */
export function estJourFerie(date: Date, joursFeries: Date[]): boolean {
  return joursFeries.some((f) => isSameDay(date, f))
}

/**
 * Vérifie si une date est un jour ouvrable (ni weekend, ni férié)
 */
export function estJourOuvrable(date: Date, joursFeries: Date[]): boolean {
  return !isWeekend(date) && !estJourFerie(date, joursFeries)
}

/**
 * Ajoute N jours ouvrables à une date
 */
export function ajouterJoursOuvrables(
  dateDepart: Date,
  nbJours: number,
  joursFeries: Date[]
): Date {
  let date = new Date(dateDepart)
  let joursAjoutes = 0

  while (joursAjoutes < nbJours) {
    date = addDays(date, 1)
    if (estJourOuvrable(date, joursFeries)) {
      joursAjoutes++
    }
  }

  return date
}

/**
 * Ajoute N jours calendaires à une date
 */
export function ajouterJoursCalendaires(
  dateDepart: Date,
  nbJours: number
): Date {
  return addDays(dateDepart, nbJours)
}

// ─── Délais réglementaires par mode de passation ───

export interface DelaisMode {
  revueOC: number        // Jours ouvrables pour revue par l'organe de contrôle
  publicationMinimum: number // Jours calendaires minimum de publication
  ouverturePlis: number  // Jours calendaires après publication
  evaluationMax: number  // Jours ouvrables max pour évaluation
  standstill: number     // Jours ouvrables ou calendaires selon le cas
  signatureMax: number   // Jours ouvrables max pour signature
}

const DELAIS_PAR_MODE: Record<string, DelaisMode> = {
  AOO: {
    revueOC: 7,
    publicationMinimum: 30,
    ouverturePlis: 30,
    evaluationMax: 15,
    standstill: 10,    // 10 jours calendaires
    signatureMax: 5,
  },
  AOR: {
    revueOC: 7,
    publicationMinimum: 15,
    ouverturePlis: 15,
    evaluationMax: 15,
    standstill: 10,
    signatureMax: 5,
  },
  DRP: {
    revueOC: 5,
    publicationMinimum: 15,
    ouverturePlis: 15,
    evaluationMax: 10,
    standstill: 5,     // 5 jours ouvrables
    signatureMax: 5,
  },
  DC: {
    revueOC: 5,
    publicationMinimum: 10,
    ouverturePlis: 10,
    evaluationMax: 7,
    standstill: 5,
    signatureMax: 3,
  },
  AMI: {
    revueOC: 7,
    publicationMinimum: 21,
    ouverturePlis: 21,
    evaluationMax: 15,
    standstill: 10,
    signatureMax: 5,
  },
}

/**
 * Calcule le chronogramme complet pour une ligne PPM (FTS)
 * À partir d'une date de départ (réception du dossier par l'OC)
 */
export function calculerChronogrammeFTS(
  dateDepart: Date,
  modePassation: string,
  annee: number
): Record<string, Date> {
  const joursFeries = getJoursFeries(annee)
  const delais = DELAIS_PAR_MODE[modePassation] || DELAIS_PAR_MODE["DC"]

  // Réception dossier OC
  const dateReceptionOC = dateDepart

  // Avis de non-objection OC
  const dateAvisOC = ajouterJoursOuvrables(dateReceptionOC, delais.revueOC, joursFeries)

  // Bon à lancer (même jour que l'avis pour simplifier)
  const dateBAL = dateAvisOC

  // Autorisation lancement
  const dateAutorisationLancement = dateBAL

  // Publication
  const datePublication = ajouterJoursOuvrables(dateAutorisationLancement, 2, joursFeries)

  // Ouverture des plis
  const dateOuverturePlis = ajouterJoursCalendaires(datePublication, delais.ouverturePlis)

  // Rapport d'évaluation → OC
  const dateRapportEval = ajouterJoursOuvrables(dateOuverturePlis, delais.evaluationMax, joursFeries)

  // Avis OC évaluation
  const dateAvisOCEval = ajouterJoursOuvrables(dateRapportEval, delais.revueOC, joursFeries)

  // Examen juridique
  const dateExamenJuridique = ajouterJoursOuvrables(dateAvisOCEval, 3, joursFeries)

  // Approbation contrat
  const dateApprobation = ajouterJoursOuvrables(dateExamenJuridique, delais.signatureMax, joursFeries)

  // Notification contrat
  const dateNotification = ajouterJoursOuvrables(dateApprobation, 2, joursFeries)

  return {
    dateReceptionDossierOC: dateReceptionOC,
    dateAvisNonObjectionOC: dateAvisOC,
    dateBonALancer: dateBAL,
    dateAutorisationLancement: dateAutorisationLancement,
    datePublicationAvis: datePublication,
    dateOuverturePlis: dateOuverturePlis,
    dateReceptionRapportEval: dateRapportEval,
    dateAvisOCEvaluation: dateAvisOCEval,
    dateExamenJuridique: dateExamenJuridique,
    dateApprobationContrat: dateApprobation,
    dateNotificationContrat: dateNotification,
  }
}

/**
 * Formate une date au format utilisé dans le PPM (JJ-MM)
 */
export function formatDatePPM(date: Date): string {
  return format(date, "dd-MM", { locale: fr })
}

export { DELAIS_PAR_MODE }
