"use client"

import { Bell, Plus, Search } from "lucide-react"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        {subtitle && (
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        )}
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Recherche */}
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <Search className="h-4 w-4" />
        </button>

        {/* Alertes */}
        <button className="relative flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning hover:bg-warning/20 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="font-medium">3 alertes</span>
        </button>

        {/* Nouveau marché */}
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Nouveau marché
        </button>
      </div>
    </header>
  )
}
