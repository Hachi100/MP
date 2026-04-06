/**
 * Moteur anti-fractionnement — Art. 24 al.7 Loi N°2020-26
 * Détecte le fractionnement artificiel des marchés :
 * si le cumul par catégorie ≥ seuil AOO mais chaque ligne < seuil → BLOCAGE
 */

import type { TypeMarche, ModePassation } from "@prisma/client"
import { SEUILS, calculerModePassation } from "./seuils-engine"

export interface LignePPMSimplifiee {
  refN: string
  description: string
  typeMarche: TypeMarche
  montantEstimatif: number
  imputationBudgetaire: string
  modePassation: ModePassation
}

export interface AlerteFractionnement {
  categorie: TypeMarche
  imputation: string
  cumulMontant: number
  seuilAOO: number
  lignesConcernees: string[] // refN des lignes
  message: string
  severite: "BLOQUANT" | "AVERTISSEMENT"
}

/**
 * Vérifie le fractionnement pour une liste de lignes PPM
 * Groupe par type de marché + imputation budgétaire
 */
export function verifierAntiFractionnement(
  lignes: LignePPMSimplifiee[]
): AlerteFractionnement[] {
  const alertes: AlerteFractionnement[] = []

  // Grouper par typeMarche + imputation budgétaire
  const groupes = new Map<string, LignePPMSimplifiee[]>()

  for (const ligne of lignes) {
    const cle = `${ligne.typeMarche}::${ligne.imputationBudgetaire}`
    if (!groupes.has(cle)) {
      groupes.set(cle, [])
    }
    groupes.get(cle)!.push(ligne)
  }

  for (const [cle, groupeLignes] of groupes) {
    // Ignorer les groupes d'une seule ligne
    if (groupeLignes.length <= 1) continue

    const [typeMarche] = cle.split("::") as [TypeMarche, string]
    const imputation = cle.split("::")[1]
    const seuilsType = SEUILS[typeMarche]

    if (!seuilsType) continue

    const cumulMontant = groupeLignes.reduce((sum, l) => sum + l.montantEstimatif, 0)
    const toutesEnDessous = groupeLignes.every(
      (l) => l.montantEstimatif < seuilsType.AOO
    )

    // Fractionnement BLOQUANT : cumul ≥ seuil AOO mais chaque ligne < seuil
    if (cumulMontant >= seuilsType.AOO && toutesEnDessous) {
      const modeAttendu = calculerModePassation(typeMarche, cumulMontant)

      alertes.push({
        categorie: typeMarche,
        imputation,
        cumulMontant,
        seuilAOO: seuilsType.AOO,
        lignesConcernees: groupeLignes.map((l) => l.refN),
        message:
          `Risque de fractionnement détecté : ${groupeLignes.length} marchés de ${typeMarche} ` +
          `sur l'imputation ${imputation} totalisent ${cumulMontant.toLocaleString("fr-FR")} FCFA ` +
          `(seuil AOO : ${seuilsType.AOO.toLocaleString("fr-FR")} FCFA). ` +
          `Le mode attendu serait ${modeAttendu}.`,
        severite: "BLOQUANT",
      })
    }

    // Avertissement : cumul ≥ seuil DRP mais chaque ligne < seuil DRP
    const toutesEnDessousDRP = groupeLignes.every(
      (l) => l.montantEstimatif < seuilsType.DRP_MIN
    )

    if (
      cumulMontant >= seuilsType.DRP_MIN &&
      cumulMontant < seuilsType.AOO &&
      toutesEnDessousDRP
    ) {
      alertes.push({
        categorie: typeMarche,
        imputation,
        cumulMontant,
        seuilAOO: seuilsType.AOO,
        lignesConcernees: groupeLignes.map((l) => l.refN),
        message:
          `Attention : ${groupeLignes.length} marchés de ${typeMarche} ` +
          `sur l'imputation ${imputation} totalisent ${cumulMontant.toLocaleString("fr-FR")} FCFA ` +
          `(seuil DRP : ${seuilsType.DRP_MIN.toLocaleString("fr-FR")} FCFA). Vérifiez la justification.`,
        severite: "AVERTISSEMENT",
      })
    }
  }

  return alertes
}

/**
 * Vérifie si un ajout de ligne créerait un fractionnement
 */
export function verifierAjoutLigne(
  lignesExistantes: LignePPMSimplifiee[],
  nouvelleLigne: LignePPMSimplifiee
): AlerteFractionnement[] {
  return verifierAntiFractionnement([...lignesExistantes, nouvelleLigne])
}
