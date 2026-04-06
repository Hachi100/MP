import { describe, it, expect } from "vitest"
import {
  verifierAntiFractionnement,
  verifierAjoutLigne,
  type LignePPMSimplifiee,
} from "../anti-fractionnement"

describe("anti-fractionnement", () => {
  describe("verifierAntiFractionnement", () => {
    it("ne détecte rien pour une seule ligne", () => {
      const lignes: LignePPMSimplifiee[] = [
        {
          refN: "F_DSI_001",
          description: "Fournitures informatiques",
          typeMarche: "FOURNITURES",
          montantEstimatif: 50_000_000,
          imputationBudgetaire: "624202",
          modePassation: "DRP",
        },
      ]

      const alertes = verifierAntiFractionnement(lignes)
      expect(alertes).toHaveLength(0)
    })

    it("détecte un fractionnement BLOQUANT pour fournitures", () => {
      // 3 marchés de fournitures qui totalisent > 70M (seuil AOO)
      // mais chacun < 70M
      const lignes: LignePPMSimplifiee[] = [
        {
          refN: "F_DSI_001",
          description: "Fournitures lot 1",
          typeMarche: "FOURNITURES",
          montantEstimatif: 25_000_000,
          imputationBudgetaire: "624202",
          modePassation: "DRP",
        },
        {
          refN: "F_DSI_002",
          description: "Fournitures lot 2",
          typeMarche: "FOURNITURES",
          montantEstimatif: 25_000_000,
          imputationBudgetaire: "624202",
          modePassation: "DRP",
        },
        {
          refN: "F_DSI_003",
          description: "Fournitures lot 3",
          typeMarche: "FOURNITURES",
          montantEstimatif: 25_000_000,
          imputationBudgetaire: "624202",
          modePassation: "DRP",
        },
      ]

      const alertes = verifierAntiFractionnement(lignes)
      expect(alertes.length).toBeGreaterThanOrEqual(1)

      const bloquant = alertes.find((a) => a.severite === "BLOQUANT")
      expect(bloquant).toBeDefined()
      expect(bloquant!.cumulMontant).toBe(75_000_000)
      expect(bloquant!.lignesConcernees).toHaveLength(3)
    })

    it("ne déclenche pas d'alerte si au moins une ligne ≥ seuil AOO", () => {
      const lignes: LignePPMSimplifiee[] = [
        {
          refN: "F_DSI_001",
          description: "Fournitures lot 1",
          typeMarche: "FOURNITURES",
          montantEstimatif: 70_000_000, // ≥ seuil AOO
          imputationBudgetaire: "624202",
          modePassation: "AOO",
        },
        {
          refN: "F_DSI_002",
          description: "Fournitures lot 2",
          typeMarche: "FOURNITURES",
          montantEstimatif: 25_000_000,
          imputationBudgetaire: "624202",
          modePassation: "DRP",
        },
      ]

      const alertes = verifierAntiFractionnement(lignes)
      const bloquants = alertes.filter((a) => a.severite === "BLOQUANT")
      expect(bloquants).toHaveLength(0)
    })

    it("ne regroupe pas des imputations différentes", () => {
      const lignes: LignePPMSimplifiee[] = [
        {
          refN: "F_DSI_001",
          description: "Fournitures lot 1",
          typeMarche: "FOURNITURES",
          montantEstimatif: 40_000_000,
          imputationBudgetaire: "624202",
          modePassation: "DRP",
        },
        {
          refN: "F_DSI_002",
          description: "Fournitures lot 2",
          typeMarche: "FOURNITURES",
          montantEstimatif: 40_000_000,
          imputationBudgetaire: "624301", // Imputation différente
          modePassation: "DRP",
        },
      ]

      const alertes = verifierAntiFractionnement(lignes)
      const bloquants = alertes.filter((a) => a.severite === "BLOQUANT")
      expect(bloquants).toHaveLength(0)
    })

    it("détecte un avertissement pour cumul ≥ seuil DRP", () => {
      // 3 marchés < 10M chacun mais cumul ≥ 10M
      const lignes: LignePPMSimplifiee[] = [
        {
          refN: "F_DSI_001",
          description: "Fournitures lot 1",
          typeMarche: "FOURNITURES",
          montantEstimatif: 5_000_000,
          imputationBudgetaire: "624202",
          modePassation: "DC",
        },
        {
          refN: "F_DSI_002",
          description: "Fournitures lot 2",
          typeMarche: "FOURNITURES",
          montantEstimatif: 5_000_000,
          imputationBudgetaire: "624202",
          modePassation: "DC",
        },
        {
          refN: "F_DSI_003",
          description: "Fournitures lot 3",
          typeMarche: "FOURNITURES",
          montantEstimatif: 5_000_000,
          imputationBudgetaire: "624202",
          modePassation: "DC",
        },
      ]

      const alertes = verifierAntiFractionnement(lignes)
      const avertissement = alertes.find((a) => a.severite === "AVERTISSEMENT")
      expect(avertissement).toBeDefined()
    })

    it("détecte un fractionnement pour travaux ≥ 100M", () => {
      const lignes: LignePPMSimplifiee[] = [
        {
          refN: "T_DIE_001",
          description: "Travaux lot 1",
          typeMarche: "TRAVAUX",
          montantEstimatif: 40_000_000,
          imputationBudgetaire: "2341",
          modePassation: "DRP",
        },
        {
          refN: "T_DIE_002",
          description: "Travaux lot 2",
          typeMarche: "TRAVAUX",
          montantEstimatif: 35_000_000,
          imputationBudgetaire: "2341",
          modePassation: "DRP",
        },
        {
          refN: "T_DIE_003",
          description: "Travaux lot 3",
          typeMarche: "TRAVAUX",
          montantEstimatif: 30_000_000,
          imputationBudgetaire: "2341",
          modePassation: "DRP",
        },
      ]

      const alertes = verifierAntiFractionnement(lignes)
      const bloquant = alertes.find((a) => a.severite === "BLOQUANT")
      expect(bloquant).toBeDefined()
      expect(bloquant!.cumulMontant).toBe(105_000_000)
    })
  })

  describe("verifierAjoutLigne", () => {
    it("détecte un fractionnement lors de l'ajout d'une ligne", () => {
      const existantes: LignePPMSimplifiee[] = [
        {
          refN: "F_DSI_001",
          description: "Fournitures lot 1",
          typeMarche: "FOURNITURES",
          montantEstimatif: 40_000_000,
          imputationBudgetaire: "624202",
          modePassation: "DRP",
        },
      ]

      const nouvelle: LignePPMSimplifiee = {
        refN: "F_DSI_002",
        description: "Fournitures lot 2",
        typeMarche: "FOURNITURES",
        montantEstimatif: 35_000_000,
        imputationBudgetaire: "624202",
        modePassation: "DRP",
      }

      const alertes = verifierAjoutLigne(existantes, nouvelle)
      const bloquant = alertes.find((a) => a.severite === "BLOQUANT")
      expect(bloquant).toBeDefined()
    })
  })
})
