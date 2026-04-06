import { Header } from "@/components/layout/header"
import {
  FileSpreadsheet,
  DollarSign,
  Clock,
  CheckCircle,
  Timer,
} from "lucide-react"

// Composant KPI Card
function KpiCard({
  label,
  value,
  subValue,
  color,
}: {
  label: string
  value: string
  subValue?: string
  color: string
}) {
  return (
    <div className="rounded-xl bg-card p-5 border-t-2" style={{ borderTopColor: color }}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      {subValue && (
        <p className="mt-1 text-sm text-muted-foreground">{subValue}</p>
      )}
    </div>
  )
}

// Pipeline card
function PipelineCard({
  title,
  info,
  statut,
  statutColor,
}: {
  title: string
  info: string
  statut: string
  statutColor: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-secondary/50 transition-colors">
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{info}</p>
      </div>
      <span
        className="rounded-full px-3 py-1 text-xs font-medium"
        style={{
          backgroundColor: `${statutColor}20`,
          color: statutColor,
        }}
      >
        {statut}
      </span>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <>
      <Header title="Vue d'ensemble" subtitle="Tableau de bord" />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Marchés planifiés"
            value="47"
            subValue="↗ +12 ce mois"
            color="#22c55e"
          />
          <KpiCard
            label="Budget total (FCFA)"
            value="2,4 Mds"
            subValue="Exercice 2026"
            color="#3b82f6"
          />
          <KpiCard
            label="En attente CCMP"
            value="8"
            subValue="⏱ Délai max : 3j"
            color="#f59e0b"
          />
          <KpiCard
            label="Conformité ARMP"
            value="94%"
            subValue="↗ +3% vs T4 2025"
            color="#22c55e"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Pipeline des marchés actifs */}
          <div className="lg:col-span-2 rounded-xl bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Pipeline des marchés actifs
              </h2>
              <button className="text-sm text-primary hover:underline">
                Voir Kanban &gt;
              </button>
            </div>
            <div className="space-y-3">
              <PipelineCard
                title="Acquisition équipements informatiques"
                info="AOO · 85 000 000 FCFA · DNCMP"
                statut="Révision"
                statutColor="#f59e0b"
              />
              <PipelineCard
                title="Travaux réhabilitation bâtiment A"
                info="AOO · 120 000 000 FCFA · DNCMP"
                statut="Validé"
                statutColor="#22c55e"
              />
              <PipelineCard
                title="Prestations conseil juridique"
                info="AMI · 18 000 000 FCFA · CCMP"
                statut="Validé"
                statutColor="#22c55e"
              />
              <PipelineCard
                title="Services maintenance véhicules"
                info="DRP · 22 500 000 FCFA · CCMP"
                statut="En cours"
                statutColor="#3b82f6"
              />
              <PipelineCard
                title="Achats fournitures T1 — fusion ×6"
                info="Dispense · 3 800 000 FCFA"
                statut="Brouillon"
                statutColor="#94a3b8"
              />
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Répartition par mode */}
            <div className="rounded-xl bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Répartition par mode
              </h2>
              <div className="space-y-3">
                {[
                  { mode: "AOO", count: 18, pct: "38%", color: "#8b5cf6" },
                  { mode: "DRP", count: 11, pct: "23%", color: "#22c55e" },
                  { mode: "DC", count: 8, pct: "17%", color: "#3b82f6" },
                  { mode: "PI/AMI", count: 10, pct: "21%", color: "#f59e0b" },
                ].map((item) => (
                  <div key={item.mode} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-foreground">{item.mode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {item.count}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.pct}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activité récente */}
            <div className="rounded-xl bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Activité récente
              </h2>
              <div className="space-y-4">
                {[
                  {
                    text: "PPM généré — PTAB SAB 2026",
                    time: "Aujourd'hui · 09:14",
                    color: "#22c55e",
                  },
                  {
                    text: "Validation CCMP reçue — #PPM-014",
                    time: "Hier · 16:42",
                    color: "#3b82f6",
                  },
                  {
                    text: "Avis DNCMP — 3 marchés à corriger",
                    time: "03/04 · 11:30",
                    color: "#f59e0b",
                  },
                  {
                    text: "Nouveau compte SPMP — D. Favi",
                    time: "31/03 · 08:00",
                    color: "#94a3b8",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <p className="text-sm text-foreground">{item.text}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
