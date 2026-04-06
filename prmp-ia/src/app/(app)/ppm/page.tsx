import { Header } from "@/components/layout/header"

// Données de démonstration — PPM SAB 2026
const lignesPPM = [
  {
    numero: 1,
    refN: "F_SSSI_116126",
    description: "Renouvellement outil de veille vulnérabilité technique",
    type: "F",
    mode: "DC",
    montant: 7_990_400,
    source: "BA",
    imputation: "624282",
    organe: "CCMP",
    ae: "Annuel",
    dateReceptionOC: "03-08",
    dateAvisOC: "03-08",
    dateAvisPTF: "03-08",
    dateBAL: "03-08",
    dateLancement: "03-08",
    datePublication: "03-08",
  },
  {
    numero: 2,
    refN: "T_DIE_118706",
    description: "Accord cadre curage caniveaux",
    type: "T",
    mode: "DC",
    montant: 8_493_600,
    source: "BA",
    imputation: "624181",
    organe: "CCMP",
    ae: "Annuel",
    dateReceptionOC: "16-02",
    dateAvisOC: "16-02",
    dateAvisPTF: "16-02",
    dateBAL: "16-02",
    dateLancement: "16-02",
    datePublication: "16-02",
  },
  {
    numero: 3,
    refN: "S_DSI_115117",
    description: "Mise en place SOC cybersécurité (accord cadre triennal)",
    type: "S",
    mode: "AOO",
    montant: 186_779_660,
    source: "BA",
    imputation: "624282",
    organe: "CCMP",
    ae: "Annuel",
    dateReceptionOC: "27-02",
    dateAvisOC: "02-03",
    dateAvisPTF: "15-01",
    dateBAL: "04-03",
    dateLancement: "05-03",
    datePublication: "09-03",
  },
]

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    F: "bg-purple-500/20 text-purple-400",
    T: "bg-orange-500/20 text-orange-400",
    S: "bg-cyan-500/20 text-cyan-400",
    PI: "bg-pink-500/20 text-pink-400",
  }
  return (
    <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium ${colors[type] || "bg-muted text-muted-foreground"}`}>
      {type}
    </span>
  )
}

function ModeBadge({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    AOO: "bg-green-500/20 text-green-400",
    DRP: "bg-blue-500/20 text-blue-400",
    DC: "bg-muted text-muted-foreground",
    DISPENSE: "bg-gray-500/20 text-gray-400",
  }
  return (
    <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium ${colors[mode] || "bg-muted text-muted-foreground"}`}>
      {mode}
    </span>
  )
}

function OrganeBadge({ organe }: { organe: string }) {
  const color = organe === "DNCMP" ? "text-red-400" : "text-green-400"
  return <span className={`font-medium ${color}`}>{organe}</span>
}

export default function PPMPage() {
  const montantTotal = lignesPPM.reduce((sum, l) => sum + l.montant, 0)

  return (
    <>
      <Header title="PPM SAB 2026" subtitle="Passation /" />

      <div className="p-6 space-y-4">
        {/* Onglets */}
        <div className="flex gap-6 border-b border-border">
          <button className="border-b-2 border-primary pb-3 text-sm font-medium text-primary">
            Fournitures, Travaux, Services
          </button>
          <button className="pb-3 text-sm text-muted-foreground hover:text-foreground">
            Prestations Intellectuelles
          </button>
          <button className="pb-3 text-sm text-muted-foreground hover:text-foreground">
            Tableau d&apos;arrimage
          </button>
        </div>

        {/* Info bannière */}
        <div className="flex items-center gap-3 rounded-lg bg-info/10 border border-info/20 px-4 py-3">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-info text-info-foreground text-xs font-bold">
            i
          </div>
          <p className="text-sm text-foreground">
            <strong>PPM SAB 2026 — Révision 1</strong> · Créé le 09-10-2025 · Transmis le 29-01-2026 · Validé le 30-01-2026 · 23 marchés FTS + 8 PI · Montant total : {montantTotal.toLocaleString("fr-FR")} FCFA
          </p>
        </div>

        {/* Barre d'actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Fournitures, Travaux et Services — {lignesPPM.length} lignes
          </p>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
              🔍 Rechercher
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
              ✨ Vérifier anti-fractionnement
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors">
              📊 Exporter Excel
            </button>
          </div>
        </div>

        {/* Tableau PPM */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th colSpan={3} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"></th>
                <th colSpan={7} className="border-l border-border px-3 py-2 text-center text-xs font-medium text-info uppercase">
                  Données de bases
                </th>
                <th colSpan={6} className="border-l border-border px-3 py-2 text-center text-xs font-medium text-warning uppercase">
                  Dossier d&apos;appel d&apos;offres
                </th>
              </tr>
              <tr className="border-b border-border bg-card">
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">N°</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">Réf N</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground min-w-[200px]">Description</th>
                <th className="border-l border-border px-3 py-3 text-center text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">Mode</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground">Montant FCFA</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">Source</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">Imput.</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">OC</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">AE</th>
                <th className="border-l border-border px-3 py-3 text-center text-xs font-medium text-muted-foreground">Récept. OC</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">Avis OC</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">Avis PTF</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">BAL</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">Lancement</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">Publication</th>
              </tr>
            </thead>
            <tbody>
              {lignesPPM.map((ligne) => (
                <tr
                  key={ligne.refN}
                  className="border-b border-border hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-3 py-3 text-muted-foreground">{ligne.numero}</td>
                  <td className="px-3 py-3 font-mono text-info">{ligne.refN}</td>
                  <td className="px-3 py-3 text-foreground">{ligne.description}</td>
                  <td className="border-l border-border px-3 py-3 text-center">
                    <TypeBadge type={ligne.type} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <ModeBadge mode={ligne.mode} />
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-foreground">
                    {ligne.montant.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{ligne.source}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{ligne.imputation}</td>
                  <td className="px-3 py-3 text-center">
                    <OrganeBadge organe={ligne.organe} />
                  </td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{ligne.ae}</td>
                  <td className="border-l border-border px-3 py-3 text-center text-muted-foreground">{ligne.dateReceptionOC}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{ligne.dateAvisOC}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{ligne.dateAvisPTF}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{ligne.dateBAL}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{ligne.dateLancement}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{ligne.datePublication}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-card">
                <td colSpan={5} className="px-3 py-3 font-semibold text-foreground">
                  COÛT TOTAL
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold text-success">
                  {montantTotal.toLocaleString("fr-FR")}
                </td>
                <td colSpan={10}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  )
}
