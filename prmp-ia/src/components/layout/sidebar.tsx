"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileText,
  Globe,
  FolderOpen,
  ClipboardCheck,
  Award,
  Hammer,
  Archive,
  Download,
  Users,
  BarChart3,
  CalendarDays,
  Cpu,
  Star,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navigation: NavGroup[] = [
  {
    title: "PRINCIPAL",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
      { label: "Tableau Kanban", href: "/dashboard/kanban", icon: CalendarDays },
      { label: "Planification Gantt", href: "/dashboard/gantt", icon: BarChart3 },
      { label: "Analytique & KPIs", href: "/dashboard/analytics", icon: Star },
    ],
  },
  {
    title: "PASSATION",
    items: [
      { label: "M1 — PPM", href: "/ppm", icon: FileSpreadsheet },
      { label: "Import PTAB", href: "/ppm/import-ptab", icon: Download },
      { label: "M2 — DAO", href: "/dao", icon: FileText },
      { label: "M3 — Publication", href: "/publication", icon: Globe },
      { label: "M4 — Ouverture", href: "/ouverture", icon: FolderOpen },
      { label: "M5 — Évaluation", href: "/evaluation", icon: ClipboardCheck },
      { label: "M6 — Attribution", href: "/attribution", icon: Award },
    ],
  },
  {
    title: "EXÉCUTION",
    items: [
      { label: "M7 — Exécution", href: "/execution", icon: Hammer },
      { label: "M8 — Archivage", href: "/archivage", icon: Archive },
    ],
  },
  {
    title: "MODULES IA",
    items: [
      { label: "Import PTAB → PPM", href: "/ia/import-ptab", icon: Cpu },
      { label: "Génération DAO", href: "/ia/generation-dao", icon: Cpu },
      { label: "Publication AO", href: "/ia/publication-ao", icon: Cpu },
      { label: "Évaluation & Attribution", href: "/ia/evaluation", icon: Cpu },
      { label: "Suivi & Archivage", href: "/ia/suivi", icon: Cpu },
    ],
  },
  {
    title: "ÉQUIPE",
    items: [
      { label: "Membres", href: "/equipe", icon: Users },
      { label: "Performances", href: "/equipe/performances", icon: Star },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          P
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground">PRMP-IA</p>
          <p className="text-xs text-muted-foreground">Bénin · Exercice 2026</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
          <svg
            className="h-4 w-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-sm text-muted-foreground">Rechercher...</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navigation.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-secondary hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
