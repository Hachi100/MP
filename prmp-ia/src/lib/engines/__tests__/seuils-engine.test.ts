import { describe, it, expect } from "vitest"
import {
  calculerModePassation,
  calculerOrganeControle,
  calculerSeuils,
  verifierCoherenceMode,
} from "../seuils-engine"

describe("seuils-engine", () => {
  describe("calculerModePassation", () => {
    // Travaux
    it("retourne AOO pour travaux ≥ 100M", () => {
      expect(calculerModePassation("TRAVAUX", 100_000_000)).toBe("AOO")
      expect(calculerModePassation("TRAVAUX", 150_000_000)).toBe("AOO")
    })

    it("retourne DRP pour travaux entre 10M et 100M", () => {
      expect(calculerModePassation("TRAVAUX", 10_000_000)).toBe("DRP")
      expect(calculerModePassation("TRAVAUX", 50_000_000)).toBe("DRP")
      expect(calculerModePassation("TRAVAUX", 99_999_999)).toBe("DRP")
    })

    it("retourne DC pour travaux entre 4M et 10M", () => {
      expect(calculerModePassation("TRAVAUX", 4_000_000)).toBe("DC")
      expect(calculerModePassation("TRAVAUX", 7_000_000)).toBe("DC")
      expect(calculerModePassation("TRAVAUX", 9_999_999)).toBe("DC")
    })

    it("retourne DISPENSE pour travaux < 4M", () => {
      expect(calculerModePassation("TRAVAUX", 3_999_999)).toBe("DISPENSE")
      expect(calculerModePassation("TRAVAUX", 1_000_000)).toBe("DISPENSE")
      expect(calculerModePassation("TRAVAUX", 0)).toBe("DISPENSE")
    })

    // Fournitures/Services
    it("retourne AOO pour fournitures ≥ 70M", () => {
      expect(calculerModePassation("FOURNITURES", 70_000_000)).toBe("AOO")
    })

    it("retourne DRP pour fournitures entre 10M et 70M", () => {
      expect(calculerModePassation("FOURNITURES", 30_000_000)).toBe("DRP")
    })

    it("retourne AOO pour services ≥ 70M", () => {
      expect(calculerModePassation("SERVICES", 70_000_000)).toBe("AOO")
    })

    // PI cabinets
    it("retourne AOO pour PI cabinet ≥ 50M", () => {
      expect(calculerModePassation("PI_CABINET", 50_000_000)).toBe("AOO")
    })

    it("retourne DRP pour PI cabinet entre 10M et 50M", () => {
      expect(calculerModePassation("PI_CABINET", 25_000_000)).toBe("DRP")
    })

    // PI individuels
    it("retourne AOO pour PI individuel ≥ 20M", () => {
      expect(calculerModePassation("PI_INDIVIDUEL", 20_000_000)).toBe("AOO")
    })

    it("retourne DRP pour PI individuel entre 10M et 20M", () => {
      expect(calculerModePassation("PI_INDIVIDUEL", 15_000_000)).toBe("DRP")
    })

    it("retourne DC pour PI individuel entre 4M et 10M", () => {
      expect(calculerModePassation("PI_INDIVIDUEL", 5_000_000)).toBe("DC")
    })
  })

  describe("calculerOrganeControle", () => {
    it("retourne DNCMP pour travaux ≥ 500M", () => {
      expect(calculerOrganeControle("TRAVAUX", 500_000_000)).toBe("DNCMP")
      expect(calculerOrganeControle("TRAVAUX", 1_000_000_000)).toBe("DNCMP")
    })

    it("retourne CCMP pour travaux < 500M", () => {
      expect(calculerOrganeControle("TRAVAUX", 499_999_999)).toBe("CCMP")
    })

    it("retourne DNCMP pour fournitures ≥ 300M", () => {
      expect(calculerOrganeControle("FOURNITURES", 300_000_000)).toBe("DNCMP")
    })

    it("retourne CCMP pour fournitures < 300M", () => {
      expect(calculerOrganeControle("FOURNITURES", 299_999_999)).toBe("CCMP")
    })

    it("retourne DNCMP pour PI cabinet ≥ 200M", () => {
      expect(calculerOrganeControle("PI_CABINET", 200_000_000)).toBe("DNCMP")
    })

    it("retourne DNCMP pour PI individuel ≥ 100M", () => {
      expect(calculerOrganeControle("PI_INDIVIDUEL", 100_000_000)).toBe("DNCMP")
    })
  })

  describe("calculerSeuils", () => {
    it("retourne le bon résultat combiné", () => {
      const resultat = calculerSeuils("TRAVAUX", 150_000_000)
      expect(resultat.modePassation).toBe("AOO")
      expect(resultat.organeControle).toBe("CCMP")
      expect(resultat.estDispense).toBe(false)
    })

    it("marque estDispense = true pour les dispenses", () => {
      const resultat = calculerSeuils("FOURNITURES", 2_000_000)
      expect(resultat.modePassation).toBe("DISPENSE")
      expect(resultat.estDispense).toBe(true)
    })
  })

  describe("verifierCoherenceMode", () => {
    it("retourne cohérent si le mode est correct", () => {
      const result = verifierCoherenceMode("TRAVAUX", 150_000_000, "AOO")
      expect(result.coherent).toBe(true)
    })

    it("retourne incohérent si le mode est incorrect", () => {
      const result = verifierCoherenceMode("TRAVAUX", 150_000_000, "DC")
      expect(result.coherent).toBe(false)
      expect(result.modeAttendu).toBe("AOO")
      expect(result.message).toBeDefined()
    })
  })
})
