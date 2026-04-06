/**
 * Moteur de seuils — Décret 2020-599
 * Détermine le mode de passation et l'organe de contrôle compétent
 * selon le type de marché et le montant estimatif (FCFA HT)
 */

import type { TypeMarche, ModePassation, OrganeControle } from "@prisma/client"

// Seuils en FCFA HT — Décret 2020-599
const SEUILS = {
  TRAVAUX: { AOO: 100_000_000, DRP_MIN: 10_000_000, DC_MIN: 4_000_000 },
  FOURNITURES: { AOO: 70_000_000, DRP_MIN: 10_000_000, DC_MIN: 4_000_000 },
  SERVICES: { AOO: 70_000_000, DRP_MIN: 10_000_000, DC_MIN: 4_000_000 },
  PI_CABINET: { AOO: 50_000_000, DRP_MIN: 10_000_000, DC_MIN: 4_000_000 },
  PI_INDIVIDUEL: { AOO: 20_000_000, DRP_MIN: 10_000_000, DC_MIN: 4_000_000 },
} as const

// Seuils DNCMP (sinon CCMP)
const SEUILS_DNCMP = {
  TRAVAUX: 500_000_000,
  FOURNITURES: 300_000_000,
  SERVICES: 300_000_000,
  PI_CABINET: 200_000_000,
  PI_INDIVIDUEL: 100_000_000,
} as const

export interface ResultatSeuil {
  modePassation: ModePassation
  organeControle: OrganeControle
  estDispense: boolean
}

/**
 * Détermine le mode de passation selon le type de marché et le montant
 */
export function calculerModePassation(
  typeMarche: TypeMarche,
  montant: number
): ModePassation {
  const seuils = SEUILS[typeMarche]
  if (!seuils) {
    throw new Error(`Type de marché inconnu : ${typeMarche}`)
  }

  if (montant >= seuils.AOO) return "AOO"
  if (montant >= seuils.DRP_MIN) return "DRP"
  if (montant >= seuils.DC_MIN) return "DC"
  return "DISPENSE"
}

/**
 * Détermine l'organe de contrôle compétent
 * DNCMP si le montant dépasse le seuil DNCMP, sinon CCMP
 */
export function calculerOrganeControle(
  typeMarche: TypeMarche,
  montant: number
): OrganeControle {
  const seuilDNCMP = SEUILS_DNCMP[typeMarche]
  if (seuilDNCMP === undefined) {
    throw new Error(`Type de marché inconnu : ${typeMarche}`)
  }

  return montant >= seuilDNCMP ? "DNCMP" : "CCMP"
}

/**
 * Calcule le mode de passation et l'organe de contrôle pour un marché
 */
export function calculerSeuils(
  typeMarche: TypeMarche,
  montant: number
): ResultatSeuil {
  const modePassation = calculerModePassation(typeMarche, montant)
  const organeControle = calculerOrganeControle(typeMarche, montant)

  return {
    modePassation,
    organeControle,
    estDispense: modePassation === "DISPENSE",
  }
}

/**
 * Vérifie si un mode de passation est cohérent avec le montant
 * Retourne une erreur si le mode ne correspond pas au montant
 */
export function verifierCoherenceMode(
  typeMarche: TypeMarche,
  montant: number,
  modeActuel: ModePassation
): { coherent: boolean; modeAttendu: ModePassation; message?: string } {
  const modeAttendu = calculerModePassation(typeMarche, montant)

  if (modeActuel === modeAttendu) {
    return { coherent: true, modeAttendu }
  }

  return {
    coherent: false,
    modeAttendu,
    message: `Le montant ${montant.toLocaleString("fr-FR")} FCFA pour un marché de type ${typeMarche} nécessite le mode ${modeAttendu}, pas ${modeActuel}`,
  }
}

/**
 * Retourne les seuils pour un type de marché donné (utile pour l'UI)
 */
export function getSeuilsPourType(typeMarche: TypeMarche) {
  return SEUILS[typeMarche]
}

export { SEUILS, SEUILS_DNCMP }
