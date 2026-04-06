import { describe, it, expect } from "vitest"
import {
  calculerPaques,
  getJoursFeries,
  estJourOuvrable,
  estJourFerie,
  ajouterJoursOuvrables,
  calculerChronogrammeFTS,
} from "../delais-engine"

describe("delais-engine", () => {
  describe("calculerPaques", () => {
    it("calcule correctement Pâques 2026", () => {
      const paques = calculerPaques(2026)
      // Pâques 2026 = 5 avril
      expect(paques.getMonth()).toBe(3) // avril = 3 (0-indexed)
      expect(paques.getDate()).toBe(5)
    })

    it("calcule correctement Pâques 2025", () => {
      const paques = calculerPaques(2025)
      // Pâques 2025 = 20 avril
      expect(paques.getMonth()).toBe(3)
      expect(paques.getDate()).toBe(20)
    })
  })

  describe("getJoursFeries", () => {
    it("retourne au moins 10 jours fériés pour 2026", () => {
      const feries = getJoursFeries(2026)
      expect(feries.length).toBeGreaterThanOrEqual(10)
    })

    it("inclut le 1er janvier", () => {
      const feries = getJoursFeries(2026)
      const jourAn = feries.find(
        (d) => d.getMonth() === 0 && d.getDate() === 1
      )
      expect(jourAn).toBeDefined()
    })

    it("inclut le 10 janvier (Fête du Vodoun)", () => {
      const feries = getJoursFeries(2026)
      const vodoun = feries.find(
        (d) => d.getMonth() === 0 && d.getDate() === 10
      )
      expect(vodoun).toBeDefined()
    })

    it("inclut le 1er août (Indépendance)", () => {
      const feries = getJoursFeries(2026)
      const independance = feries.find(
        (d) => d.getMonth() === 7 && d.getDate() === 1
      )
      expect(independance).toBeDefined()
    })
  })

  describe("estJourOuvrable", () => {
    const feries2026 = getJoursFeries(2026)

    it("un lundi normal est ouvrable", () => {
      // 2 mars 2026 = lundi
      const lundi = new Date(2026, 2, 2)
      expect(estJourOuvrable(lundi, feries2026)).toBe(true)
    })

    it("un samedi n'est pas ouvrable", () => {
      const samedi = new Date(2026, 2, 7)
      expect(estJourOuvrable(samedi, feries2026)).toBe(false)
    })

    it("un dimanche n'est pas ouvrable", () => {
      const dimanche = new Date(2026, 2, 8)
      expect(estJourOuvrable(dimanche, feries2026)).toBe(false)
    })

    it("le 1er janvier n'est pas ouvrable", () => {
      const jourAn = new Date(2026, 0, 1)
      expect(estJourOuvrable(jourAn, feries2026)).toBe(false)
    })
  })

  describe("ajouterJoursOuvrables", () => {
    const feries2026 = getJoursFeries(2026)

    it("ajoute correctement 5 jours ouvrables (une semaine)", () => {
      // Lundi 2 mars 2026 + 5j ouvrables = lundi 9 mars 2026
      const depart = new Date(2026, 2, 2)
      const resultat = ajouterJoursOuvrables(depart, 5, feries2026)
      expect(resultat.getDate()).toBe(9)
      expect(resultat.getMonth()).toBe(2) // mars
    })

    it("saute les weekends", () => {
      // Vendredi 6 mars 2026 + 1j ouvrable = lundi 9 mars 2026
      const vendredi = new Date(2026, 2, 6)
      const resultat = ajouterJoursOuvrables(vendredi, 1, feries2026)
      expect(resultat.getDate()).toBe(9)
    })
  })

  describe("calculerChronogrammeFTS", () => {
    it("génère un chronogramme complet pour AOO", () => {
      const dateDepart = new Date(2026, 2, 1) // 1er mars 2026
      const chrono = calculerChronogrammeFTS(dateDepart, "AOO", 2026)

      expect(chrono.dateReceptionDossierOC).toBeDefined()
      expect(chrono.dateAvisNonObjectionOC).toBeDefined()
      expect(chrono.datePublicationAvis).toBeDefined()
      expect(chrono.dateOuverturePlis).toBeDefined()
      expect(chrono.dateNotificationContrat).toBeDefined()

      // L'ouverture des plis doit être après la publication
      expect(chrono.dateOuverturePlis.getTime()).toBeGreaterThan(
        chrono.datePublicationAvis.getTime()
      )

      // La notification doit être la dernière date
      expect(chrono.dateNotificationContrat.getTime()).toBeGreaterThan(
        chrono.dateApprobationContrat.getTime()
      )
    })

    it("génère un chronogramme pour DC", () => {
      const dateDepart = new Date(2026, 5, 1) // 1er juin 2026
      const chrono = calculerChronogrammeFTS(dateDepart, "DC", 2026)

      // DC a des délais plus courts que AOO
      const chronoAOO = calculerChronogrammeFTS(dateDepart, "AOO", 2026)

      const dureeAOO =
        chronoAOO.dateNotificationContrat.getTime() - dateDepart.getTime()
      const dureeDC =
        chrono.dateNotificationContrat.getTime() - dateDepart.getTime()

      expect(dureeDC).toBeLessThan(dureeAOO)
    })
  })
})
